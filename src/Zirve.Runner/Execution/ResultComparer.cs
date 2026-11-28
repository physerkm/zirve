using System.Globalization;
using System.Text.Json;
using Zirve.Shared.Problems;

namespace Zirve.Runner.Execution;

/// <summary>
/// Beklenen ve gerçek sonucu dilden bağımsız biçimde karşılaştırır. Bütün diller aynı kurallarla
/// değerlendirilsin diye karşılaştırma yalnızca burada yapılır.
/// </summary>
public static class ResultComparer
{
    private const double Tolerance = 1e-6;

    public static bool AreEqual(JsonElement expected, JsonElement actual, string mode)
    {
        if (actual.ValueKind == JsonValueKind.Undefined)
        {
            return false;
        }

        var sortTop = mode is CompareModes.Unordered or CompareModes.UnorderedNested;
        var sortNested = mode is CompareModes.UnorderedNested;

        var left = Normalize(ToTree(expected), sortTop, sortNested);
        var right = Normalize(ToTree(actual), sortTop, sortNested);
        return TreeEquals(left, right);
    }

    private static object? ToTree(JsonElement element) => element.ValueKind switch
    {
        JsonValueKind.Null or JsonValueKind.Undefined => null,
        JsonValueKind.True => true,
        JsonValueKind.False => false,
        // object'e kutulanır: "? long : double" ifadesinin türü double olur ve tam sayıyı yine yuvarlardı.
        JsonValueKind.Number => element.TryGetInt64(out var integer) ? (object)integer : element.GetDouble(),
        JsonValueKind.String => element.GetString(),
        JsonValueKind.Array => element.EnumerateArray().Select(ToTree).ToList(),
        JsonValueKind.Object => new SortedDictionary<string, object?>(
            element.EnumerateObject().ToDictionary(p => p.Name, p => ToTree(p.Value), StringComparer.Ordinal),
            StringComparer.Ordinal),
        _ => null,
    };

    /// <summary>Sırası önemsiz dizileri, karşılaştırmadan önce kararlı bir sıraya sokar.</summary>
    private static object? Normalize(object? node, bool sortThis, bool sortChildren)
    {
        if (node is not List<object?> list)
        {
            return node;
        }

        var items = list.Select(item => Normalize(item, sortChildren, sortChildren)).ToList();

        if (sortThis)
        {
            items.Sort(Order);
        }

        return items;
    }

    /// <summary>Herhangi iki JSON değeri arasında tutarlı (tam) bir sıralama tanımlar.</summary>
    private static int Order(object? left, object? right)
    {
        var rank = Rank(left).CompareTo(Rank(right));
        if (rank != 0)
        {
            return rank;
        }

        switch (left, right)
        {
            case (bool a, bool b):
                return a.CompareTo(b);
            case (long a, long b):
                return a.CompareTo(b);
            case (double or long, double or long):
                return Convert.ToDouble(left, CultureInfo.InvariantCulture).CompareTo(Convert.ToDouble(right, CultureInfo.InvariantCulture));
            case (string a, string b):
                return string.CompareOrdinal(a, b);
            case (List<object?> a, List<object?> b):
                for (var i = 0; i < Math.Min(a.Count, b.Count); i++)
                {
                    var order = Order(a[i], b[i]);
                    if (order != 0)
                    {
                        return order;
                    }
                }

                return a.Count.CompareTo(b.Count);
            case (SortedDictionary<string, object?> a, SortedDictionary<string, object?> b):
                using (var first = a.GetEnumerator())
                using (var second = b.GetEnumerator())
                {
                    while (first.MoveNext() && second.MoveNext())
                    {
                        var key = string.CompareOrdinal(first.Current.Key, second.Current.Key);
                        if (key != 0)
                        {
                            return key;
                        }

                        var value = Order(first.Current.Value, second.Current.Value);
                        if (value != 0)
                        {
                            return value;
                        }
                    }
                }

                return a.Count.CompareTo(b.Count);
            default:
                return 0;
        }
    }

    private static int Rank(object? node) => node switch
    {
        null => 0,
        bool => 1,
        double or long => 2,
        string => 3,
        List<object?> => 4,
        _ => 5,
    };

    private static bool TreeEquals(object? left, object? right)
    {
        switch (left, right)
        {
            case (null, null):
                return true;
            case (bool a, bool b):
                return a == b;
            case (string a, string b):
                return string.Equals(a, b, StringComparison.Ordinal);
            // Tam sayılar (long) birebir karşılaştırılır; 2^53 üstünde double eşitliği yanıltıcıdır.
            case (long a, long b):
                return a == b;
            case (double or long, double or long):
                return NumbersEqual(Convert.ToDouble(left, CultureInfo.InvariantCulture), Convert.ToDouble(right, CultureInfo.InvariantCulture));
            case (List<object?> a, List<object?> b):
                if (a.Count != b.Count)
                {
                    return false;
                }

                for (var i = 0; i < a.Count; i++)
                {
                    if (!TreeEquals(a[i], b[i]))
                    {
                        return false;
                    }
                }

                return true;
            case (SortedDictionary<string, object?> a, SortedDictionary<string, object?> b):
                return a.Count == b.Count && a.All(pair => b.TryGetValue(pair.Key, out var other) && TreeEquals(pair.Value, other));
            default:
                return false;
        }
    }

    private static bool NumbersEqual(double a, double b)
    {
        if (double.IsNaN(a) || double.IsNaN(b))
        {
            return double.IsNaN(a) && double.IsNaN(b);
        }

        // Tam sayılar birebir karşılaştırılır; tolerans yalnızca ondalıklı sonuçlar içindir.
        var bothIntegers = Math.Floor(a) == a && Math.Floor(b) == b;
        if (bothIntegers)
        {
            return a == b;
        }

        return Math.Abs(a - b) <= Tolerance * Math.Max(1, Math.Max(Math.Abs(a), Math.Abs(b)));
    }
}
