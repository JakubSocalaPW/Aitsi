namespace Backend.Models;

public enum DatePrecision
{
    Year,
    Month,
    Day
}

public class Photo
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImagePath { get; set; } = string.Empty;
    public string ThumbnailPath { get; set; } = string.Empty;

    // Location
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public string? LocationLabel { get; set; }

    // Dating
    public string Date { get; set; } = string.Empty;
    public DatePrecision DatePrecision { get; set; } = DatePrecision.Year;

    // Detail fields
    public string? Technique { get; set; }
    public string? InventoryNumber { get; set; }
    public string? OriginalFormat { get; set; }
    public string? License { get; set; }
    public string? Digitization { get; set; }
    public string? Quote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Foreign keys
    public int AuthorId { get; set; }
    public int CategoryId { get; set; }

    // Navigation
    public User Author { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public ICollection<Tag> Tags { get; set; } = [];
    public ICollection<Comment> Comments { get; set; } = [];
}