using System.Text;

namespace Zirve.Shared.Problems;

/// <summary>Problem imzasından her dil için başlangıç (iskelet) kodu üretir.</summary>
public static class StarterCodeGenerator
{
    public static string Generate(ProblemSpec spec, string language)
    {
        ArgumentNullException.ThrowIfNull(spec);

        return language switch
        {
            Languages.CSharp => CSharp(spec),
            Languages.TypeScript => TypeScript(spec),
            Languages.JavaScript => JavaScript(spec),
            _ => throw new ArgumentOutOfRangeException(nameof(language), language, "Desteklenmeyen dil."),
        };
    }

    public static string ToPascalCase(string name) =>
        string.IsNullOrEmpty(name) ? name : char.ToUpperInvariant(name[0]) + name[1..];

    private static IEnumerable<string> AllTypes(ProblemSpec spec)
    {
        foreach (var p in spec.Params)
        {
            yield return p.Type;
        }

        yield return spec.Returns;

        foreach (var m in spec.Methods)
        {
            foreach (var p in m.Params)
            {
                yield return p.Type;
            }

            yield return m.Returns;
        }
    }

    private static bool Uses(ProblemSpec spec, string scalar) =>
        AllTypes(spec).Any(t => TypeRef.Parse(t).Uses(scalar));

    // ---------------------------------------------------------------- C#

    private static string CSharp(ProblemSpec spec)
    {
        var sb = new StringBuilder();

        if (Uses(spec, "ListNode"))
        {
            sb.AppendLine("// ListNode hazır olarak tanımlıdır:");
            sb.AppendLine("// public class ListNode {");
            sb.AppendLine("//     public int val;");
            sb.AppendLine("//     public ListNode next;");
            sb.AppendLine("//     public ListNode(int val = 0, ListNode next = null) { this.val = val; this.next = next; }");
            sb.AppendLine("// }");
        }

        if (Uses(spec, "TreeNode"))
        {
            sb.AppendLine("// TreeNode hazır olarak tanımlıdır:");
            sb.AppendLine("// public class TreeNode {");
            sb.AppendLine("//     public int val;");
            sb.AppendLine("//     public TreeNode left;");
            sb.AppendLine("//     public TreeNode right;");
            sb.AppendLine("//     public TreeNode(int val = 0, TreeNode left = null, TreeNode right = null) { ... }");
            sb.AppendLine("// }");
        }

        if (spec.Kind == ProblemKinds.Class)
        {
            sb.AppendLine($"public class {spec.Name}");
            sb.AppendLine("{");
            sb.AppendLine($"    public {spec.Name}({CSharpParams(spec.Params)})");
            sb.AppendLine("    {");
            sb.AppendLine("        ");
            sb.AppendLine("    }");

            foreach (var method in spec.Methods)
            {
                sb.AppendLine();
                sb.AppendLine($"    public {TypeRef.Parse(method.Returns).ToCSharp()} {ToPascalCase(method.Name)}({CSharpParams(method.Params)})");
                sb.AppendLine("    {");
                sb.AppendLine("        ");
                sb.AppendLine("    }");
            }

            sb.AppendLine("}");
            return sb.ToString();
        }

        sb.AppendLine("public class Solution");
        sb.AppendLine("{");
        sb.AppendLine($"    public {TypeRef.Parse(spec.Returns).ToCSharp()} {ToPascalCase(spec.Name)}({CSharpParams(spec.Params)})");
        sb.AppendLine("    {");
        sb.AppendLine("        ");
        sb.AppendLine("    }");
        sb.AppendLine("}");
        return sb.ToString();
    }

    private static string CSharpParams(IEnumerable<ParamSpec> parameters) =>
        string.Join(", ", parameters.Select(p => $"{TypeRef.Parse(p.Type).ToCSharp()} {p.Name}"));

    // ---------------------------------------------------------------- TypeScript

    private static string TypeScript(ProblemSpec spec)
    {
        var sb = new StringBuilder();

        if (Uses(spec, "ListNode"))
        {
            sb.AppendLine("// ListNode hazır olarak tanımlıdır:");
            sb.AppendLine("// class ListNode {");
            sb.AppendLine("//   val: number;");
            sb.AppendLine("//   next: ListNode | null;");
            sb.AppendLine("//   constructor(val?: number, next?: ListNode | null)");
            sb.AppendLine("// }");
        }

        if (Uses(spec, "TreeNode"))
        {
            sb.AppendLine("// TreeNode hazır olarak tanımlıdır:");
            sb.AppendLine("// class TreeNode {");
            sb.AppendLine("//   val: number;");
            sb.AppendLine("//   left: TreeNode | null;");
            sb.AppendLine("//   right: TreeNode | null;");
            sb.AppendLine("//   constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null)");
            sb.AppendLine("// }");
        }

        if (spec.Kind == ProblemKinds.Class)
        {
            sb.AppendLine($"class {spec.Name} {{");
            sb.AppendLine($"  constructor({TsParams(spec.Params)}) {{");
            sb.AppendLine("    ");
            sb.AppendLine("  }");

            foreach (var method in spec.Methods)
            {
                sb.AppendLine();
                sb.AppendLine($"  {method.Name}({TsParams(method.Params)}): {TypeRef.Parse(method.Returns).ToTypeScript()} {{");
                sb.AppendLine("    ");
                sb.AppendLine("  }");
            }

            sb.AppendLine("}");
            return sb.ToString();
        }

        sb.AppendLine($"function {spec.Name}({TsParams(spec.Params)}): {TypeRef.Parse(spec.Returns).ToTypeScript()} {{");
        sb.AppendLine("  ");
        sb.AppendLine("}");
        return sb.ToString();
    }

    private static string TsParams(IEnumerable<ParamSpec> parameters) =>
        string.Join(", ", parameters.Select(p => $"{p.Name}: {TypeRef.Parse(p.Type).ToTypeScript()}"));

    // ---------------------------------------------------------------- JavaScript

    private static string JavaScript(ProblemSpec spec)
    {
        var sb = new StringBuilder();

        if (Uses(spec, "ListNode"))
        {
            sb.AppendLine("// ListNode hazır olarak tanımlıdır:");
            sb.AppendLine("// function ListNode(val, next) { this.val = val ?? 0; this.next = next ?? null; }");
        }

        if (Uses(spec, "TreeNode"))
        {
            sb.AppendLine("// TreeNode hazır olarak tanımlıdır:");
            sb.AppendLine("// function TreeNode(val, left, right) { this.val = val ?? 0; this.left = left ?? null; this.right = right ?? null; }");
        }

        if (spec.Kind == ProblemKinds.Class)
        {
            sb.AppendLine($"class {spec.Name} {{");
            AppendJsDoc(sb, spec.Params, null, "  ");
            sb.AppendLine($"  constructor({JsParams(spec.Params)}) {{");
            sb.AppendLine("    ");
            sb.AppendLine("  }");

            foreach (var method in spec.Methods)
            {
                sb.AppendLine();
                AppendJsDoc(sb, method.Params, method.Returns, "  ");
                sb.AppendLine($"  {method.Name}({JsParams(method.Params)}) {{");
                sb.AppendLine("    ");
                sb.AppendLine("  }");
            }

            sb.AppendLine("}");
            return sb.ToString();
        }

        AppendJsDoc(sb, spec.Params, spec.Returns, string.Empty);
        sb.AppendLine($"function {spec.Name}({JsParams(spec.Params)}) {{");
        sb.AppendLine("  ");
        sb.AppendLine("}");
        return sb.ToString();
    }

    private static void AppendJsDoc(StringBuilder sb, IReadOnlyList<ParamSpec> parameters, string? returns, string indent)
    {
        sb.AppendLine($"{indent}/**");

        foreach (var p in parameters)
        {
            sb.AppendLine($"{indent} * @param {{{TypeRef.Parse(p.Type).ToJsDoc()}}} {p.Name}");
        }

        if (returns is not null)
        {
            sb.AppendLine($"{indent} * @return {{{TypeRef.Parse(returns).ToJsDoc()}}}");
        }

        sb.AppendLine($"{indent} */");
    }

    private static string JsParams(IEnumerable<ParamSpec> parameters) =>
        string.Join(", ", parameters.Select(p => p.Name));
}
