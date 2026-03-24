using Accelerator.Core.Entities;
using Accelerator.Core.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Accelerator.Data.Repositories;

public class TagRepository : ITagRepository
{
    private readonly ApplicationDbContext _context;

    public TagRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Tag>> GetAllAsync(CancellationToken ct = default)
    {
        return await _context.Tags
            .OrderBy(t => t.Name)
            .AsNoTracking()
            .ToListAsync(ct);
    }

    public async Task<List<Tag>> GetByNamesAsync(List<string> names, CancellationToken ct = default)
    {
        return await _context.Tags
            .Where(t => names.Contains(t.Name))
            .ToListAsync(ct);
    }

    public Task<Tag> AddAsync(Tag tag, CancellationToken ct = default)
    {
        _context.Tags.Add(tag);
        return Task.FromResult(tag);
    }
}
