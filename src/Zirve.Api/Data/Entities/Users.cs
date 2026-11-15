using Microsoft.AspNetCore.Identity;

namespace Zirve.Api.Data.Entities;

public sealed class AppUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class LessonProgress
{
    public Guid UserId { get; set; }

    public AppUser User { get; set; } = null!;

    public int LessonId { get; set; }

    public Lesson Lesson { get; set; } = null!;

    public DateTimeOffset CompletedAt { get; set; }
}
