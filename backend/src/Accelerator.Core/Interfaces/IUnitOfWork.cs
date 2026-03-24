namespace Accelerator.Core.Interfaces;

public interface IUnitOfWork : IDisposable
{
    IArticleRepository Articles { get; }
    ITagRepository Tags { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
