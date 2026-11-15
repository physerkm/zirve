using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Zirve.Api.Infrastructure;

public sealed class RateLimitOptions
{
    public const string SectionName = "RateLimiting";

    /// <summary>IP başına dakikadaki toplam istek sınırı.</summary>
    [Range(1, 100_000)]
    public int GlobalPerMinute { get; set; } = 600;

    /// <summary>IP başına dakikadaki giriş/kayıt denemesi sınırı.</summary>
    [Range(1, 100_000)]
    public int AuthPerMinute { get; set; } = 10;

    /// <summary>Kullanıcı başına dakikadaki kod çalıştırma sınırı.</summary>
    [Range(1, 100_000)]
    public int ExecutePerMinute { get; set; } = 30;
}

public static class RateLimitPolicies
{
    public const string Auth = "auth";
    public const string Execute = "execute";

    public static IServiceCollection AddZirveRateLimiting(this IServiceCollection services)
    {
        services
            .AddOptions<RateLimitOptions>()
            .BindConfiguration(RateLimitOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddRateLimiter(limiter =>
        {
            limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

            limiter.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                {
                    context.HttpContext.Response.Headers.RetryAfter =
                        ((int)Math.Ceiling(retryAfter.TotalSeconds)).ToString(CultureInfo.InvariantCulture);
                }

                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.",
                    Extensions = { ["code"] = "rate_limited" },
                };

                await context.HttpContext.Response.WriteAsJsonAsync(
                    problem, options: null, contentType: "application/problem+json", cancellationToken);
            };

            limiter.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(http =>
            {
                var options = http.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;

                return RateLimitPartition.GetSlidingWindowLimiter(ClientAddress(http), _ => new SlidingWindowRateLimiterOptions
                {
                    PermitLimit = options.GlobalPerMinute,
                    Window = TimeSpan.FromMinutes(1),
                    SegmentsPerWindow = 6,
                    QueueLimit = 0,
                });
            });

            limiter.AddPolicy(Auth, http =>
            {
                var options = http.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;

                return RateLimitPartition.GetFixedWindowLimiter(ClientAddress(http), _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = options.AuthPerMinute,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                });
            });

            limiter.AddPolicy(Execute, http =>
            {
                var options = http.RequestServices.GetRequiredService<IOptions<RateLimitOptions>>().Value;
                var key = http.User.GetUserId()?.ToString() ?? ClientAddress(http);

                return RateLimitPartition.GetTokenBucketLimiter(key, _ => new TokenBucketRateLimiterOptions
                {
                    TokenLimit = options.ExecutePerMinute,
                    TokensPerPeriod = Math.Max(1, options.ExecutePerMinute / 6),
                    ReplenishmentPeriod = TimeSpan.FromSeconds(10),
                    AutoReplenishment = true,
                    QueueLimit = 0,
                });
            });
        });

        return services;
    }

    private static string ClientAddress(HttpContext http) => http.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
