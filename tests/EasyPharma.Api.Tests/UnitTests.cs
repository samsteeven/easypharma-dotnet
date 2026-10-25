using System.IdentityModel.Tokens.Jwt;
using EasyPharma.Api.Domain;
using EasyPharma.Api.Services;
using FluentAssertions;
using Microsoft.Extensions.Options;

namespace EasyPharma.Api.Tests;

public class DeliveryFeeTests
{
    [Theory]
    [InlineData(0, 0)]
    [InlineData(-2, 0)]
    [InlineData(1, 600)]
    [InlineData(3.15, 815)]
    public void Fee_is_500_plus_100_per_km_and_zero_without_distance(double km, decimal expected) =>
        DeliveryFee.Calculate(km).Should().Be(expected);

    [Fact]
    public void Fee_is_rounded_to_two_decimals_half_up() =>
        DeliveryFee.Calculate(3.1508779).Should().Be(815.09m);
}

public class GeoTests
{
    [Fact]
    public void Distance_between_two_yaounde_pharmacies_matches_haversine()
    {
        // Bastos -> point de livraison utilisé par les tests d'intégration : ~3,15 km.
        Geo.DistanceKm(3.8480, 11.5021, 3.87, 11.52).Should().BeApproximately(3.15, 0.01);
    }

    [Fact]
    public void Distance_is_zero_for_the_same_point() =>
        Geo.DistanceKm(3.85, 11.5, 3.85, 11.5).Should().Be(0);
}

public class TokenServiceTests
{
    // Même secret base64 que app.jwt.secret de src/test/resources/application-test.yml côté Spring Boot.
    private const string Secret =
        "NDIzNTM0NTQzNTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NQ==";

    private static TokenService NewService() =>
        new(Options.Create(new JwtOptions { Secret = Secret, ExpirationMs = 60_000 }));

    private static User Patient() => new()
    {
        Id = Guid.NewGuid(), Email = "p@test.local", FirstName = "Pat", LastName = "Ient", Role = UserRole.PATIENT,
    };

    [Fact]
    public void Token_carries_the_same_claims_as_the_spring_boot_JwtService()
    {
        var user = Patient();
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(NewService().Generate(user));

        jwt.Subject.Should().Be(user.Email);
        jwt.Claims.Single(c => c.Type == "userId").Value.Should().Be(user.Id.ToString());
        jwt.Claims.Single(c => c.Type == "role").Value.Should().Be("PATIENT");
        jwt.Claims.Single(c => c.Type == "email").Value.Should().Be(user.Email);
        jwt.Claims.Single(c => c.Type == "firstName").Value.Should().Be("Pat");
        jwt.Header.Alg.Should().Be("HS256");
    }

    [Fact]
    public void Token_expires_after_the_configured_duration()
    {
        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(NewService().Generate(Patient()));
        (jwt.ValidTo - DateTime.UtcNow).TotalSeconds.Should().BeInRange(55, 61);
    }
}

public class SpringCompatibilityTests
{
    // Hash produit par BCryptPasswordEncoder de Spring Security pour le mot de passe « Test1234! ».
    private const string SpringHash = "$2a$10$DzDReIMALgTxWnLcCy0emeuLcmXgbbxxah3krC48m5cMIhxOpOjL2";

    [Fact]
    public void Bcrypt_hash_created_by_spring_security_is_verified() =>
        BCrypt.Net.BCrypt.Verify("Test1234!", SpringHash).Should().BeTrue();

    [Fact]
    public void Wrong_password_is_rejected() =>
        BCrypt.Net.BCrypt.Verify("autre", SpringHash).Should().BeFalse();
}
