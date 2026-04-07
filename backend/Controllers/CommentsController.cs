using System.Security.Claims;
using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

public class CreateCommentDto
{
    public string Text { get; set; } = string.Empty;
}

public class UpdateCommentDto
{
    public string Text { get; set; } = string.Empty;
}

[ApiController]
public class CommentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public CommentsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("api/photos/{photoId}/comments")]
    public async Task<IActionResult> GetComments(int photoId)
    {
        var photoExists = await _db.Photos.AnyAsync(p => p.Id == photoId);
        if (!photoExists) return NotFound();

        var comments = await _db.Comments
            .Where(c => c.PhotoId == photoId)
            .Include(c => c.Author)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Text,
                c.PhotoId,
                Author = new
                {
                    c.Author.Id,
                    c.Author.DisplayName,
                    c.Author.AvatarUrl
                },
                c.CreatedAt,
                c.UpdatedAt
            })
            .ToListAsync();

        return Ok(comments);
    }

    [Authorize]
    [HttpPost("api/photos/{photoId}/comments")]
    public async Task<IActionResult> CreateComment(int photoId, [FromBody] CreateCommentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Treść komentarza jest wymagana");

        var photoExists = await _db.Photos.AnyAsync(p => p.Id == photoId);
        if (!photoExists) return NotFound();

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        var comment = new Comment
        {
            Text = dto.Text,
            PhotoId = photoId,
            AuthorId = userId
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();

        await _db.Entry(comment).Reference(c => c.Author).LoadAsync();

        return Created($"api/comments/{comment.Id}", new
        {
            comment.Id,
            comment.Text,
            comment.PhotoId,
            Author = new
            {
                comment.Author.Id,
                comment.Author.DisplayName,
                comment.Author.AvatarUrl
            },
            comment.CreatedAt,
            comment.UpdatedAt
        });
    }

    [Authorize]
    [HttpPut("api/comments/{id}")]
    public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Text))
            return BadRequest("Treść komentarza jest wymagana");

        var comment = await _db.Comments.Include(c => c.Author).FirstOrDefaultAsync(c => c.Id == id);
        if (comment == null) return NotFound();

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var isAdmin = User.IsInRole("admin");

        if (comment.AuthorId != userId && !isAdmin) return Forbid();

        comment.Text = dto.Text;
        comment.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            comment.Id,
            comment.Text,
            comment.PhotoId,
            Author = new
            {
                comment.Author.Id,
                comment.Author.DisplayName,
                comment.Author.AvatarUrl
            },
            comment.CreatedAt,
            comment.UpdatedAt
        });
    }

    [Authorize]
    [HttpDelete("api/comments/{id}")]
    public async Task<IActionResult> DeleteComment(int id)
    {
        var comment = await _db.Comments.FindAsync(id);
        if (comment == null) return NotFound();

        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var isAdmin = User.IsInRole("admin");

        if (comment.AuthorId != userId && !isAdmin) return Forbid();

        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync();

        return Ok();
    }
}
