using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EasyPharma.Api.Domain;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace EasyPharma.Api.Services;

public class JwtOptions
{
    public const string Section = "Jwt";

    /// <summary>Clé HMAC en base64, la même que <c>app.jwt.secret</c> du backend Spring Boot.</summary>
    public string Secret { get; set; } = "";

    /// <summary>Durée de vie en millisecondes (<c>app.jwt.expiration</c>).</summary>
    public long ExpirationMs { get; set; } = 86_400_000;

    public SymmetricSecurityKey SigningKey() => new(Convert.FromBase64String(Secret));
}

/// <summary>
/// Génère des jetons HS256 avec les mêmes claims que JwtService côté Spring Boot
/// (sub = email, userId, email, role, firstName, lastName) : les deux API acceptent les jetons de l'autre.
/// </summary>
public class TokenService(IOptions<JwtOptions> options)
{
    private readonly JwtOptions _options = options.Value;

    public long ExpiresInMs => _options.ExpirationMs;

    public string Generate(User user)
    {
        var now = DateTime.UtcNow;
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Email),
            new Claim("userId", user.Id.ToString()),
            new Claim("email", user.Email),
            new Claim("role", user.Role.ToString()),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName),
        };
        var token = new JwtSecurityToken(
            claims: claims,
            notBefore: null,
            expires: now.AddMilliseconds(_options.ExpirationMs),
            signingCredentials: new SigningCredentials(_options.SigningKey(), SecurityAlgorithms.HmacSha256));
        token.Payload[JwtRegisteredClaimNames.Iat] = new DateTimeOffset(now).ToUnixTimeSeconds();
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

/// <summary>Frais de livraison : mêmes règles que DeliveryFeeServiceImplementation (500 + 100 par km).</summary>
public static class DeliveryFee
{
    private const decimal BaseFee = 500m;
    private const decimal RatePerKm = 100m;

    public static decimal Calculate(double distanceKm) =>
        distanceKm <= 0 ? 0m : Math.Round(BaseFee + RatePerKm * (decimal)distanceKm, 2, MidpointRounding.AwayFromZero);
}

/// <summary>Distance de Haversine en km, comme GeoUtils.calculateDistance côté Java.</summary>
public static class Geo
{
    public static double DistanceKm(double lat1, double lon1, double lat2, double lon2)
    {
        const int earthRadiusKm = 6371;
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                + Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return earthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180;
}
