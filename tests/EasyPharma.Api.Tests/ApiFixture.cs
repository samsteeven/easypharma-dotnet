using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Testcontainers.MsSql;

namespace EasyPharma.Api.Tests;

/// <summary>SQL Server 2022 réel (Testcontainers) avec le schéma V1 + V2 et les données de démonstration.</summary>
public sealed class ApiFixture : IAsyncLifetime
{
    public const string JwtSecret =
        "NDIzNTM0NTQzNTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NTM0NQ==";

    private readonly MsSqlContainer _db = new MsSqlBuilder("mcr.microsoft.com/mssql/server:2022-latest").Build();
    private WebApplicationFactory<Program>? _factory;

    public string ConnectionString { get; private set; } = "";

    /// <summary>Un client neuf à chaque appel : aucun en-tête d'autorisation partagé entre les tests.</summary>
    public HttpClient CreateClient() => _factory!.CreateClient();

    public async Task InitializeAsync()
    {
        await _db.StartAsync();

        var master = new SqlConnectionStringBuilder(_db.GetConnectionString());
        await using (var connection = new SqlConnection(master.ConnectionString))
        {
            await connection.OpenAsync();
            await new SqlCommand("CREATE DATABASE easypharma_db", connection).ExecuteNonQueryAsync();
        }

        master.InitialCatalog = "easypharma_db";
        ConnectionString = master.ConnectionString;
        foreach (var script in new[] { "V1__baseline_schema.sql", "V2__pharmacy_geography.sql", "seed.sql" })
            await RunScriptAsync(Path.Combine(AppContext.BaseDirectory, "db", script));

        Environment.SetEnvironmentVariable("ConnectionStrings__Default", ConnectionString);
        Environment.SetEnvironmentVariable("Jwt__Secret", JwtSecret);
        _factory = new WebApplicationFactory<Program>();
    }

    // Découpe sur les lignes « GO », comme sqlcmd. SqlClient active QUOTED_IDENTIFIER, requis par l'index spatial.
    private async Task RunScriptAsync(string path)
    {
        var batches = System.Text.RegularExpressions.Regex.Split(
            await File.ReadAllTextAsync(path), @"^\s*GO\s*$", System.Text.RegularExpressions.RegexOptions.Multiline);
        await using var connection = new SqlConnection(ConnectionString);
        await connection.OpenAsync();
        foreach (var batch in batches.Where(b => !string.IsNullOrWhiteSpace(b)))
            await new SqlCommand(batch, connection).ExecuteNonQueryAsync();
    }

    public async Task DisposeAsync()
    {
        if (_factory is not null) await _factory.DisposeAsync();
        await _db.DisposeAsync();
    }
}

[CollectionDefinition(Name)]
public class ApiCollection : ICollectionFixture<ApiFixture>
{
    public const string Name = "api";
}
