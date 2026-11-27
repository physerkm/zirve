using System.Security.Claims;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Mvc;

namespace Zirve.Api.Infrastructure;

public static class ZirveClaims
{
    public const string DisplayName = "display_name";
}

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public static Guid RequireUserId(this ClaimsPrincipal user) =>
        user.GetUserId() ?? throw new InvalidOperationException("Kimliği doğrulanmış bir kullanıcı bekleniyordu.");
}

public static class SecurityMiddlewareExtensions
{
    public const string CsrfHeaderName = "X-CSRF-TOKEN";

    /// <summary>Bütün yanıtlara temel güvenlik başlıklarını ekler; API yanıtlarının önbelleğe alınmasını engeller.</summary>
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                var headers = context.Response.Headers;
                headers.XContentTypeOptions = "nosniff";
                headers.XFrameOptions = "DENY";
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
                headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
                headers["Cross-Origin-Opener-Policy"] = "same-origin";

                if (context.Request.Path.StartsWithSegments("/api") && !headers.ContainsKey("Cache-Control"))
                {
                    headers.CacheControl = "no-store";
                }

                return Task.CompletedTask;
            });

            await next();
        });

    /// <summary>
    /// /api altındaki durum değiştiren (GET/HEAD/OPTIONS dışı) bütün isteklerde antiforgery belirtecini doğrular.
    /// Oturum çerezi zaten SameSite=Strict'tir; bu ikinci bir savunma katmanıdır.
    /// </summary>
    public static IApplicationBuilder UseCsrfProtection(this IApplicationBuilder app) =>
        app.Use(async (context, next) =>
        {
            var method = context.Request.Method;
            var isSafe = HttpMethods.IsGet(method) || HttpMethods.IsHead(method) || HttpMethods.IsOptions(method) || HttpMethods.IsTrace(method);

            if (isSafe || !context.Request.Path.StartsWithSegments("/api"))
            {
                await next();
                return;
            }

            var antiforgery = context.RequestServices.GetRequiredService<IAntiforgery>();

            try
            {
                await antiforgery.ValidateRequestAsync(context);
            }
            catch (AntiforgeryValidationException)
            {
                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = Localization.Text(
                        "Güvenlik belirteci geçersiz ya da eksik. Sayfayı yenileyip tekrar deneyin.",
                        "The security token is invalid or missing. Refresh the page and try again."),
                    Extensions = { ["code"] = "csrf_invalid" },
                };

                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(problem, options: null, contentType: "application/problem+json");
                return;
            }

            await next();
        });
}
