using System.Text;
using EasyPharma.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace EasyPharma.Api.Data;

public class EasyPharmaDbContext(DbContextOptions<EasyPharmaDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Medication> Medications => Set<Medication>();
    public DbSet<Pharmacy> Pharmacies => Set<Pharmacy>();
    public DbSet<PharmacyMedication> PharmacyMedications => Set<PharmacyMedication>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().ToTable("users");
        modelBuilder.Entity<Medication>().ToTable("medications");
        modelBuilder.Entity<Pharmacy>().ToTable("pharmacies");
        modelBuilder.Entity<PharmacyMedication>().ToTable("pharmacy_medications");
        modelBuilder.Entity<Order>().ToTable("orders");
        modelBuilder.Entity<OrderItem>().ToTable("order_items");

        modelBuilder.Entity<Pharmacy>().HasOne(p => p.Owner).WithMany().HasForeignKey(p => p.UserId);

        // Enums stockés en texte, comme côté JPA (@Enumerated(EnumType.STRING)).
        modelBuilder.Entity<User>().Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        modelBuilder.Entity<Pharmacy>().Property(p => p.Status).HasConversion<string>().HasMaxLength(20);
        modelBuilder.Entity<Order>().Property(o => o.Status).HasConversion<string>().HasMaxLength(20);

        // Précisions identiques au schéma (numeric(10,2), latitude numeric(10,8), longitude numeric(11,8)).
        foreach (var property in modelBuilder.Model.GetEntityTypes().SelectMany(e => e.GetProperties()))
        {
            var column = ToSnakeCase(property.Name);
            property.SetColumnName(column);
            if (property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?))
            {
                var (precision, scale) = column switch
                {
                    "latitude" or "delivery_latitude" => (10, 8),
                    "longitude" or "delivery_longitude" => (11, 8),
                    _ => (10, 2),
                };
                property.SetPrecision(precision);
                property.SetScale(scale);
            }
        }
    }

    private static string ToSnakeCase(string name)
    {
        var sb = new StringBuilder();
        for (var i = 0; i < name.Length; i++)
        {
            if (char.IsUpper(name[i]) && i > 0) sb.Append('_');
            sb.Append(char.ToLowerInvariant(name[i]));
        }
        return sb.ToString();
    }
}
