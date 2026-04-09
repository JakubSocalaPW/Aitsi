using System.Text.Json.Serialization;

namespace Backend.Models;

public enum UserRole
{
    Viewer,
    Creator,
    Admin
}

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Viewer;
    public string? AvatarUrl { get; set; }
    public bool IsBlocked { get; set; }
    public string? BlockReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Social media login
    public string? FacebookId { get; set; }
    public string? GoogleId { get; set; }

    // Navigation — excluded from JSON
    [JsonIgnore]
    public ICollection<Photo> Photos { get; set; } = [];
    [JsonIgnore]
    public ICollection<Comment> Comments { get; set; } = [];
}
