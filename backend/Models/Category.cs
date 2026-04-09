using System.Text.Json.Serialization;

namespace Backend.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int? ParentId { get; set; }

    // Navigation — excluded from JSON to avoid circular refs and empty arrays
    [JsonIgnore]
    public Category? Parent { get; set; }
    [JsonIgnore]
    public ICollection<Category> Children { get; set; } = [];
    [JsonIgnore]
    public ICollection<Photo> Photos { get; set; } = [];
}
