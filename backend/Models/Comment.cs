namespace Backend.Models;

public class Comment
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public int PhotoId { get; set; }
    public Photo Photo { get; set; } = null!;

    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;
}
