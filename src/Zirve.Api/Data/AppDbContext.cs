using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Zirve.Api.Data.Entities;

namespace Zirve.Api.Data;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options)
    : IdentityUserContext<AppUser, Guid>(options)
{
    /// <summary>Tam metin aramada kullanılan PostgreSQL yapılandırması (Türkçe kök bulma).</summary>
    public const string SearchConfig = "turkish";

    public DbSet<Track> Tracks => Set<Track>();

    public DbSet<Module> Modules => Set<Module>();

    public DbSet<Lesson> Lessons => Set<Lesson>();

    public DbSet<Quiz> Quizzes => Set<Quiz>();

    public DbSet<Question> Questions => Set<Question>();

    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();

    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();

    public DbSet<Problem> Problems => Set<Problem>();

    public DbSet<Submission> Submissions => Set<Submission>();

    public DbSet<LessonProgress> LessonProgress => Set<LessonProgress>();

    public DbSet<ContentState> ContentStates => Set<ContentState>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ---------------------------------------------------------- kimlik
        builder.Entity<AppUser>(user =>
        {
            user.ToTable("users");
            user.Property(u => u.DisplayName).HasMaxLength(60);
        });
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");

        // ---------------------------------------------------------- katalog
        builder.Entity<Track>(track =>
        {
            track.Property(t => t.Slug).HasMaxLength(80);
            track.Property(t => t.Title).HasMaxLength(120);
            track.Property(t => t.Description).HasMaxLength(600);
            track.Property(t => t.Icon).HasMaxLength(40);
            track.Property(t => t.Accent).HasMaxLength(40);
            track.HasIndex(t => t.Slug).IsUnique();
        });

        builder.Entity<Module>(module =>
        {
            module.Property(m => m.Slug).HasMaxLength(80);
            module.Property(m => m.Title).HasMaxLength(160);
            module.Property(m => m.Description).HasMaxLength(600);
            module.HasIndex(m => new { m.TrackId, m.Slug }).IsUnique();
            module.HasOne(m => m.Track).WithMany(t => t.Modules).HasForeignKey(m => m.TrackId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Lesson>(lesson =>
        {
            lesson.Property(l => l.Slug).HasMaxLength(120);
            lesson.Property(l => l.Title).HasMaxLength(200);
            lesson.Property(l => l.Summary).HasMaxLength(600);
            lesson.Property(l => l.Level).HasConversion<string>().HasMaxLength(20);
            lesson.HasIndex(l => new { l.TrackId, l.Slug }).IsUnique();
            lesson.HasOne(l => l.Module).WithMany(m => m.Lessons).HasForeignKey(l => l.ModuleId).OnDelete(DeleteBehavior.Cascade);
            lesson.HasOne(l => l.Track).WithMany().HasForeignKey(l => l.TrackId).OnDelete(DeleteBehavior.Cascade);
            lesson.HasGeneratedTsVectorColumn(l => l.SearchVector, SearchConfig, l => new { l.Title, l.Summary, l.Content })
                .HasIndex(l => l.SearchVector)
                .HasMethod("GIN");
        });

        builder.Entity<ContentState>(state =>
        {
            state.HasKey(s => s.Key);
            state.Property(s => s.Key).HasMaxLength(40);
            state.Property(s => s.Hash).HasMaxLength(64);
        });

        // ---------------------------------------------------------- testler
        builder.Entity<Quiz>(quiz =>
        {
            quiz.Property(q => q.Slug).HasMaxLength(120);
            quiz.Property(q => q.Title).HasMaxLength(200);
            quiz.Property(q => q.Description).HasMaxLength(600);
            quiz.Property(q => q.Level).HasConversion<string>().HasMaxLength(20);
            quiz.Property(q => q.ContentHash).HasMaxLength(64);
            quiz.HasIndex(q => q.Slug).IsUnique();
            quiz.HasOne(q => q.Track).WithMany(t => t.Quizzes).HasForeignKey(q => q.TrackId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<Question>(question =>
        {
            question.Property(q => q.Difficulty).HasConversion<string>().HasMaxLength(20);
            question.HasIndex(q => new { q.QuizId, q.Order });
            question.HasOne(q => q.Quiz).WithMany(z => z.Questions).HasForeignKey(q => q.QuizId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<QuestionOption>(option =>
        {
            option.HasOne(o => o.Question).WithMany(q => q.Options).HasForeignKey(o => o.QuestionId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<QuizAttempt>(attempt =>
        {
            attempt.HasIndex(a => new { a.UserId, a.QuizId, a.CreatedAt });
            attempt.HasOne(a => a.User).WithMany().HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
            attempt.HasOne(a => a.Quiz).WithMany().HasForeignKey(a => a.QuizId).OnDelete(DeleteBehavior.Cascade);
        });

        // ---------------------------------------------------------- problemler
        builder.Entity<Problem>(problem =>
        {
            problem.Property(p => p.Slug).HasMaxLength(120);
            problem.Property(p => p.Title).HasMaxLength(200);
            problem.Property(p => p.Difficulty).HasConversion<string>().HasMaxLength(20);
            problem.Property(p => p.SpecJson).HasColumnType("jsonb");
            problem.Property(p => p.TestsJson).HasColumnType("jsonb");
            problem.Property(p => p.SolutionsJson).HasColumnType("jsonb");
            problem.HasIndex(p => p.Slug).IsUnique();
            problem.HasIndex(p => p.Number);
            problem.HasGeneratedTsVectorColumn(p => p.SearchVector, SearchConfig, p => new { p.Title, p.Statement })
                .HasIndex(p => p.SearchVector)
                .HasMethod("GIN");
        });

        builder.Entity<Submission>(submission =>
        {
            submission.Property(s => s.Language).HasMaxLength(20);
            submission.Property(s => s.Verdict).HasConversion<string>().HasMaxLength(30);
            submission.HasIndex(s => new { s.UserId, s.ProblemId, s.CreatedAt });
            submission.HasIndex(s => new { s.UserId, s.CreatedAt });
            submission.HasOne(s => s.User).WithMany().HasForeignKey(s => s.UserId).OnDelete(DeleteBehavior.Cascade);
            submission.HasOne(s => s.Problem).WithMany().HasForeignKey(s => s.ProblemId).OnDelete(DeleteBehavior.Cascade);
        });

        // ---------------------------------------------------------- ilerleme
        builder.Entity<LessonProgress>(progress =>
        {
            progress.ToTable("lesson_progress");
            progress.HasKey(p => new { p.UserId, p.LessonId });
            progress.HasIndex(p => new { p.UserId, p.CompletedAt });
            progress.HasOne(p => p.User).WithMany().HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
            progress.HasOne(p => p.Lesson).WithMany().HasForeignKey(p => p.LessonId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
