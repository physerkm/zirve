using Zirve.Shared.Execution;
using Zirve.Shared.Problems;

namespace Zirve.Tests.Runner;

public sealed class RunnerExecutionTests(RunnerFixture runner) : IClassFixture<RunnerFixture>
{
    private static readonly ProblemSpec TwoSum = new()
    {
        Name = "twoSum",
        Params = [new ParamSpec("nums", "int[]"), new ParamSpec("target", "int")],
        Returns = "int[]",
    };

    private static readonly (string Args, string Expected)[] TwoSumTests =
    [
        ("[[2,7,11,15], 9]", "[0,1]"),
        ("[[3,2,4], 6]", "[1,2]"),
    ];

    private const string TwoSumCSharp = """
        public class Solution
        {
            public int[] TwoSum(int[] nums, int target)
            {
                var seen = new Dictionary<int, int>();
                for (var i = 0; i < nums.Length; i++)
                {
                    Console.WriteLine($"i={i} şçöğüı");
                    if (seen.TryGetValue(target - nums[i], out var j)) return new[] { j, i };
                    seen[nums[i]] = i;
                }
                return Array.Empty<int>();
            }
        }
        """;

    private const string TwoSumTypeScript = """
        function twoSum(nums: number[], target: number): number[] {
          const seen = new Map<number, number>();
          for (let i = 0; i < nums.length; i++) {
            console.log('i=', i, 'şçöğüı');
            const j = seen.get(target - nums[i]);
            if (j !== undefined) return [j, i];
            seen.set(nums[i], i);
          }
          return [];
        }
        """;

    private const string TwoSumJavaScript = """
        const twoSum = (nums, target) => {
          const seen = new Map();
          for (let i = 0; i < nums.length; i++) {
            if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
            seen.set(nums[i], i);
          }
          return [];
        };
        """;

    [Theory]
    [InlineData(Languages.CSharp, TwoSumCSharp)]
    [InlineData(Languages.TypeScript, TwoSumTypeScript)]
    [InlineData(Languages.JavaScript, TwoSumJavaScript)]
    public async Task Correct_solution_passes_in_every_language(string language, string code)
    {
        var result = await runner.RunTestsAsync(language, code, TwoSum, TwoSumTests);

        Assert.Equal(ExecutionStatus.Completed, result.Status);
        Assert.All(result.Tests, test => Assert.Equal(TestStatus.Passed, test.Status));
        Assert.Equal(2, result.Tests.Count);
    }

    [Theory]
    [InlineData(Languages.CSharp, TwoSumCSharp)]
    [InlineData(Languages.TypeScript, TwoSumTypeScript)]
    public async Task Console_output_is_captured_per_test_with_unicode_intact(string language, string code)
    {
        var result = await runner.RunTestsAsync(language, code, TwoSum, TwoSumTests);

        Assert.Contains("şçöğüı", result.Tests[0].Stdout);
        Assert.Contains("i=", result.Tests[1].Stdout);
    }

    [Fact]
    public async Task Wrong_answer_is_reported_as_failed_with_actual_value()
    {
        const string code = "public class Solution { public int[] TwoSum(int[] nums, int target) => new[] { 0, 1 }; }";

        var result = await runner.RunTestsAsync(Languages.CSharp, code, TwoSum, TwoSumTests);

        Assert.Equal(TestStatus.Passed, result.Tests[0].Status);
        Assert.Equal(TestStatus.Failed, result.Tests[1].Status);
        Assert.Equal("[0,1]", result.Tests[1].Actual!.Value.GetRawText());
    }

    [Fact]
    public async Task CSharp_compile_error_has_line_and_column()
    {
        const string code = """
            public class Solution
            {
                public int[] TwoSum(int[] nums, int target)
                {
                    return nums.Foo();
                }
            }
            """;

        var result = await runner.RunTestsAsync(Languages.CSharp, code, TwoSum, TwoSumTests);

        Assert.Equal(ExecutionStatus.CompileError, result.Status);
        var diagnostic = Assert.Single(result.Diagnostics);
        Assert.Equal(5, diagnostic.Line);
        Assert.Contains("CS1061", diagnostic.Message);
    }

    [Theory]
    [InlineData("System.IO.File.ReadAllText(\"x\");")]
    [InlineData("System.Environment.Exit(1);")]
    [InlineData("var t = typeof(string).Assembly;")]
    [InlineData("System.Activator.CreateInstance(typeof(object));")]
    [InlineData("Console.SetOut(null);")]
    public async Task CSharp_restricted_apis_are_rejected(string statement)
    {
        var code = "public class Solution { public int[] TwoSum(int[] nums, int target) { " + statement + " return nums; } }";

        var result = await runner.RunTestsAsync(Languages.CSharp, code, TwoSum, TwoSumTests);

        Assert.Equal(ExecutionStatus.CompileError, result.Status);
        Assert.Contains(result.Diagnostics, d => d.Message.Contains("Güvenlik nedeniyle", StringComparison.Ordinal));
    }

    [Fact]
    public async Task CSharp_harmless_apis_are_allowed()
    {
        const string code = """
            public class Solution
            {
                public int[] TwoSum(int[] nums, int target)
                {
                    var watch = System.Diagnostics.Stopwatch.StartNew();
                    var name = nums.GetType().Name + typeof(int).FullName + Environment.NewLine;
                    using var writer = new System.IO.StringWriter();
                    writer.Write(name);
                    var builder = new StringBuilder(writer.ToString());
                    return target == 9 ? new[] { 0, 1 } : new[] { 1, 2 };
                }
            }
            """;

        var result = await runner.RunTestsAsync(Languages.CSharp, code, TwoSum, TwoSumTests);

        Assert.Equal(ExecutionStatus.Completed, result.Status);
        Assert.All(result.Tests, test => Assert.Equal(TestStatus.Passed, test.Status));
    }

    [Fact]
    public async Task CSharp_runtime_error_reports_exception_and_line()
    {
        const string code = """
            public class Solution
            {
                public int[] TwoSum(int[] nums, int target)
                {
                    return new[] { nums[99] };
                }
            }
            """;

        var result = await runner.RunTestsAsync(Languages.CSharp, code, TwoSum, TwoSumTests);

        Assert.Equal(ExecutionStatus.Completed, result.Status);
        Assert.All(result.Tests, test =>
        {
            Assert.Equal(TestStatus.Error, test.Status);
            Assert.Contains("IndexOutOfRangeException", test.Error);
            Assert.Equal(5, test.ErrorLine);
        });
    }

    [Fact]
    public async Task JavaScript_runtime_error_reports_exception_and_line()
    {
        const string code = "function twoSum(nums, target) {\n  return nums.missing.value;\n}";

        var result = await runner.RunTestsAsync(Languages.JavaScript, code, TwoSum, TwoSumTests);

        Assert.All(result.Tests, test =>
        {
            Assert.Equal(TestStatus.Error, test.Status);
            Assert.Contains("TypeError", test.Error);
            Assert.Equal(2, test.ErrorLine);
        });
    }

    [Theory]
    [InlineData(Languages.JavaScript, "function twoSum(nums, target) {\n  return [0 1];\n}", 2)]
    [InlineData(Languages.TypeScript, "function twoSum(nums: number[], target: number): number[] {\n  let x: = 5;\n  return [];\n}", 2)]
    public async Task Script_languages_report_syntax_errors_with_line(string language, string code, int expectedLine)
    {
        var result = await runner.RunTestsAsync(language, code, TwoSum, TwoSumTests);

        Assert.Equal(ExecutionStatus.CompileError, result.Status);
        Assert.Equal(expectedLine, Assert.Single(result.Diagnostics).Line);
    }

    [Fact]
    public async Task CSharp_infinite_loop_times_out_and_blames_the_right_test()
    {
        const string code = "public class Solution { public int[] TwoSum(int[] nums, int target) { if (target == 6) while (true) { } return new[] { 0, 1 }; } }";

        var result = await runner.RunTestsAsync(Languages.CSharp, code, TwoSum, TwoSumTests);

        Assert.Equal(ExecutionStatus.Timeout, result.Status);
        Assert.Equal(TestStatus.Passed, result.Tests[0].Status);
        Assert.Equal(TestStatus.Timeout, result.Tests[1].Status);
    }

    [Fact]
    public async Task JavaScript_infinite_loop_times_out_only_the_offending_test()
    {
        const string code = "function twoSum(nums, target) { if (target === 9) while (true) {} return [1, 2]; }";

        var result = await runner.RunTestsAsync(Languages.JavaScript, code, TwoSum, TwoSumTests);

        Assert.Equal(TestStatus.Timeout, result.Tests[0].Status);
        Assert.Equal(TestStatus.Passed, result.Tests[1].Status);
    }

    [Fact]
    public async Task CSharp_stack_overflow_is_reported_without_hanging()
    {
        const string code = "public class Solution { int F(int x) => F(x + 1) + 1; public int[] TwoSum(int[] nums, int target) { F(0); return nums; } }";

        var result = await runner.RunTestsAsync(Languages.CSharp, code, TwoSum, TwoSumTests);

        Assert.NotEqual(ExecutionStatus.Completed, result.Status);
        Assert.NotEqual(TestStatus.Passed, result.Tests[0].Status);
    }

    [Fact]
    public async Task JavaScript_sandbox_does_not_expose_host_globals()
    {
        const string code = """
            function twoSum(nums, target) {
              let evalBlocked = false;
              try { eval('1 + 1'); } catch (e) { evalBlocked = true; }
              let functionBlocked = false;
              try { new Function('return 1')(); } catch (e) { functionBlocked = true; }
              const ok = typeof process === 'undefined' && typeof require === 'undefined'
                && typeof globalThis.fetch === 'undefined' && evalBlocked && functionBlocked;
              return ok ? (target === 9 ? [0, 1] : [1, 2]) : [];
            }
            """;

        var result = await runner.RunTestsAsync(Languages.JavaScript, code, TwoSum, TwoSumTests);

        Assert.All(result.Tests, test => Assert.Equal(TestStatus.Passed, test.Status));
    }

    // ------------------------------------------------------------ ListNode / TreeNode

    private static readonly ProblemSpec ReverseList = new()
    {
        Name = "reverseList",
        Params = [new ParamSpec("head", "ListNode")],
        Returns = "ListNode",
    };

    [Theory]
    [InlineData(Languages.CSharp, """
        public class Solution
        {
            public ListNode ReverseList(ListNode head)
            {
                ListNode previous = null;
                while (head != null) { var next = head.next; head.next = previous; previous = head; head = next; }
                return previous;
            }
        }
        """)]
    [InlineData(Languages.TypeScript, """
        function reverseList(head: ListNode | null): ListNode | null {
          let previous: ListNode | null = null;
          while (head !== null) { const next = head.next; head.next = previous; previous = head; head = next; }
          return previous;
        }
        """)]
    public async Task Linked_lists_are_converted_from_and_to_arrays(string language, string code)
    {
        var result = await runner.RunTestsAsync(language, code, ReverseList, ("[[1,2,3]]", "[3,2,1]"), ("[[]]", "[]"));

        Assert.All(result.Tests, test => Assert.Equal(TestStatus.Passed, test.Status));
    }

    private static readonly ProblemSpec InvertTree = new()
    {
        Name = "invertTree",
        Params = [new ParamSpec("root", "TreeNode")],
        Returns = "TreeNode",
    };

    [Theory]
    [InlineData(Languages.CSharp, """
        public class Solution
        {
            public TreeNode InvertTree(TreeNode root)
            {
                if (root == null) return null;
                (root.left, root.right) = (InvertTree(root.right), InvertTree(root.left));
                return root;
            }
        }
        """)]
    [InlineData(Languages.JavaScript, """
        function invertTree(root) {
          if (root === null) return null;
          [root.left, root.right] = [invertTree(root.right), invertTree(root.left)];
          return root;
        }
        """)]
    public async Task Trees_are_converted_from_and_to_level_order_arrays(string language, string code)
    {
        var result = await runner.RunTestsAsync(
            language, code, InvertTree,
            ("[[4,2,7,1,3,6,9]]", "[4,7,2,9,6,3,1]"),
            ("[[1,null,2]]", "[1,2]"),
            ("[[]]", "[]"));

        Assert.All(result.Tests, test => Assert.Equal(TestStatus.Passed, test.Status));
    }

    // ------------------------------------------------------------ sınıf problemleri

    private static readonly ProblemSpec MinStack = new()
    {
        Kind = ProblemKinds.Class,
        Name = "MinStack",
        Methods =
        [
            new MethodSpec("push", [new ParamSpec("value", "int")], "void"),
            new MethodSpec("pop", [], "void"),
            new MethodSpec("top", [], "int"),
            new MethodSpec("getMin", [], "int"),
        ],
    };

    [Theory]
    [InlineData(Languages.CSharp, """
        public class MinStack
        {
            private readonly Stack<(int Value, int Min)> _items = new();
            public MinStack() { }
            public void Push(int value) => _items.Push((value, _items.Count == 0 ? value : Math.Min(value, _items.Peek().Min)));
            public void Pop() => _items.Pop();
            public int Top() => _items.Peek().Value;
            public int GetMin() => _items.Peek().Min;
        }
        """)]
    [InlineData(Languages.TypeScript, """
        class MinStack {
          private items: [number, number][] = [];
          push(value: number): void {
            const min = this.items.length === 0 ? value : Math.min(value, this.items[this.items.length - 1][1]);
            this.items.push([value, min]);
          }
          pop(): void { this.items.pop(); }
          top(): number { return this.items[this.items.length - 1][0]; }
          getMin(): number { return this.items[this.items.length - 1][1]; }
        }
        """)]
    public async Task Class_problems_run_operation_sequences(string language, string code)
    {
        var result = await runner.RunClassTestsAsync(
            language, code, MinStack,
            ("""["MinStack","push","push","push","getMin","pop","top","getMin"]""", "[[],[-2],[0],[-3],[],[],[],[]]", "[null,null,null,null,-3,null,0,-2]"));

        Assert.Equal(ExecutionStatus.Completed, result.Status);
        Assert.Equal(TestStatus.Passed, Assert.Single(result.Tests).Status);
    }

    // ------------------------------------------------------------ script modu

    [Fact]
    public async Task CSharp_script_supports_top_level_statements_async_and_unicode()
    {
        const string code = """
            var numbers = new List<int> { 3, 1, 2 };
            numbers.Sort();
            Console.WriteLine(string.Join(", ", numbers) + " şçöğüı");
            await Task.Delay(10);
            Console.WriteLine("bitti");
            """;

        var result = await runner.RunScriptAsync(Languages.CSharp, code);

        Assert.Equal(ExecutionStatus.Completed, result.Status);
        Assert.Contains("1, 2, 3 şçöğüı", result.Stdout);
        Assert.Contains("bitti", result.Stdout);
    }

    [Fact]
    public async Task TypeScript_script_supports_enums_parameter_properties_timers_and_await()
    {
        const string code = """
            enum Color { Red, Green }
            class Point { constructor(public x: number, private y: number) {} sum(): number { return this.x + this.y; } }
            console.log('renk', Color.Green, new Point(2, 3).sum(), 'şçöğüı');
            setTimeout(() => console.log('zamanlayıcı'), 20);
            await Promise.resolve();
            console.log('son');
            """;

        var result = await runner.RunScriptAsync(Languages.TypeScript, code);

        Assert.Equal(ExecutionStatus.Completed, result.Status);
        Assert.Equal("renk 1 5 şçöğüı\nson\nzamanlayıcı\n", result.Stdout);
    }

    [Fact]
    public async Task JavaScript_script_reports_uncaught_error_with_line()
    {
        var result = await runner.RunScriptAsync(Languages.JavaScript, "console.log('a');\nnull.x;");

        Assert.Equal(ExecutionStatus.RuntimeError, result.Status);
        Assert.Contains("a", result.Stdout);
        Assert.Contains("satır 2", result.Stderr);
    }

    [Theory]
    [InlineData(Languages.JavaScript, "console.log('başla'); while (true) {}")]
    [InlineData(Languages.CSharp, "Console.WriteLine(\"başla\"); while (true) { }")]
    public async Task Script_infinite_loop_times_out(string language, string code)
    {
        var result = await runner.RunScriptAsync(language, code);

        Assert.Equal(ExecutionStatus.Timeout, result.Status);
        Assert.Contains("başla", result.Stdout);
    }

    [Fact]
    public async Task Invalid_requests_are_rejected()
    {
        await Assert.ThrowsAsync<Zirve.Runner.Execution.InvalidExecutionRequestException>(
            () => runner.RunScriptAsync("python", "print(1)"));
    }
}
