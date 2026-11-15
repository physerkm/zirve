namespace Zirve.Shared.Problems;

/// <summary>
/// Problem imzalarında kullanılan küçük tip dili.
/// Skalerler: int, long, double, bool, string, char, void, ListNode, TreeNode.
/// Bileşikler: <c>T[]</c> (dizi) ve <c>List&lt;T&gt;</c> (liste).
/// </summary>
public sealed record TypeRef(string Name, TypeRef? Element = null)
{
    public const string Array = "array";
    public const string List = "list";

    private static readonly HashSet<string> Scalars =
        ["int", "long", "double", "bool", "string", "char", "void", "ListNode", "TreeNode"];

    public bool IsCollection => Element is not null;

    public static TypeRef Parse(string text)
    {
        ArgumentNullException.ThrowIfNull(text);
        var value = text.Trim();

        if (value.EndsWith("[]", StringComparison.Ordinal))
        {
            return new TypeRef(Array, Parse(value[..^2]));
        }

        if (value.StartsWith("List<", StringComparison.Ordinal) && value.EndsWith('>'))
        {
            return new TypeRef(List, Parse(value[5..^1]));
        }

        if (!Scalars.Contains(value))
        {
            throw new FormatException($"Bilinmeyen tip: '{text}'.");
        }

        return new TypeRef(value);
    }

    public static bool TryParse(string text, out TypeRef? type)
    {
        try
        {
            type = Parse(text);
            return true;
        }
        catch (FormatException)
        {
            type = null;
            return false;
        }
    }

    /// <summary>Tipin (ya da herhangi bir eleman tipinin) verilen skaler olup olmadığını söyler.</summary>
    public bool Uses(string scalar) => Element is null ? Name == scalar : Element.Uses(scalar);

    public string ToCSharp() => Name switch
    {
        Array => $"{Element!.ToCSharp()}[]",
        List => $"IList<{Element!.ToCSharp()}>",
        _ => Name,
    };

    public string ToTypeScript() => Name switch
    {
        Array or List => Element!.Name is "ListNode" or "TreeNode"
            ? $"({Element.ToTypeScript()})[]"
            : $"{Element.ToTypeScript()}[]",
        "int" or "long" or "double" => "number",
        "bool" => "boolean",
        "string" or "char" => "string",
        "void" => "void",
        "ListNode" => "ListNode | null",
        "TreeNode" => "TreeNode | null",
        _ => Name,
    };

    /// <summary>JSDoc içinde kullanılan tip gösterimi.</summary>
    public string ToJsDoc() => Name switch
    {
        Array or List => $"{Element!.ToJsDoc()}[]",
        "int" or "long" or "double" => "number",
        "bool" => "boolean",
        "string" or "char" => "string",
        "void" => "void",
        _ => Name,
    };
}
