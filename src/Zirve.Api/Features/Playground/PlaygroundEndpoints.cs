using Microsoft.AspNetCore.Http.HttpResults;
using Zirve.Api.Features.Problems;
using Zirve.Api.Infrastructure;
using Zirve.Shared.Execution;
using Zirve.Shared.Problems;

namespace Zirve.Api.Features.Playground;

public static class PlaygroundEndpoints
{
    public static RouteGroupBuilder MapPlaygroundEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/playground/run", RunAsync)
            .RequireAuthorization()
            .RequireRateLimiting(RateLimitPolicies.Execute)
            .WithTags("Deneme alanı")
            .WithSummary("Serbest kodu çalıştırır ve çıktısını döndürür.");

        return api;
    }

    private static async Task<Results<Ok<ExecutionResult>, ValidationProblem>> RunAsync(
        CodeRequest request, ICodeRunner runner, CancellationToken cancellationToken)
    {
        if (!Languages.IsSupported(request.Language))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]>
            {
                [nameof(CodeRequest.Language)] = [$"Desteklenen diller: {string.Join(", ", Languages.All)}."],
            });
        }

        var result = await runner.ExecuteAsync(
            new ExecutionRequest { Language = request.Language, Mode = ExecutionMode.Script, Code = request.Code },
            cancellationToken);

        return TypedResults.Ok(result);
    }
}
