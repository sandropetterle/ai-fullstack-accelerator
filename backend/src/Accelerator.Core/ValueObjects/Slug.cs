using System.Text.RegularExpressions;

namespace Accelerator.Core.ValueObjects;

public static partial class Slug
{
    public static string FromTitle(string title)
    {
        var slug = title.ToLowerInvariant();
        slug = InvalidChars().Replace(slug, "");
        slug = Whitespace().Replace(slug, "-");
        slug = MultipleDashes().Replace(slug, "-");
        return slug.Trim('-');
    }

    [GeneratedRegex(@"[^a-z0-9\s-]")]
    private static partial Regex InvalidChars();

    [GeneratedRegex(@"\s+")]
    private static partial Regex Whitespace();

    [GeneratedRegex(@"-+")]
    private static partial Regex MultipleDashes();
}
