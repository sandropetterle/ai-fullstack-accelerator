using Accelerator.Core.Interfaces;

namespace Accelerator.Data.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public IArticleRepository Articles { get; }
    public ITagRepository Tags { get; }

    public UnitOfWork(
        ApplicationDbContext context,
        IArticleRepository articleRepository,
        ITagRepository tagRepository)
    {
        _context = context;
        Articles = articleRepository;
        Tags = tagRepository;
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _context.SaveChangesAsync(ct);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
