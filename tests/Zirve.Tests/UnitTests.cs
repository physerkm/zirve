using Zirve.Api.Data.Entities;
using Zirve.Api.Features.Dashboard;
using Zirve.Api.Features.Quizzes;
using Zirve.Runner.Execution;
using Zirve.Shared.Problems;
using Zirve.Tests.Runner;

namespace Zirve.Tests;

public sealed class ResultComparerTests
{
    [Theory]
    [InlineData("[1,2,3]", "[1,2,3]", CompareModes.Exact, true)]
    [InlineData("[1,2,3]", "[3,2,1]", CompareModes.Exact, false)]
    [InlineData("[1,2,3]", "[3,2,1]", CompareModes.Unordered, true)]
    [InlineData("[1,2,2]", "[2,1,1]", CompareModes.Unordered, false)]
    [InlineData("[[1,2],[3]]", "[[3],[2,1]]", CompareModes.Unordered, false)]
    [InlineData("[[1,2],[3]]", "[[3],[2,1]]", CompareModes.UnorderedNested, true)]
    [InlineData("[[\"eat\",\"tea\"],[\"bat\"]]", "[[\"bat\"],[\"tea\",\"eat\"]]", CompareModes.UnorderedNested, true)]
    [InlineData("2.5", "2.5000001", CompareModes.Exact, true)]
    [InlineData("2.5", "2.6", CompareModes.Exact, false)]
    [InlineData("1000000001", "1000000002", CompareModes.Exact, false)]
    [InlineData("3", "3.0", CompareModes.Exact, true)]
    [InlineData("true", "true", CompareModes.Exact, true)]
    [InlineData("true", "1", CompareModes.Exact, false)]
    [InlineData("null", "null", CompareModes.Exact, true)]
    [InlineData("null", "[]", CompareModes.Exact, false)]
    [InlineData("\"ab\"", "\"ab\"", CompareModes.Exact, true)]
    [InlineData("\"ab\"", "\"Ab\"", CompareModes.Exact, false)]
    [InlineData("[-3,-1,2]", "[2,-1,-3]", CompareModes.Unordered, true)]
    [InlineData("[10,9,100,1]", "[1,100,9,10]", CompareModes.Unordered, true)]
    [InlineData("[[1,2],[1]]", "[[1],[1,2]]", CompareModes.Unordered, true)]
    [InlineData("[[-1,0,1],[-1,-1,2]]", "[[2,-1,-1],[1,0,-1]]", CompareModes.UnorderedNested, true)]
    [InlineData("[\"b\",1,null,true]", "[true,null,1,\"b\"]", CompareModes.Unordered, true)]
    public void Compares_json_values(string expected, string actual, string mode, bool equal)
    {
        Assert.Equal(equal, ResultComparer.AreEqual(RunnerFixture.Json(expected), RunnerFixture.Json(actual), mode));
    }

    [Fact]
    public void Missing_actual_value_never_matches()
    {
        Assert.False(ResultComparer.AreEqual(RunnerFixture.Json("null"), default, CompareModes.Exact));
    }
}

public sealed class TypeRefTests
{
    [Theory]
    [InlineData("int", "int", "number")]
    [InlineData("int[]", "int[]", "number[]")]
    [InlineData("int[][]", "int[][]", "number[][]")]
    [InlineData("List<List<int>>", "IList<IList<int>>", "number[][]")]
    [InlineData("List<string>", "IList<string>", "string[]")]
    [InlineData("char[][]", "char[][]", "string[][]")]
    [InlineData("bool", "bool", "boolean")]
    [InlineData("ListNode", "ListNode", "ListNode | null")]
    [InlineData("ListNode[]", "ListNode[]", "(ListNode | null)[]")]
    [InlineData("TreeNode", "TreeNode", "TreeNode | null")]
    public void Maps_types_to_each_language(string type, string csharp, string typescript)
    {
        var parsed = TypeRef.Parse(type);

        Assert.Equal(csharp, parsed.ToCSharp());
        Assert.Equal(typescript, parsed.ToTypeScript());
    }

    [Theory]
    [InlineData("matrix")]
    [InlineData("List<int")]
    [InlineData("")]
    public void Rejects_unknown_types(string type)
    {
        Assert.False(TypeRef.TryParse(type, out _));
    }
}

public sealed class StarterCodeGeneratorTests
{
    private static readonly ProblemSpec Function = new()
    {
        Name = "mergeLists",
        Params = [new ParamSpec("first", "ListNode"), new ParamSpec("limit", "int")],
        Returns = "List<int>",
    };

    [Fact]
    public void CSharp_function_uses_pascal_case_and_documents_helper_types()
    {
        var code = StarterCodeGenerator.Generate(Function, Languages.CSharp);

        Assert.Contains("public IList<int> MergeLists(ListNode first, int limit)", code);
        Assert.Contains("// public class ListNode", code);
    }

    [Fact]
    public void TypeScript_function_uses_nullable_node_types()
    {
        var code = StarterCodeGenerator.Generate(Function, Languages.TypeScript);

        Assert.Contains("function mergeLists(first: ListNode | null, limit: number): number[] {", code);
    }

    [Fact]
    public void JavaScript_function_has_jsdoc()
    {
        var code = StarterCodeGenerator.Generate(Function, Languages.JavaScript);

        Assert.Contains("@param {ListNode} first", code);
        Assert.Contains("@return {number[]}", code);
        Assert.Contains("function mergeLists(first, limit) {", code);
    }

    [Fact]
    public void Class_problem_generates_constructor_and_methods()
    {
        var spec = new ProblemSpec
        {
            Kind = ProblemKinds.Class,
            Name = "LruCache",
            Params = [new ParamSpec("capacity", "int")],
            Methods =
            [
                new MethodSpec("get", [new ParamSpec("key", "int")], "int"),
                new MethodSpec("put", [new ParamSpec("key", "int"), new ParamSpec("value", "int")], "void"),
            ],
        };

        var csharp = StarterCodeGenerator.Generate(spec, Languages.CSharp);
        var typescript = StarterCodeGenerator.Generate(spec, Languages.TypeScript);

        Assert.Contains("public LruCache(int capacity)", csharp);
        Assert.Contains("public int Get(int key)", csharp);
        Assert.Contains("public void Put(int key, int value)", csharp);
        Assert.Contains("constructor(capacity: number) {", typescript);
        Assert.Contains("put(key: number, value: number): void {", typescript);
    }
}

public sealed class QuizGradingTests
{
    private static Question CreateQuestion(params bool[] correctness) => new()
    {
        Id = 7,
        Text = "?",
        Options = [.. correctness.Select((isCorrect, index) => new QuestionOption { Id = index + 1, Text = $"şık {index + 1}", IsCorrect = isCorrect })],
    };

    [Fact]
    public void Single_choice_is_correct_only_when_the_right_option_is_selected()
    {
        var question = CreateQuestion(false, true, false);

        Assert.True(QuizEndpoints.Grade(question, [2]).Correct);
        Assert.False(QuizEndpoints.Grade(question, [1]).Correct);
        Assert.False(QuizEndpoints.Grade(question, null).Correct);
    }

    [Fact]
    public void Multiple_choice_requires_exactly_the_correct_set()
    {
        var question = CreateQuestion(true, true, false, false);

        Assert.True(QuizEndpoints.Grade(question, [2, 1]).Correct);
        Assert.False(QuizEndpoints.Grade(question, [1]).Correct);
        Assert.False(QuizEndpoints.Grade(question, [1, 2, 3]).Correct);
    }

    [Fact]
    public void Unknown_and_duplicate_option_ids_are_ignored()
    {
        var question = CreateQuestion(false, true);
        var result = QuizEndpoints.Grade(question, [2, 2, 99]);

        Assert.True(result.Correct);
        Assert.Equal([2], result.SelectedOptionIds);
    }
}

public sealed class StreakTests
{
    private static readonly DateOnly Today = new(2026, 11, 15);

    [Fact]
    public void Counts_consecutive_days_ending_today()
    {
        Assert.Equal(3, DashboardEndpoints.ComputeStreak([Today, Today.AddDays(-1), Today.AddDays(-2), Today.AddDays(-4)], Today));
    }

    [Fact]
    public void A_streak_survives_until_the_end_of_the_next_day()
    {
        Assert.Equal(2, DashboardEndpoints.ComputeStreak([Today.AddDays(-1), Today.AddDays(-2)], Today));
    }

    [Fact]
    public void A_gap_of_a_full_day_resets_the_streak()
    {
        Assert.Equal(0, DashboardEndpoints.ComputeStreak([Today.AddDays(-2), Today.AddDays(-3)], Today));
        Assert.Equal(0, DashboardEndpoints.ComputeStreak([], Today));
    }
}
