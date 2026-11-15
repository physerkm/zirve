using System.ComponentModel.DataAnnotations;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Zirve.Shared;
using Zirve.Shared.Execution;

namespace Zirve.Api.Infrastructure;

public sealed class RunnerClientOptions
{
    public const string SectionName = "Runner";

    [Required]
    public string BaseUrl { get; set; } = string.Empty;

    public string? ApiKey { get; set; }

    [Range(5, 300)]
    public int TimeoutSeconds { get; set; } = 60;
}

/// <summary>Runner'a ulaşılamadığında ya da Runner dolu olduğunda fırlatılır (HTTP 503'e çevrilir).</summary>
public sealed class RunnerUnavailableException(string message, Exception? innerException = null)
    : Exception(message, innerException);

/// <summary>Runner isteği geçersiz bulduğunda fırlatılır (HTTP 400'e çevrilir).</summary>
public sealed class RunnerRejectedException(string message) : Exception(message);

/// <summary>Kullanıcı kodunu çalıştıran servisin soyutlaması; testlerde süreç içi bir uygulamayla değiştirilir.</summary>
public interface ICodeRunner
{
    Task<ExecutionResult> ExecuteAsync(ExecutionRequest request, CancellationToken cancellationToken);
}

/// <summary>İzole Runner servisine HTTP üzerinden bağlanan uygulama.</summary>
public sealed class HttpCodeRunner(HttpClient http) : ICodeRunner
{
    public async Task<ExecutionResult> ExecuteAsync(ExecutionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await http.PostAsJsonAsync("execute", request, ZirveJson.Options, cancellationToken);

            switch (response.StatusCode)
            {
                case HttpStatusCode.ServiceUnavailable:
                    throw new RunnerUnavailableException("Kod çalıştırma servisi şu anda yoğun. Lütfen birkaç saniye sonra tekrar deneyin.");

                case HttpStatusCode.BadRequest:
                    var problem = await response.Content.ReadFromJsonAsync<ProblemDetails>(ZirveJson.Options, cancellationToken);
                    throw new RunnerRejectedException(problem?.Title ?? "Kod çalıştırma isteği geçersiz.");
            }

            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<ExecutionResult>(ZirveJson.Options, cancellationToken)
                   ?? throw new RunnerUnavailableException("Kod çalıştırma servisi boş yanıt döndürdü.");
        }
        catch (HttpRequestException ex)
        {
            throw new RunnerUnavailableException("Kod çalıştırma servisine ulaşılamıyor.", ex);
        }
        catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
        {
            throw new RunnerUnavailableException("Kod çalıştırma servisi zamanında yanıt vermedi.", ex);
        }
    }
}

public static class CodeRunnerRegistration
{
    public static IServiceCollection AddCodeRunner(this IServiceCollection services)
    {
        services
            .AddOptions<RunnerClientOptions>()
            .BindConfiguration(RunnerClientOptions.SectionName)
            .ValidateDataAnnotations()
            .ValidateOnStart();

        services.AddHttpClient<ICodeRunner, HttpCodeRunner>((provider, client) =>
        {
            var options = provider.GetRequiredService<IOptions<RunnerClientOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds);

            if (!string.IsNullOrEmpty(options.ApiKey))
            {
                client.DefaultRequestHeaders.Add("X-Runner-Key", options.ApiKey);
            }
        });

        return services;
    }
}
