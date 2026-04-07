using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data;

public class AppDbContext: DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Photo> Photos => Set<Photo>();
    public DbSet<Category> Categories=> Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Role).HasConversion<string>();
        });

        // Category — self-referencing hierarchy
        modelBuilder.Entity<Category>(e =>
        {
            e.HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
        });

        // Photo
        modelBuilder.Entity<Photo>(e =>
        {
            e.Property(p => p.DatePrecision).HasConversion<string>();
            e.HasOne(p => p.Author)
            .WithMany(u => u.Photos)
            .HasForeignKey(p => p.AuthorId);
            e.HasOne(p => p.Category)
            .WithMany(c => c.Photos)
            .HasForeignKey(p => p.CategoryId);
        });

        // Photo <-> Tag (many-to-many, EF handles join table)
        modelBuilder.Entity<Photo>()
            .HasMany(p => p.Tags)
            .WithMany(t => t.Photos);

        // Comment
        modelBuilder.Entity<Comment>(e =>
        {
            e.HasOne(c => c.Photo)
            .WithMany(p => p.Comments)
            .HasForeignKey(c => c.PhotoId)
            .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(c => c.Author)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.AuthorId)
            .OnDelete(DeleteBehavior.Cascade);
        });

        // Tag — unique name
        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.Name).IsUnique();

        // Seed default user
        modelBuilder.Entity<User>().HasData(new User
        {
            Id = 1,
            Email = "admin@archiwum.pl",
            DisplayName = "Administrator",
            Role = UserRole.Admin,
            CreatedAt = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        });
    }

}
