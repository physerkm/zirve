using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Zirve.Runner.Execution;
using Zirve.Shared.Execution;

namespace Zirve.Runner.CSharp;

/// <summary>
/// Kullanıcı kodunda dosya sistemi, ağ, yansıma, süreç ve birlikte çalışma (interop) API'lerinin
/// kullanımını derleme aşamasında reddeder.
/// <para>
/// Bu bir güvenlik SINIRI değildir; derinlemesine savunmanın bir katmanıdır. Asıl yalıtım,
/// Runner'ın ağsız, salt-okunur, yetkisiz bir kapsayıcıda çalıştırılmasıyla sağlanır.
/// </para>
/// </summary>
public static class ApiRestrictionAnalyzer
{
    private const int MaxViolations = 10;

    private static readonly string[] BannedNamespaces =
    [
        "System.IO",
        "System.Net",
        "System.Reflection",
        "System.Runtime.InteropServices",
        "System.Runtime.Loader",
        "System.Runtime.Remoting",
        "System.Runtime.Serialization",
        "System.Diagnostics",
        "System.Resources",
        "System.Security",
        "Microsoft.Win32",
    ];

    private static readonly string[] AllowedNamespaces =
    [
        "System.Diagnostics.CodeAnalysis",
    ];

    private static readonly HashSet<string> AllowedTypes = new(StringComparer.Ordinal)
    {
        "System.IO.StringReader",
        "System.IO.StringWriter",
        "System.IO.TextReader",
        "System.IO.TextWriter",
        "System.IO.MemoryStream",
        "System.IO.Stream",
        "System.IO.SeekOrigin",
        "System.IO.IOException",
        "System.IO.EndOfStreamException",
        "System.IO.InvalidDataException",
        "System.Diagnostics.Stopwatch",
        "System.Diagnostics.Debug",
        "System.Diagnostics.DebuggerDisplayAttribute",
        "System.Diagnostics.DebuggerBrowsableAttribute",
        "System.Diagnostics.DebuggerBrowsableState",
        "System.Diagnostics.DebuggerStepThroughAttribute",
        "System.Diagnostics.ConditionalAttribute",
        "System.Diagnostics.UnreachableException",
    };

    private static readonly HashSet<string> BannedTypes = new(StringComparer.Ordinal)
    {
        "System.AppDomain",
        "System.AppContext",
        "System.Activator",
        "System.Runtime.CompilerServices.Unsafe",
        "System.Runtime.CompilerServices.RuntimeHelpers",
    };

    private static readonly HashSet<string> AllowedEnvironmentMembers = new(StringComparer.Ordinal)
    {
        "NewLine", "TickCount", "TickCount64", "ProcessorCount", "CurrentManagedThreadId",
    };

    private static readonly HashSet<string> AllowedTypeMembers = new(StringComparer.Ordinal)
    {
        "Name", "FullName", "Namespace", "BaseType", "IsValueType", "IsClass", "IsInterface", "IsEnum",
        "IsArray", "IsAbstract", "IsSealed", "IsPrimitive", "IsGenericType", "IsGenericTypeDefinition",
        "GetGenericArguments", "GetGenericTypeDefinition", "GetInterfaces", "GetElementType",
        "IsAssignableFrom", "IsAssignableTo", "IsInstanceOfType", "IsSubclassOf",
        "Equals", "GetHashCode", "ToString", "GetType",
    };

    private static readonly HashSet<string> BannedConsoleMembers = new(StringComparer.Ordinal)
    {
        "SetOut", "SetError", "SetIn", "OpenStandardInput", "OpenStandardOutput", "OpenStandardError",
    };

    public static List<CompileDiagnostic> Analyze(CSharpCompilation compilation, SyntaxTree userTree)
    {
        var model = compilation.GetSemanticModel(userTree);
        var violations = new List<CompileDiagnostic>();
        var reported = new HashSet<string>(StringComparer.Ordinal);

        foreach (var node in userTree.GetRoot().DescendantNodes().OfType<SimpleNameSyntax>())
        {
            var info = model.GetSymbolInfo(node);
            var symbol = info.Symbol ?? (info.CandidateSymbols.Length > 0 ? info.CandidateSymbols[0] : null);
            if (symbol is null)
            {
                continue;
            }

            var violation = Check(symbol);
            if (violation is null)
            {
                continue;
            }

            var position = node.GetLocation().GetLineSpan().StartLinePosition;
            if (reported.Add($"{position.Line}:{violation}"))
            {
                violations.Add(new CompileDiagnostic(
                    position.Line + 1,
                    position.Character + 1,
                    RunnerText.T(
                        $"Güvenlik nedeniyle bu ortamda '{violation}' kullanılamaz.",
                        $"'{violation}' can't be used in this environment for security reasons.")));
            }

            if (violations.Count >= MaxViolations)
            {
                break;
            }
        }

        return violations;
    }

    private static string? Check(ISymbol symbol)
    {
        if (symbol is IAliasSymbol alias)
        {
            symbol = alias.Target;
        }

        return symbol switch
        {
            INamedTypeSymbol type => CheckType(type),
            IMethodSymbol or IPropertySymbol or IFieldSymbol or IEventSymbol => CheckMember(symbol.ContainingType, symbol.Name),
            _ => null,
        };
    }

    private static string? CheckMember(INamedTypeSymbol? containingType, string memberName)
    {
        if (containingType is null || IsDeclaredInSource(containingType))
        {
            return null;
        }

        var fullName = FullName(containingType);

        return fullName switch
        {
            "System.Environment" => AllowedEnvironmentMembers.Contains(memberName) ? null : $"Environment.{memberName}",
            "System.Type" => AllowedTypeMembers.Contains(memberName) ? null : $"Type.{memberName}",
            "System.Console" => BannedConsoleMembers.Contains(memberName) ? $"Console.{memberName}" : null,
            // typeof(T).Name / GetType().Name çok yaygın ve zararsızdır.
            "System.Reflection.MemberInfo" when memberName == "Name" => null,
            _ => CheckType(containingType),
        };
    }

    private static string? CheckType(INamedTypeSymbol type)
    {
        if (IsDeclaredInSource(type))
        {
            return null;
        }

        var fullName = FullName(type);
        if (AllowedTypes.Contains(fullName))
        {
            return null;
        }

        if (BannedTypes.Contains(fullName))
        {
            return fullName;
        }

        var containingNamespace = Outermost(type).ContainingNamespace?.ToDisplayString() ?? string.Empty;

        if (AllowedNamespaces.Any(prefix => IsWithin(containingNamespace, prefix)))
        {
            return null;
        }

        return BannedNamespaces.Any(prefix => IsWithin(containingNamespace, prefix)) ? fullName : null;
    }

    private static bool IsDeclaredInSource(ISymbol symbol) => symbol.Locations.Any(location => location.IsInSource);

    private static INamedTypeSymbol Outermost(INamedTypeSymbol type)
    {
        var current = type.OriginalDefinition;
        while (current.ContainingType is not null)
        {
            current = current.ContainingType;
        }

        return current;
    }

    private static string FullName(INamedTypeSymbol type)
    {
        var outer = Outermost(type);
        var containingNamespace = outer.ContainingNamespace;

        return containingNamespace is null || containingNamespace.IsGlobalNamespace
            ? outer.Name
            : $"{containingNamespace.ToDisplayString()}.{outer.Name}";
    }

    private static bool IsWithin(string candidate, string prefix) =>
        candidate.Equals(prefix, StringComparison.Ordinal) || candidate.StartsWith(prefix + ".", StringComparison.Ordinal);
}
