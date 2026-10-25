using System.Security.Claims;
using EasyPharma.Api.Data;
using EasyPharma.Api.Domain;
using EasyPharma.Api.Dtos;
using EasyPharma.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EasyPharma.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(EasyPharmaDbContext db, TokenService tokens) : ControllerBase
{
    /// <summary>Inscription d'un patient (les autres rôles sont créés côté back-office).</summary>
    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register(RegisterRequest request)
    {
        if (request.Role is not null and not UserRole.PATIENT)
            return BadRequest(ApiResponse<AuthResponse>.Error("Seule l'inscription d'un patient est prise en charge"));

        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email))
            return Conflict(ApiResponse<AuthResponse>.Error("Cet email est déjà utilisé"));
        if (await db.Users.AnyAsync(u => u.Phone == request.Phone))
            return Conflict(ApiResponse<AuthResponse>.Error("Ce numéro de téléphone est déjà utilisé"));

        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Phone = request.Phone,
            Role = UserRole.PATIENT,
            Address = request.Address,
            City = request.City,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            IsActive = true,
            IsVerified = false,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Ok(ApiResponse<AuthResponse>.Ok(BuildAuth(user), "Inscription réussie"));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email);

        // Le hash BCrypt est celui produit par Spring Security (même format $2a$).
        if (user is null || !user.IsActive || !BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            return Unauthorized(ApiResponse<AuthResponse>.Error("Email ou mot de passe incorrect"));

        return Ok(ApiResponse<AuthResponse>.Ok(BuildAuth(user, await PharmacyNameAsync(user)), "Connexion réussie"));
    }

    /// <summary>Les jetons sont sans état : la déconnexion ne fait rien côté serveur (le front efface sa session).</summary>
    [HttpPost("logout")]
    public ActionResult<ApiResponse<object>> Logout() => Ok(ApiResponse<object>.Ok(new { }, "Déconnexion réussie"));

    /// <summary>Non pris en charge dans cette version : pas de refresh token (voir README).</summary>
    [HttpPost("refresh-token")]
    public ActionResult<ApiResponse<AuthResponse>> RefreshToken() =>
        Unauthorized(ApiResponse<AuthResponse>.Error("Rafraîchissement de jeton non pris en charge : se reconnecter"));

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<UserResponse>>> Me()
    {
        var id = User.GetUserId();
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        return user is null
            ? NotFound(ApiResponse<UserResponse>.Error("Utilisateur introuvable"))
            : Ok(ApiResponse<UserResponse>.Ok(Mapping.ToResponse(user, await PharmacyNameAsync(user)), "OK"));
    }

    private Task<string?> PharmacyNameAsync(User user) =>
        db.Pharmacies.Where(p => p.Id == user.PharmacyId).Select(p => p.Name).FirstOrDefaultAsync();

    private AuthResponse BuildAuth(User user, string? pharmacyName = null) =>
        new(tokens.Generate(user), null, "Bearer", tokens.ExpiresInMs, Mapping.ToResponse(user, pharmacyName));
}

public static class ClaimsExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirstValue("userId"), out var id) ? id : Guid.Empty;
}
