namespace EasyPharma.Api.Domain;

// Les entités reprennent le schéma SQL Server du backend Spring Boot (db/V1__baseline_schema.sql) :
// même base, mêmes tables, accès « database first » (aucune migration EF Core).

public enum UserRole { SUPER_ADMIN, PHARMACY_ADMIN, PHARMACY_EMPLOYEE, PATIENT, DELIVERY }

public enum PharmacyStatus { PENDING, APPROVED, REJECTED, SUSPENDED }

public enum OrderStatus { PENDING, PAID, CONFIRMED, PREPARING, READY, IN_DELIVERY, DELIVERED, CANCELLED }

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string Phone { get; set; } = "";
    public UserRole Role { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public bool IsActive { get; set; }
    public bool IsVerified { get; set; }
    public Guid? PharmacyId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class Medication
{
    public Guid Id { get; set; }
    public string Name { get; set; } = "";
    public string? GenericName { get; set; }
    public string TherapeuticClass { get; set; } = "";
    public string? Description { get; set; }
    public string? Dosage { get; set; }
    public string? PhotoUrl { get; set; }
    public string? NoticePdfUrl { get; set; }
    public string? Symptoms { get; set; }
    public bool RequiresPrescription { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class Pharmacy
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User Owner { get; set; } = null!;
    public string Name { get; set; } = "";
    public string LicenseNumber { get; set; } = "";
    public string Address { get; set; } = "";
    public string City { get; set; } = "";
    public string Phone { get; set; } = "";
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
    public string? Description { get; set; }
    public string? OpeningHours { get; set; }
    public double? AverageRating { get; set; }
    public int? RatingCount { get; set; }
    public PharmacyStatus Status { get; set; }
    public string LicenseDocumentUrl { get; set; } = "";
    public DateTime? ValidatedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class PharmacyMedication
{
    public Guid Id { get; set; }
    public Guid PharmacyId { get; set; }
    public Pharmacy Pharmacy { get; set; } = null!;
    public Guid MedicationId { get; set; }
    public Medication Medication { get; set; } = null!;
    public decimal Price { get; set; }
    public int StockQuantity { get; set; }
    public bool IsAvailable { get; set; }
    public DateOnly? ExpiryDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class Order
{
    public Guid Id { get; set; }
    public string OrderNumber { get; set; } = "";
    public Guid PatientId { get; set; }
    public User Patient { get; set; } = null!;
    public Guid PharmacyId { get; set; }
    public Pharmacy Pharmacy { get; set; } = null!;
    public decimal TotalAmount { get; set; }
    public decimal DeliveryFee { get; set; }
    public OrderStatus Status { get; set; }
    public string DeliveryAddress { get; set; } = "";
    public string DeliveryCity { get; set; } = "";
    public string DeliveryPhone { get; set; } = "";
    public decimal? DeliveryLatitude { get; set; }
    public decimal? DeliveryLongitude { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    public Guid Id { get; set; }
    public Guid OrderId { get; set; }
    public Guid MedicationId { get; set; }
    public Medication Medication { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Subtotal { get; set; }
    public DateTime CreatedAt { get; set; }
}
