using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Zirve.Runner;
using Zirve.Runner.CSharp;
using Zirve.Runner.Execution;
using Zirve.Runner.Node;
using Zirve.Shared;
using Zirve.Shared.Execution;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddOptions<RunnerOptions>()
    .BindConfiguration(RunnerOptions.SectionName)
    .ValidateDataAnnotations()
    .ValidateOnStart();

builder.Services.AddSingleton<WorkDirectory>();
builder.Services.AddSingleton<Sandbox>();
builder.Services.AddSingleton<CSharpCompiler>();
builder.Services.AddSingleton<CSharpExecutor>();
builder.Services.AddSingleton<NodeExecutor>();
builder.Services.AddSingleton<ExecutionService>();
builder.Services.AddHostedService<WarmupService>();
builder.Services.AddProblemDetails();
builder.Services.ConfigureHttpJsonOptions(options => ZirveJson.Apply(options.SerializerOptions));
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 2 * 1024 * 1024);

var app = builder.Build();

app.UseExceptionHandler();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));

app.MapPost("/execute", async (
    ExecutionRequest request,
    ExecutionService service,
    IOptions<RunnerOptions> options,
    HttpContext http,
    CancellationToken cancellationToken) =>
{
    if (!IsAuthorized(http, options.Value.ApiKey))
    {
        return Results.Problem(statusCode: StatusCodes.Status401Unauthorized, title: "Geçersiz Runner anahtarı.");
    }

    try
    {
        return Results.Ok(await service.ExecuteAsync(request, cancellationToken));
    }
    catch (InvalidExecutionRequestException ex)
    {
        return Results.Problem(statusCode: StatusCodes.Status400BadRequest, title: ex.Message);
    }
    catch (RunnerBusyException ex)
    {
        http.Response.Headers.RetryAfter = "5";
        return Results.Problem(statusCode: StatusCodes.Status503ServiceUnavailable, title: ex.Message);
    }
});

app.Run();

static bool IsAuthorized(HttpContext http, string? expectedKey)
{
    if (string.IsNullOrEmpty(expectedKey))
    {
        return true;
    }

    var provided = http.Request.Headers["X-Runner-Key"].ToString();

    // Sabit zamanlı karşılaştırma: anahtar, yanıt süresinden sızdırılamasın.
    return CryptographicOperations.FixedTimeEquals(
        SHA256.HashData(Encoding.UTF8.GetBytes(provided)),
        SHA256.HashData(Encoding.UTF8.GetBytes(expectedKey)));
}
