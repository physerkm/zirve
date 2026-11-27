---
title: Encode and Decode Strings
---
Design an algorithm that encodes a list of strings (`strs`) into a single string (`encode`) and decodes that single string back into the original list of strings (`decode`).

Implement the `StringCodec` class using **length-prefixed framing**:

- `StringCodec()` initializes the object.
- `string encode(string[] strs)` writes each string in the list as `<length>#<string>`, concatenates them all in order, and returns the result (for example, the list `["neet", "code"]` is encoded as `"4#neet4#code"`).
- `List<string> decode(string s)` decodes a single string encoded as `<length>#<string>` and returns the original list of strings.

The strings may contain any ASCII character, including `#`, digits, or the empty string (`""`).

### Example 1

```text
Input:
["StringCodec", "encode", "decode"]
[[], [["zirve", "mulakat", "hazirlik"]], ["5#zirve7#mulakat8#hazirlik"]]
Output:
[null, "5#zirve7#mulakat8#hazirlik", ["zirve", "mulakat", "hazirlik"]]
Explanation:
StringCodec codec = new StringCodec();
codec.encode(["zirve", "mulakat", "hazirlik"]); // returns "5#zirve7#mulakat8#hazirlik"
codec.decode("5#zirve7#mulakat8#hazirlik");    // returns ["zirve", "mulakat", "hazirlik"]
```

### Example 2

```text
Input:
["StringCodec", "encode", "decode"]
[[], [["a#b", "12#3", ""]], ["3#a#b4#12#30#"]]
Output:
[null, "3#a#b4#12#30#", ["a#b", "12#3", ""]]
Explanation: A '#' or a number inside the strings doesn't break decoding, because the length is read first and then exactly that many characters are taken.
```

### Constraints

- `0 <= strs.length < 100`
- `0 <= strs[i].length < 200`
- `strs[i]` may contain any possible character.

## Hints

- If you simply join the strings with a delimiter such as `,` or `#`, you can't tell where to stop reading when the delimiter also appears inside a string.
- As with the HTTP/1.1 `Content-Length` header, consider writing **how many characters long** each piece is at its start.
- Writing only the length isn't enough (is `"12"` a length of 1 or 12?); put a `#` right after the length to mark where the length number ends: `<length>#<string>`.
- When decoding, read the number from the current position up to the first `#` as `length`, then cut exactly `length` characters after the `#` and add them to the list.

## Solution

Using only a special delimiter character isn't safe, because that character can also appear inside the input strings. Instead, use **length-prefixed framing**, a technique common in network protocols.

**Encoding (`Encode`):**
For each `str` in the list, append `str.Length`, then the `#` delimiter, and finally `str` itself to a `StringBuilder`. For example, the string `"a#b"` becomes `"3#a#b"`.

**Decoding (`Decode`):**
Move through the string with a pointer `i = 0`:
1. Starting at position `i`, find the index `j` of the first `#` character.
2. Convert the substring `s[i..j]` to an integer to get the string's length (`length`).
3. Add the piece `s.Substring(j + 1, length)`, which starts right after the `#` and is `length` characters long, to the result list (a `#` or digits inside this piece no longer cause any problem).
4. Move the pointer to the start of the next frame (`i = j + 1 + length`).

```csharp solution
public class StringCodec
{
    public StringCodec()
    {
    }

    public string Encode(string[] strs)
    {
        StringBuilder sb = new StringBuilder();
        foreach (string str in strs)
        {
            sb.Append(str.Length).Append('#').Append(str);
        }
        return sb.ToString();
    }

    public IList<string> Decode(string s)
    {
        List<string> result = new List<string>();
        int i = 0;

        while (i < s.Length)
        {
            int j = i;
            while (s[j] != '#')
                j++;

            int length = int.Parse(s.Substring(i, j - i));
            int start = j + 1;
            result.Add(s.Substring(start, length));
            i = start + length;
        }

        return result;
    }
}
```

```typescript solution
class StringCodec {
  constructor() {}

  encode(strs: string[]): string {
    let encoded = "";
    for (const str of strs) {
      encoded += `${str.length}#${str}`;
    }
    return encoded;
  }

  decode(s: string): string[] {
    const result: string[] = [];
    let i = 0;

    while (i < s.length) {
      let j = i;
      while (s[j] !== "#") {
        j++;
      }

      const length = parseInt(s.slice(i, j), 10);
      const start = j + 1;
      result.push(s.slice(start, start + length));
      i = start + length;
    }

    return result;
  }
}
```

### Complexity

- **Time:** **O(N)** for both `encode` and `decode` (`N` is the total number of characters across all strings). Each character is processed a constant number of times.
- **Space:** **O(1)** extra memory besides the output string and list (**O(N)** including the outputs).
