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

    // Navigation
    public ICollection<Photo> Photos { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];

    // Social media login
    public string? FacebookId { get; set; }
    public string? GoogleId { get; set; }
}
