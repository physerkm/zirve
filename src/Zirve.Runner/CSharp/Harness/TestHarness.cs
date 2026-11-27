// Bu dosya Zirve.Runner'a kaynak olarak gömülür ve her çalıştırmada kullanıcı koduyla BİRLİKTE derlenir.
// Runner projesinin kendisine derlenmez (csproj: Compile Remove).
//
// Protokol: stdin'den JSON yük okunur; her test için stdout'a "<nonce>{json}" satırı yazılır.
// Kullanıcının Console çıktısı test başına yakalanır ve sonuç satırının içinde taşınır.
using System.Collections;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

public class ListNode
{
    public int val;
    public ListNode next;

    public ListNode(int val = 0, ListNode next = null)
    {
        this.val = val;
        this.next = next;
    }
}

public class TreeNode
{
    public int val;
    public TreeNode left;
    public TreeNode right;

    public TreeNode(int val = 0, TreeNode left = null, TreeNode right = null)
    {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

namespace ZirveHarness
{
    /// <summary>İletilerin dili; Runner ZIRVE_LOCALE ortam değişkeniyle bildirir.</summary>
    internal static class Text
    {
        private static readonly bool English = System.Environment.GetEnvironmentVariable("ZIRVE_LOCALE") == "en";

        public static string T(string turkish, string english) => English ? english : turkish;
    }

    internal sealed class HarnessException : Exception
    {
        public HarnessException(string message) : base(message)
        {
        }
    }

    internal sealed class BoundedWriter : TextWriter
    {
        private readonly StringBuilder _buffer = new StringBuilder();
        private readonly int _limit;
        private bool _truncated;

        public BoundedWriter(int limit)
        {
            _limit = limit;
        }

        public override Encoding Encoding => Encoding.UTF8;

        public override void Write(char value)
        {
            if (_buffer.Length < _limit)
            {
                _buffer.Append(value);
            }
            else
            {
                _truncated = true;
            }
        }

        public override void Write(string value)
        {
            if (string.IsNullOrEmpty(value))
            {
                return;
            }

            var room = _limit - _buffer.Length;
            if (value.Length <= room)
            {
                _buffer.Append(value);
                return;
            }

            if (room > 0)
            {
                _buffer.Append(value, 0, room);
            }

            _truncated = true;
        }

        public override void Write(char[] buffer, int index, int count)
        {
            Write(new string(buffer, index, count));
        }

        public string Drain()
        {
            var text = _buffer.ToString();
            _buffer.Clear();

            if (_truncated)
            {
                text += Text.T("\n… (çıktı kesildi)", "\n… (output truncated)");
                _truncated = false;
            }

            return text;
        }
    }

    internal static class Program
    {
        private const int MaxNodes = 200000;

        private static readonly JsonSerializerOptions Json = new JsonSerializerOptions
        {
            NumberHandling = JsonNumberHandling.AllowNamedFloatingPointLiterals,
            IncludeFields = true,
        };

        private static int Main(string[] args)
        {
            var nonce = args.Length > 0 ? args[0] : string.Empty;
            var utf8 = new UTF8Encoding(false);
            var output = new StreamWriter(Console.OpenStandardOutput(), utf8) { AutoFlush = true, NewLine = "\n" };

            string payloadText;
            using (var reader = new StreamReader(Console.OpenStandardInput(), utf8))
            {
                payloadText = reader.ReadToEnd();
            }

            using var payload = JsonDocument.Parse(payloadText);
            var root = payload.RootElement;
            var kind = root.GetProperty("kind").GetString();
            var name = root.GetProperty("name").GetString();

            var capture = new BoundedWriter(64 * 1024);
            Console.SetOut(capture);
            Console.SetError(capture);
            Console.SetIn(new StringReader(string.Empty));

            foreach (var test in root.GetProperty("tests").EnumerateArray())
            {
                var id = test.GetProperty("id").GetInt32();
                string actual = null;
                string error = null;
                var line = 0;
                var watch = Stopwatch.StartNew();

                try
                {
                    actual = kind == "class" ? RunClassTest(name, test) : RunFunctionTest(name, test);
                }
                catch (TargetInvocationException ex) when (ex.InnerException != null)
                {
                    error = Describe(ex.InnerException, out line);
                }
                catch (Exception ex)
                {
                    error = Describe(ex, out line);
                }

                watch.Stop();
                WriteResult(output, nonce, id, actual, error, line, capture.Drain(), watch.Elapsed.TotalMilliseconds);
            }

            output.WriteLine(nonce + "{\"done\":true}");
            output.Flush();
            return 0;
        }

        // ------------------------------------------------------------ test türleri

        private static string RunFunctionTest(string name, JsonElement test)
        {
            var type = FindType("Solution");
            var arguments = test.GetProperty("args");
            var method = FindMethod(type, name, arguments.GetArrayLength());
            object instance = null;

            if (!method.IsStatic)
            {
                var constructor = type.GetConstructor(Type.EmptyTypes);
                if (constructor == null)
                {
                    throw new HarnessException(Text.T(
                        "Solution sınıfının parametresiz bir kurucusu olmalı.", "The Solution class must have a parameterless constructor."));
                }

                instance = constructor.Invoke(null);
            }

            var result = method.Invoke(instance, ConvertArguments(arguments, method.GetParameters()));
            return ToJson(result, method.ReturnType);
        }

        private static string RunClassTest(string name, JsonElement test)
        {
            var type = FindType(name);
            var operations = test.GetProperty("ops").EnumerateArray().Select(o => o.GetString()).ToArray();
            var arguments = test.GetProperty("args").EnumerateArray().ToArray();

            var constructorArguments = arguments[0];
            var constructor = type.GetConstructors().FirstOrDefault(c => c.GetParameters().Length == constructorArguments.GetArrayLength());
            if (constructor == null)
            {
                throw new HarnessException(Text.T(
                    "'" + name + "' sınıfında " + constructorArguments.GetArrayLength() + " parametreli bir kurucu bulunamadı.",
                    "No constructor with " + constructorArguments.GetArrayLength() + " parameter(s) was found in class '" + name + "'."));
            }

            var instance = constructor.Invoke(ConvertArguments(constructorArguments, constructor.GetParameters()));
            var results = new List<string> { "null" };

            for (var i = 1; i < operations.Length; i++)
            {
                var method = FindMethod(type, operations[i], arguments[i].GetArrayLength());
                var value = method.Invoke(instance, ConvertArguments(arguments[i], method.GetParameters()));
                results.Add(ToJson(value, method.ReturnType));
            }

            return "[" + string.Join(",", results) + "]";
        }

        // ------------------------------------------------------------ yansıma yardımcıları

        private static Type FindType(string name)
        {
            var types = typeof(Program).Assembly.GetTypes().Where(t => !t.IsNested && t.Namespace != "ZirveHarness").ToArray();
            var type = types.FirstOrDefault(t => t.Name == name)
                       ?? types.FirstOrDefault(t => string.Equals(t.Name, name, StringComparison.OrdinalIgnoreCase));

            if (type == null)
            {
                throw new HarnessException(Text.T(
                    "'" + name + "' adında bir sınıf bulunamadı. Sınıf adını değiştirmeyin.",
                    "No class named '" + name + "' was found. Don't rename the class."));
            }

            return type;
        }

        private static MethodInfo FindMethod(Type type, string name, int argumentCount)
        {
            const BindingFlags Flags = BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance | BindingFlags.Static;

            var method = type.GetMethods(Flags)
                .Where(m => string.Equals(m.Name, name, StringComparison.OrdinalIgnoreCase) && m.GetParameters().Length == argumentCount)
                .OrderByDescending(m => m.IsPublic)
                .FirstOrDefault();

            if (method == null)
            {
                throw new HarnessException(Text.T(
                    "'" + type.Name + "' sınıfında " + argumentCount + " parametreli '" + name + "' metodu bulunamadı. Metot imzasını değiştirmeyin.",
                    "No method '" + name + "' with " + argumentCount + " parameter(s) was found in class '" + type.Name + "'. Don't change the method signature."));
            }

            return method;
        }

        private static object[] ConvertArguments(JsonElement arguments, ParameterInfo[] parameters)
        {
            var values = new object[parameters.Length];
            var index = 0;

            foreach (var argument in arguments.EnumerateArray())
            {
                values[index] = FromJson(argument, parameters[index].ParameterType);
                index++;
            }

            return values;
        }

        // ------------------------------------------------------------ JSON <-> değer

        private static bool IsNodeType(Type type)
        {
            if (type == typeof(ListNode) || type == typeof(TreeNode))
            {
                return true;
            }

            if (type.IsArray)
            {
                return IsNodeType(type.GetElementType());
            }

            return type.IsGenericType && type.GetGenericArguments().Length == 1 && IsNodeType(type.GetGenericArguments()[0]);
        }

        private static object FromJson(JsonElement element, Type target)
        {
            if (target == typeof(ListNode))
            {
                return BuildList(element);
            }

            if (target == typeof(TreeNode))
            {
                return BuildTree(element);
            }

            if (IsNodeType(target))
            {
                var elementType = target.IsArray ? target.GetElementType() : target.GetGenericArguments()[0];
                var items = element.EnumerateArray().Select(item => FromJson(item, elementType)).ToArray();

                if (target.IsArray)
                {
                    var array = Array.CreateInstance(elementType, items.Length);
                    for (var i = 0; i < items.Length; i++)
                    {
                        array.SetValue(items[i], i);
                    }

                    return array;
                }

                var list = (IList)Activator.CreateInstance(typeof(List<>).MakeGenericType(elementType));
                foreach (var item in items)
                {
                    list.Add(item);
                }

                return list;
            }

            return element.Deserialize(target, Json);
        }

        private static string ToJson(object value, Type declared)
        {
            if (declared == typeof(void))
            {
                return "null";
            }

            if (value == null)
            {
                return declared == typeof(ListNode) || declared == typeof(TreeNode) ? "[]" : "null";
            }

            if (value is ListNode list)
            {
                return JsonSerializer.Serialize(ListToArray(list), Json);
            }

            if (value is TreeNode tree)
            {
                return JsonSerializer.Serialize(TreeToArray(tree), Json);
            }

            if (value is IEnumerable sequence && !(value is string) && IsNodeType(value.GetType()))
            {
                var elementType = value.GetType().IsArray ? value.GetType().GetElementType() : value.GetType().GetGenericArguments()[0];
                var parts = new List<string>();
                foreach (var item in sequence)
                {
                    parts.Add(ToJson(item, elementType));
                }

                return "[" + string.Join(",", parts) + "]";
            }

            return JsonSerializer.Serialize(value, value.GetType(), Json);
        }

        private static ListNode BuildList(JsonElement element)
        {
            var pos = -1;
            if (element.ValueKind == JsonValueKind.Object)
            {
                if (element.TryGetProperty("pos", out var posElement) && posElement.ValueKind == JsonValueKind.Number)
                {
                    pos = posElement.GetInt32();
                }

                if (!element.TryGetProperty("values", out element))
                {
                    return null;
                }
            }

            if (element.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            ListNode head = null;
            ListNode tail = null;
            ListNode cycleTarget = null;
            var index = 0;

            foreach (var item in element.EnumerateArray())
            {
                var node = new ListNode(item.GetInt32());
                if (head == null)
                {
                    head = node;
                }
                else
                {
                    tail.next = node;
                }

                if (index == pos)
                {
                    cycleTarget = node;
                }

                tail = node;
                index++;
            }

            if (tail != null && cycleTarget != null)
            {
                tail.next = cycleTarget;
            }

            return head;
        }

        private static List<int> ListToArray(ListNode head)
        {
            var values = new List<int>();

            for (var node = head; node != null; node = node.next)
            {
                values.Add(node.val);
                if (values.Count > MaxNodes)
                {
                    throw new HarnessException(Text.T(
                        "Döndürülen bağlı listede döngü var ya da liste çok uzun.", "The returned linked list has a cycle or is too long."));
                }
            }

            return values;
        }

        private static TreeNode BuildTree(JsonElement element)
        {
            if (element.ValueKind != JsonValueKind.Array)
            {
                return null;
            }

            var items = element.EnumerateArray().ToArray();
            if (items.Length == 0 || items[0].ValueKind == JsonValueKind.Null)
            {
                return null;
            }

            var root = new TreeNode(items[0].GetInt32());
            var queue = new Queue<TreeNode>();
            queue.Enqueue(root);
            var index = 1;

            while (queue.Count > 0 && index < items.Length)
            {
                var node = queue.Dequeue();

                if (index < items.Length && items[index].ValueKind != JsonValueKind.Null)
                {
                    node.left = new TreeNode(items[index].GetInt32());
                    queue.Enqueue(node.left);
                }

                index++;

                if (index < items.Length && items[index].ValueKind != JsonValueKind.Null)
                {
                    node.right = new TreeNode(items[index].GetInt32());
                    queue.Enqueue(node.right);
                }

                index++;
            }

            return root;
        }

        private static List<int?> TreeToArray(TreeNode root)
        {
            var values = new List<int?>();
            var queue = new Queue<TreeNode>();
            queue.Enqueue(root);
            var visited = 0;

            while (queue.Count > 0)
            {
                var node = queue.Dequeue();
                if (node == null)
                {
                    values.Add(null);
                    continue;
                }

                if (++visited > MaxNodes)
                {
                    throw new HarnessException(Text.T(
                        "Döndürülen ağaçta döngü var ya da ağaç çok büyük.", "The returned tree has a cycle or is too large."));
                }

                values.Add(node.val);
                queue.Enqueue(node.left);
                queue.Enqueue(node.right);
            }

            while (values.Count > 0 && values[values.Count - 1] == null)
            {
                values.RemoveAt(values.Count - 1);
            }

            return values;
        }

        // ------------------------------------------------------------ çıktı

        private static string Describe(Exception exception, out int line)
        {
            line = 0;

            if (exception is HarnessException)
            {
                return exception.Message;
            }

            try
            {
                var trace = new StackTrace(exception, true);
                foreach (var frame in trace.GetFrames())
                {
                    var file = frame.GetFileName();
                    if (file != null && file.EndsWith("Solution.cs", StringComparison.Ordinal) && frame.GetFileLineNumber() > 0)
                    {
                        line = frame.GetFileLineNumber();
                        break;
                    }
                }
            }
            catch (Exception)
            {
                // Satır bilgisi alınamadıysa yalnızca mesajı gösteririz.
            }

            return exception.GetType().Name + ": " + exception.Message;
        }

        private static void WriteResult(TextWriter output, string nonce, int id, string actual, string error, int line, string stdout, double milliseconds)
        {
            using var stream = new MemoryStream();
            using (var writer = new Utf8JsonWriter(stream))
            {
                writer.WriteStartObject();
                writer.WriteNumber("id", id);

                if (actual != null)
                {
                    writer.WritePropertyName("actual");
                    writer.WriteRawValue(actual);
                }

                if (error != null)
                {
                    writer.WriteString("error", error);
                }

                if (line > 0)
                {
                    writer.WriteNumber("line", line);
                }

                if (stdout.Length > 0)
                {
                    writer.WriteString("stdout", stdout);
                }

                writer.WriteNumber("ms", Math.Round(milliseconds, 3));
                writer.WriteEndObject();
            }

            output.WriteLine(nonce + Encoding.UTF8.GetString(stream.ToArray()));
        }
    }
}
