using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EasyPharma.Api.Domain;

namespace EasyPharma.Api.Dtos;

// Formes JSON identiques à celles du backend Spring Boot, pour que le front Angular fonctionne sans changement.

public record ApiResponse<T>(bool Success, string Message, T? Data, long Timestamp)
{
    public static ApiResponse<T> Ok(T data, string message) =>
        new(true, message, data, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());

    public static ApiResponse<T> Error(string message) =>
        new(false, message, default, DateTimeOffset.UtcNow.ToUnixTimeMilliseconds());
}

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password,
    [Required] string FirstName,
    [Required] string LastName,
    [Required] string Phone,
    string? Address,
    string? City,
    decimal? Latitude,
    decimal? Longitude);

public record LoginRequest([Required] string Email, [Required] string Password);

public record UserResponse(
    Guid Id, string Email, string FirstName, string LastName, string Phone, UserRole Role,
    string? Address, string? City, decimal? Latitude, decimal? Longitude,
    bool IsActive, bool IsVerified, DateTime CreatedAt, Guid? PharmacyId, string? PharmacyName);

public record AuthResponse(
    [property: JsonPropertyName("access_token")] string AccessToken,
    [property: JsonPropertyName("refresh_token")] string? RefreshToken,
    [property: JsonPropertyName("token_type")] string TokenType,
    [property: JsonPropertyName("expires_in")] long ExpiresIn,
    UserResponse User);

public record MedicationDto(
    Guid Id, string Name, string? GenericName, string TherapeuticClass, string? Description,
    string? Dosage, string? PhotoUrl, string? NoticePdfUrl, bool RequiresPrescription);

public record PharmacyDto(
    Guid Id, Guid UserId, string OwnerFirstName, string OwnerLastName, string OwnerEmail,
    string Name, string LicenseNumber, string Address, string City, string Phone,
    decimal Latitude, decimal Longitude, string? Description, string? OpeningHours,
    double? AverageRating, int? RatingCount, PharmacyStatus Status, string LicenseDocumentUrl,
    DateTime? ValidatedAt, DateTime CreatedAt, DateTime UpdatedAt);

public record CreateOrderItemDto([Required] Guid MedicationId, [Range(1, 1000)] int Quantity);

public record CreateOrderDto(
    [Required] Guid PharmacyId,
    [Required, MinLength(1)] List<CreateOrderItemDto> Items,
    [Required] string DeliveryAddress,
    [Required] string DeliveryCity,
    [Required] string DeliveryPhone,
    double? DeliveryLatitude,
    double? DeliveryLongitude,
    string? Notes);

public record OrderItemDto(
    Guid Id, Guid MedicationId, string MedicationName, int Quantity, decimal UnitPrice, decimal TotalPrice);

public record OrderDto(
    Guid Id, string OrderNumber, Guid PatientId, string PatientName, Guid PharmacyId, string PharmacyName,
    decimal TotalAmount, decimal DeliveryFee, OrderStatus Status, string DeliveryAddress, string DeliveryCity,
    string DeliveryPhone, DateTime Created, List<OrderItemDto> Items);
