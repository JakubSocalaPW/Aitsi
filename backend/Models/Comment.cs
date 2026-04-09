using System.Text.Json.Serialization;

namespace Backend.Models;

public class Comment
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public int PhotoId { get; set; }
    public int AuthorId { get; set; }

    // Navigation — Photo excluded to avoid circular refs; Author needed for display
    [JsonIgnore]
    public Photo Photo { get; set; } = null!;
    public User Author { get; set; } = null!;
}
