using EasyPharma.Api.Data;
using EasyPharma.Api.Domain;
using EasyPharma.Api.Dtos;
using EasyPharma.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyPharma.Api.Controllers;

/// <summary>
/// Recherche globale d'un médicament dans les pharmacies approuvées (GET /api/v1/patient/search).
/// Tris : PRICE (défaut), RATING, NEAREST (Haversine en mémoire) et POSTGIS_NEAREST (STDistance en SQL Server ;
/// le nom historique est conservé pour que le front Angular reste inchangé).
/// </summary>
[ApiController]
[Authorize]
[Route("api/v1/patient/search")]
public class PatientSearchController(EasyPharmaDbContext db) : ControllerBase
{
    private sealed record OfferDistance(Guid Id, double DistanceM);

    [HttpGet]
    public async Task<ActionResult<List<PatientMedicationSearchResultDto>>> Search(
        [FromQuery] string query = "",
        [FromQuery] string? therapeuticClass = null,
        [FromQuery] string sortBy = "PRICE",
        [FromQuery] double? userLat = null,
        [FromQuery] double? userLon = null)
    {
        // Comme côté Spring Boot : sans coordonnées explicites, on prend celles du profil de l'utilisateur.
        if (userLat is null || userLon is null)
        {
            var profile = await db.Users.AsNoTracking().Where(u => u.Id == User.GetUserId())
                .Select(u => new { u.Latitude, u.Longitude }).FirstOrDefaultAsync();
            userLat ??= (double?)profile?.Latitude;
            userLon ??= (double?)profile?.Longitude;
        }

        var q = (query ?? "").ToLowerInvariant();
        var pharmacyOffers = db.PharmacyMedications.AsNoTracking()
            .Include(pm => pm.Medication)
            .Include(pm => pm.Pharmacy).ThenInclude(p => p.Owner);

        List<PharmacyMedication> offers;
        if (sortBy.Equals("POSTGIS_NEAREST", StringComparison.OrdinalIgnoreCase))
        {
            if (userLat is null || userLon is null) return BadRequest();
            var ids = await NearestOfferIdsAsync(q, therapeuticClass, userLat.Value, userLon.Value);
            var byId = await pharmacyOffers.Where(pm => ids.Contains(pm.Id)).ToDictionaryAsync(pm => pm.Id);
            offers = ids.Select(id => byId[id]).ToList();
        }
        else
        {
            offers = await pharmacyOffers
                .Where(pm => pm.IsAvailable && pm.Pharmacy.Status == PharmacyStatus.APPROVED
                             && (pm.Medication.Name.ToLower().Contains(q)
                                 || (pm.Medication.GenericName != null && pm.Medication.GenericName.ToLower().Contains(q))
                                 || (pm.Medication.Symptoms != null && pm.Medication.Symptoms.ToLower().Contains(q)))
                             && (therapeuticClass == null || pm.Medication.TherapeuticClass == therapeuticClass))
                .ToListAsync();
        }

        var results = offers.Select(pm => ToResult(pm, userLat, userLon)).ToList();

        if (!sortBy.Equals("POSTGIS_NEAREST", StringComparison.OrdinalIgnoreCase))
        {
            results = sortBy.ToUpperInvariant() switch
            {
                "RATING" => results.OrderByDescending(r => r.Pharmacy.AverageRating ?? 0.0).ToList(),
                "NEAREST" when userLat is not null && userLon is not null =>
                    results.OrderBy(r => r.DistanceKm ?? double.MaxValue).ToList(),
                "NEAREST" => results,
                _ => results.OrderBy(r => r.Price).ToList(),
            };
        }

        return results;
    }

    /// <summary>Identifiants des offres correspondantes, de la pharmacie la plus proche à la plus lointaine.</summary>
    private async Task<List<Guid>> NearestOfferIdsAsync(string q, string? therapeuticClass, double lat, double lon)
    {
        var pattern = $"%{q}%";
        var classFilter = therapeuticClass ?? "";
        var rows = await db.Database.SqlQuery<OfferDistance>($"""
                SELECT pm.id AS Id,
                       p.location.STDistance(geography::Point({lat}, {lon}, 4326)) AS DistanceM
                FROM pharmacy_medications pm
                JOIN medications m ON pm.medication_id = m.id
                JOIN pharmacies p ON pm.pharmacy_id = p.id
                WHERE pm.is_available = 1
                  AND p.status = 'APPROVED'
                  AND (LOWER(m.name) LIKE {pattern}
                       OR LOWER(m.generic_name) LIKE {pattern}
                       OR LOWER(m.symptoms) LIKE {pattern})
                  AND ({classFilter} = '' OR m.therapeutic_class = {classFilter})
                """)
            .OrderBy(r => r.DistanceM)
            .ToListAsync();
        return rows.Select(r => r.Id).ToList();
    }

    private static PatientMedicationSearchResultDto ToResult(PharmacyMedication pm, double? userLat, double? userLon)
    {
        double? distance = userLat is { } lat && userLon is { } lon
            ? Geo.DistanceKm(lat, lon, (double)pm.Pharmacy.Latitude, (double)pm.Pharmacy.Longitude)
            : null;
        return new PatientMedicationSearchResultDto(
            pm.MedicationId, pm.Medication.Name, pm.Medication.GenericName, pm.Medication.Description,
            pm.Medication.PhotoUrl, pm.Price, pm.IsAvailable, pm.StockQuantity, pm.ExpiryDate,
            Mapping.ToDto(pm.Pharmacy), distance, pm.Pharmacy.AverageRating, pm.Pharmacy.RatingCount);
    }
}

[ApiController]
[Authorize]
[Route("api/v1/users")]
public class UsersController(EasyPharmaDbContext db) : ControllerBase
{
    /// <summary>Profil de l'utilisateur connecté (utilisé par le front Angular après la connexion).</summary>
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Me()
    {
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == User.GetUserId());
        if (user is null) return NotFound(ApiResponse<UserResponse>.Error("Utilisateur introuvable"));
        var pharmacyName = await db.Pharmacies.Where(p => p.Id == user.PharmacyId).Select(p => p.Name).FirstOrDefaultAsync();
        return Ok(ApiResponse<UserResponse>.Ok(Mapping.ToResponse(user, pharmacyName), "OK"));
    }
}
