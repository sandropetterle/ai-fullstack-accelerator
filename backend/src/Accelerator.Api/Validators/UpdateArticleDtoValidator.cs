using Accelerator.Api.DTOs;
using Accelerator.Core.Enums;
using FluentValidation;

namespace Accelerator.Api.Validators;

public class UpdateArticleDtoValidator : AbstractValidator<UpdateArticleDto>
{
    public UpdateArticleDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(255);

        RuleFor(x => x.ShortDescription)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(x => x.FullContent)
            .MaximumLength(50000);

        RuleFor(x => x.Category)
            .NotEmpty()
            .Must(c => Enum.TryParse<ArticleCategory>(c, true, out _))
            .WithMessage("Invalid category. Valid values: " +
                string.Join(", ", Enum.GetNames<ArticleCategory>()));

        RuleFor(x => x.Tags)
            .Must(t => t.Count <= 10)
            .WithMessage("Maximum 10 tags allowed.");

        RuleForEach(x => x.Tags)
            .Must(t => !string.IsNullOrWhiteSpace(t))
            .WithMessage("Tags must not be empty or whitespace.")
            .MaximumLength(50);

        RuleFor(x => x.Author)
            .MaximumLength(100);
    }
}
