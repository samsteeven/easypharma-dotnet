using EasyPharma.Api.Domain;
using EasyPharma.Api.Dtos;

namespace EasyPharma.Api.Services;

public static class Mapping
{
    public static UserResponse ToResponse(User u, string? pharmacyName = null) =>
        new(u.Id, u.Email, u.FirstName, u.LastName, u.Phone, u.Role, u.Address, u.City, u.Latitude, u.Longitude,
            u.IsActive, u.IsVerified, u.CreatedAt, u.PharmacyId, pharmacyName);

    public static MedicationDto ToDto(Medication m) =>
        new(m.Id, m.Name, m.GenericName, m.TherapeuticClass, m.Description, m.Dosage, m.PhotoUrl, m.NoticePdfUrl,
            m.RequiresPrescription);

    public static PharmacyDto ToDto(Pharmacy p) =>
        new(p.Id, p.UserId, p.Owner.FirstName, p.Owner.LastName, p.Owner.Email, p.Name, p.LicenseNumber, p.Address,
            p.City, p.Phone, p.Latitude, p.Longitude, p.Description, p.OpeningHours, p.AverageRating, p.RatingCount,
            p.Status, p.LicenseDocumentUrl, p.ValidatedAt, p.CreatedAt, p.UpdatedAt);

    public static OrderDto ToDto(Order o) =>
        new(o.Id, o.OrderNumber, o.PatientId, $"{o.Patient.FirstName} {o.Patient.LastName}", o.PharmacyId,
            o.Pharmacy.Name, o.TotalAmount, o.DeliveryFee, o.Status, o.DeliveryAddress, o.DeliveryCity,
            o.DeliveryPhone, o.CreatedAt,
            o.Items.Select(i => new OrderItemDto(i.Id, i.MedicationId, i.Medication.Name, i.Quantity, i.UnitPrice,
                i.Subtotal)).ToList());
}
