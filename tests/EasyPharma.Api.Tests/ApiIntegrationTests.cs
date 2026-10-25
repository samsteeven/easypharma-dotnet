using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace EasyPharma.Api.Tests;

/// <summary>API complète sur un vrai SQL Server 2022 (conteneur) : mêmes scénarios que côté Spring Boot.</summary>
[Collection(ApiCollection.Name)]
public class ApiIntegrationTests(ApiFixture fixture)
{
    private const double UserLat = 3.855;
    private const double UserLon = 11.51;

    private HttpClient Client => fixture.CreateClient();

    private static string Unique() => Guid.NewGuid().ToString("N")[..8];

    private async Task<string> RegisterAndLoginAsync()
    {
        var email = $"patient-{Unique()}@test.local";
        var register = await Client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email, password = "Test1234!", firstName = "Pat", lastName = "Ient", phone = $"69{Random.Shared.Next(1_000_000, 9_999_999)}",
        });
        register.StatusCode.Should().Be(HttpStatusCode.OK, await register.Content.ReadAsStringAsync());

        var login = await Client.PostAsJsonAsync("/api/v1/auth/login", new { email, password = "Test1234!" });
        login.StatusCode.Should().Be(HttpStatusCode.OK, await login.Content.ReadAsStringAsync());
        using var json = JsonDocument.Parse(await login.Content.ReadAsStringAsync());
        return json.RootElement.GetProperty("data").GetProperty("access_token").GetString()!;
    }

    private async Task<HttpClient> AuthenticatedClientAsync()
    {
        var client = fixture.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", await RegisterAndLoginAsync());
        return client;
    }

    private async Task<string[]> NearbyNamesAsync(double radiusKm)
    {
        var url = FormattableString.Invariant(
            $"/api/v1/pharmacies/nearby?latitude={UserLat}&longitude={UserLon}&radiusKm={radiusKm}");
        using var json = JsonDocument.Parse(await Client.GetStringAsync(url));
        return json.RootElement.EnumerateArray().Select(p => p.GetProperty("name").GetString()!).ToArray();
    }

    [Fact]
    public async Task Nearby_returns_approved_pharmacies_sorted_by_distance()
    {
        (await NearbyNamesAsync(10)).Should().Equal("Pharmacie Bastos", "Pharmacie Centre");
        (await NearbyNamesAsync(400)).Should().Equal("Pharmacie Bastos", "Pharmacie Centre", "Pharmacie Akwa");
    }

    [Fact]
    public async Task Nearby_outside_the_radius_is_empty() =>
        (await NearbyNamesAsync(0.5)).Should().BeEmpty();

    [Fact]
    public async Task Register_then_login_returns_a_spring_compatible_payload()
    {
        var token = await RegisterAndLoginAsync();
        token.Split('.').Should().HaveCount(3);
    }

    [Fact]
    public async Task Register_with_an_existing_email_or_phone_is_a_conflict_not_a_server_error()
    {
        var body = new
        {
            email = $"dup-{Unique()}@test.local", password = "Test1234!", firstName = "A", lastName = "B", phone = "690111222",
        };
        (await Client.PostAsJsonAsync("/api/v1/auth/register", body)).StatusCode.Should().Be(HttpStatusCode.OK);

        (await Client.PostAsJsonAsync("/api/v1/auth/register", body)).StatusCode.Should().Be(HttpStatusCode.Conflict);
        (await Client.PostAsJsonAsync("/api/v1/auth/register", body with { email = $"autre-{Unique()}@test.local" }))
            .StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Login_with_a_wrong_password_is_unauthorized()
    {
        var response = await Client.PostAsJsonAsync("/api/v1/auth/login",
            new { email = "inconnu@test.local", password = "Test1234!" });
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Catalogue_requires_a_token() =>
        (await Client.GetAsync("/api/v1/medications")).StatusCode.Should().Be(HttpStatusCode.Unauthorized);

    [Fact]
    public async Task Catalogue_search_ignores_case_and_accents_of_the_generic_name()
    {
        var client = await AuthenticatedClientAsync();
        using var json = JsonDocument.Parse(await client.GetStringAsync("/api/v1/medications/search?query=PARAC%C3%89TAMOL"));
        json.RootElement.EnumerateArray().Select(m => m.GetProperty("name").GetString()).Should().Contain("Doliprane");
    }

    [Fact]
    public async Task Catalogue_filter_without_parameters_returns_everything_and_filters_combine()
    {
        var client = await AuthenticatedClientAsync();
        async Task<int> Count(string query)
        {
            using var json = JsonDocument.Parse(await client.GetStringAsync("/api/v1/medications/filter" + query));
            return json.RootElement.GetArrayLength();
        }

        (await Count("")).Should().BeGreaterThan(0);
        (await Count("?therapeuticClass=ANTALGIQUE")).Should().BeGreaterThan(0);
        (await Count("?therapeuticClass=ANTIBIOTIQUE")).Should().Be(0);
        (await Count("?requiresPrescription=true")).Should().Be(0);
    }

    private async Task<(Guid PharmacyId, Guid MedicationId)> FirstOfferAsync(HttpClient client)
    {
        var nearbyUrl = FormattableString.Invariant(
            $"/api/v1/pharmacies/nearby?latitude={UserLat}&longitude={UserLon}&radiusKm=10");
        using var pharmacies = JsonDocument.Parse(await client.GetStringAsync(nearbyUrl));
        using var medications = JsonDocument.Parse(await client.GetStringAsync("/api/v1/medications"));
        return (pharmacies.RootElement[0].GetProperty("id").GetGuid(), medications.RootElement[0].GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task Create_order_computes_totals_and_delivery_fee_like_spring()
    {
        var client = await AuthenticatedClientAsync();
        var (pharmacyId, medicationId) = await FirstOfferAsync(client);

        var response = await client.PostAsJsonAsync("/api/v1/orders", new
        {
            pharmacyId,
            items = new[] { new { medicationId, quantity = 2 } },
            deliveryAddress = "Rue 1", deliveryCity = "Yaoundé", deliveryPhone = "691234567",
            deliveryLatitude = 3.87, deliveryLongitude = 11.52,
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        using var order = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var root = order.RootElement;
        root.GetProperty("status").GetString().Should().Be("PENDING");
        root.GetProperty("orderNumber").GetString().Should().StartWith("ORD-");
        // Pharmacie Bastos (3.848, 11.5021) -> (3.87, 11.52) : 3,15 km, soit 500 + 100 x 3,15 = 815,09.
        root.GetProperty("deliveryFee").GetDecimal().Should().Be(815.09m);
        var lines = root.GetProperty("items").EnumerateArray().Sum(i => i.GetProperty("totalPrice").GetDecimal());
        root.GetProperty("totalAmount").GetDecimal().Should().Be(lines + 815.09m);

        var mine = await client.GetStringAsync("/api/v1/orders/my-orders");
        mine.Should().Contain(root.GetProperty("orderNumber").GetString()!);
    }

    [Fact]
    public async Task Create_order_with_insufficient_stock_is_rejected()
    {
        var client = await AuthenticatedClientAsync();
        var (pharmacyId, medicationId) = await FirstOfferAsync(client);

        var response = await client.PostAsJsonAsync("/api/v1/orders", new
        {
            pharmacyId,
            items = new[] { new { medicationId, quantity = 500 } },
            deliveryAddress = "a", deliveryCity = "b", deliveryPhone = "c",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
