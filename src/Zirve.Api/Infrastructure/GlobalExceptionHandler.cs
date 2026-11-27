using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace Zirve.Api.Infrastructure;

/// <summary>Beklenmeyen hataları günlükler ve ayrıntı sızdırmadan RFC 9457 problem yanıtına çevirir.</summary>
public sealed class GlobalExceptionHandler(IProblemDetailsService problemDetails, ILogger<GlobalExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        // Bu kod dil ara katmanının dışında çalışır; dil HttpContext'ten okunur.
        var english = Localization.IsEnglishRequest(httpContext);

        var (status, title) = exception switch
        {
            RunnerUnavailableException unavailable => (StatusCodes.Status503ServiceUnavailable, unavailable.Message),
            RunnerRejectedException rejected => (StatusCodes.Status400BadRequest, rejected.Message),
            BadHttpRequestException badRequest => (badRequest.StatusCode, english ? "Invalid request." : "İstek geçersiz."),
            _ => (StatusCodes.Status500InternalServerError, english
                ? "An unexpected error occurred. Please try again later."
                : "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin."),
        };

        if (status >= StatusCodes.Status500InternalServerError)
        {
            logger.LogError(exception, "İstek işlenirken hata: {Method} {Path}", httpContext.Request.Method, httpContext.Request.Path);
        }
        else
        {
            logger.LogWarning("İstek reddedildi ({Status}): {Message}", status, exception.Message);
        }

        httpContext.Response.StatusCode = status;

        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = new ProblemDetails { Status = status, Title = title },
        });
    }
}
