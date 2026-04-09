using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

public class BlockUserDto
{
    public string Reason { get; set; } = string.Empty;
}

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.Users.OrderByDescending(u => u.CreatedAt);
        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.DisplayName,
                u.Role,
                u.AvatarUrl,
                u.IsBlocked,
                u.BlockReason,
                u.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    [HttpPut("users/{id}/block")]
    public async Task<IActionResult> BlockUser(int id, [FromBody] BlockUserDto dto)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsBlocked = true;
        user.BlockReason = dto.Reason;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpPut("users/{id}/unblock")]
    public async Task<IActionResult> UnblockUser(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        user.IsBlocked = false;
        user.BlockReason = null;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("photos/pending")]
    public async Task<IActionResult> GetPendingPhotos(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _db.Photos
            .Include(p => p.Author)
            .Include(p => p.Category)
            .Include(p => p.Tags)
            .Where(p => !p.IsApproved)
            .OrderByDescending(p => p.CreatedAt);

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalCount,
            totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
        });
    }

    [HttpPut("photos/{id}/approve")]
    public async Task<IActionResult> ApprovePhoto(int id)
    {
        var photo = await _db.Photos.FindAsync(id);
        if (photo == null) return NotFound();

        photo.IsApproved = true;
        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalPhotos = await _db.Photos.CountAsync(p => p.IsApproved);
        var totalUsers = await _db.Users.CountAsync();
        var blockedUsers = await _db.Users.CountAsync(u => u.IsBlocked);
        var pendingPhotos = await _db.Photos.CountAsync(p => !p.IsApproved);

        return Ok(new
        {
            totalPhotos,
            totalUsers,
            blockedUsers,
            pendingPhotos
        });
    }
}
