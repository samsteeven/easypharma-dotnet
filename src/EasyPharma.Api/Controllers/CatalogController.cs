using EasyPharma.Api.Data;
using EasyPharma.Api.Dtos;
using EasyPharma.Api.Domain;
using EasyPharma.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyPharma.Api.Controllers;

/// <summary>Catalogue global des médicaments (GET /api/v1/medications) : lecture seule, authentifiée.</summary>
[ApiController]
[Authorize]
[Route("api/v1/medications")]
public class MedicationsController(EasyPharmaDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IEnumerable<MedicationDto>> List() =>
        (await db.Medications.AsNoTracking().OrderBy(m => m.Name).ToListAsync()).Select(Mapping.ToDto);

    /// <summary>Recherche par nom ou nom générique, insensible à la casse.</summary>
    [HttpGet("search")]
    public async Task<IEnumerable<MedicationDto>> Search([FromQuery] string query)
    {
        var q = (query ?? "").ToLower();
        var items = await db.Medications.AsNoTracking()
            .Where(m => m.Name.ToLower().Contains(q) || (m.GenericName != null && m.GenericName.ToLower().Contains(q)))
            .OrderBy(m => m.Name)
            .ToListAsync();
        return items.Select(Mapping.ToDto);
    }

    /// <summary>Filtres combinables ; un paramètre absent désactive son filtre.</summary>
    [HttpGet("filter")]
    public async Task<IEnumerable<MedicationDto>> Filter(
        [FromQuery] string? name, [FromQuery] string? therapeuticClass, [FromQuery] bool? requiresPrescription)
    {
        var query = db.Medications.AsNoTracking().AsQueryable();
        if (!string.IsNullOrEmpty(name)) query = query.Where(m => m.Name.ToLower().Contains(name.ToLower()));
        if (!string.IsNullOrEmpty(therapeuticClass)) query = query.Where(m => m.TherapeuticClass == therapeuticClass);
        if (requiresPrescription is not null) query = query.Where(m => m.RequiresPrescription == requiresPrescription);
        return (await query.OrderBy(m => m.Name).ToListAsync()).Select(Mapping.ToDto);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MedicationDto>> Get(Guid id)
    {
        var medication = await db.Medications.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
        return medication is null ? NotFound() : Mapping.ToDto(medication);
    }
}

[ApiController]
[Route("api/v1/pharmacies")]
public class PharmaciesController(EasyPharmaDbContext db) : ControllerBase
{
    private sealed record NearbyRow(Guid Id, double DistanceM);

    /// <summary>
    /// Pharmacies approuvées dans un rayon (km), de la plus proche à la plus lointaine.
    /// Public, comme GET /api/v1/pharmacies/** côté Spring Boot. Utilise la colonne geography « location » et STDistance.
    /// </summary>
    [HttpGet("nearby")]
    public async Task<IEnumerable<PharmacyDto>> Nearby(
        [FromQuery] double latitude, [FromQuery] double longitude, [FromQuery] double radiusKm)
    {
        var radiusM = radiusKm * 1000;

        // Le filtre de rayon reste dans le SQL interne pour que l'index spatial soit utilisable ;
        // le tri est composé par EF Core au-dessus (un ORDER BY dans la sous-requête serait invalide).
        var rows = await db.Database.SqlQuery<NearbyRow>($"""
                SELECT p.id AS Id,
                       p.location.STDistance(geography::Point({latitude}, {longitude}, 4326)) AS DistanceM
                FROM pharmacies p
                WHERE p.status = 'APPROVED'
                  AND p.location.STDistance(geography::Point({latitude}, {longitude}, 4326)) <= {radiusM}
                """)
            .OrderBy(r => r.DistanceM)
            .ToListAsync();

        var ids = rows.Select(r => r.Id).ToList();
        var pharmacies = await db.Pharmacies.AsNoTracking().Include(p => p.Owner)
            .Where(p => ids.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

        return ids.Select(id => Mapping.ToDto(pharmacies[id]));
    }
}
