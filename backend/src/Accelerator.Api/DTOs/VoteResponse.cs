namespace Accelerator.Api.DTOs;

public class VoteResponse
{
    public Guid ArticleId { get; set; }
    public int VoteCount { get; set; }
}
