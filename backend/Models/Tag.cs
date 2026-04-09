using System.Text.Json.Serialization;

namespace Backend.Models;

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    // Navigation — excluded from JSON
    [JsonIgnore]
    public ICollection<Photo> Photos { get; set; } = [];
}
