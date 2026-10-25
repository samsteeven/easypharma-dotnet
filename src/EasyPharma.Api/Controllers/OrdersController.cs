using EasyPharma.Api.Data;
using EasyPharma.Api.Domain;
using EasyPharma.Api.Dtos;
using EasyPharma.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyPharma.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/v1/orders")]
public class OrdersController(EasyPharmaDbContext db) : ControllerBase
{
    private IQueryable<Order> OrdersWithDetails() => db.Orders.AsNoTracking()
        .Include(o => o.Patient).Include(o => o.Pharmacy).Include(o => o.Items).ThenInclude(i => i.Medication);

    /// <summary>
    /// Crée une commande chez une pharmacie approuvée. Mêmes règles que le backend Spring Boot :
    /// stock vérifié ligne par ligne, prix figés à la commande, frais de livraison selon la distance,
    /// statut initial PENDING.
    /// </summary>
    [Authorize(Roles = "PATIENT")]
    [HttpPost]
    public async Task<ActionResult<OrderDto>> Create(CreateOrderDto request)
    {
        var patientId = User.GetUserId();
        var patient = await db.Users.FindAsync(patientId);
        if (patient is null) return NotFound("Patient introuvable");

        var pharmacy = await db.Pharmacies.FindAsync(request.PharmacyId);
        if (pharmacy is null) return NotFound("Pharmacie introuvable");
        if (pharmacy.Status != PharmacyStatus.APPROVED)
            return BadRequest($"Commande impossible : la pharmacie n'est pas approuvée ({pharmacy.Status})");

        var now = DateTime.UtcNow;
        var order = new Order
        {
            Id = Guid.NewGuid(),
            OrderNumber = $"ORD-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
            PatientId = patientId,
            PharmacyId = pharmacy.Id,
            Status = OrderStatus.PENDING,
            DeliveryAddress = request.DeliveryAddress,
            DeliveryCity = request.DeliveryCity,
            DeliveryPhone = request.DeliveryPhone,
            DeliveryLatitude = (decimal?)request.DeliveryLatitude,
            DeliveryLongitude = (decimal?)request.DeliveryLongitude,
            Notes = request.Notes,
            CreatedAt = now,
            UpdatedAt = now,
        };

        var offers = await db.PharmacyMedications
            .Include(pm => pm.Medication)
            .Where(pm => pm.PharmacyId == pharmacy.Id)
            .ToDictionaryAsync(pm => pm.MedicationId);

        decimal total = 0;
        foreach (var line in request.Items)
        {
            if (!offers.TryGetValue(line.MedicationId, out var offer))
                return BadRequest("Médicament introuvable dans cette pharmacie");
            if (!offer.IsAvailable || offer.StockQuantity < line.Quantity)
                return BadRequest($"Stock insuffisant pour : {offer.Medication.Name}");

            var subtotal = offer.Price * line.Quantity;
            total += subtotal;
            order.Items.Add(new OrderItem
            {
                Id = Guid.NewGuid(),
                OrderId = order.Id,
                MedicationId = offer.MedicationId,
                Quantity = line.Quantity,
                UnitPrice = offer.Price,
                Subtotal = subtotal,
                CreatedAt = now,
            });
        }

        var fee = request.DeliveryLatitude is { } lat && request.DeliveryLongitude is { } lon
            ? DeliveryFee.Calculate(Geo.DistanceKm((double)pharmacy.Latitude, (double)pharmacy.Longitude, lat, lon))
            : 0m;
        order.DeliveryFee = fee;
        order.TotalAmount = total + fee;

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var saved = await OrdersWithDetails().FirstAsync(o => o.Id == order.Id);
        return CreatedAtAction(nameof(Get), new { id = order.Id }, Mapping.ToDto(saved));
    }

    [HttpGet("my-orders")]
    public async Task<IEnumerable<OrderDto>> MyOrders()
    {
        var patientId = User.GetUserId();
        var orders = await OrdersWithDetails().Where(o => o.PatientId == patientId)
            .OrderByDescending(o => o.CreatedAt).ToListAsync();
        return orders.Select(Mapping.ToDto);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDto>> Get(Guid id)
    {
        var order = await OrdersWithDetails().FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return NotFound();

        // Un patient ne voit que ses commandes ; le personnel de la pharmacie voit celles de sa pharmacie.
        var userId = User.GetUserId();
        var isOwner = order.PatientId == userId;
        var isStaff = User.IsInRole("SUPER_ADMIN")
                      || await db.Users.AnyAsync(u => u.Id == userId && u.PharmacyId == order.PharmacyId)
                      || order.Pharmacy.UserId == userId;
        return isOwner || isStaff ? Mapping.ToDto(order) : Forbid();
    }
}
