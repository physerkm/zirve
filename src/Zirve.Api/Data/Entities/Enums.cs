namespace Zirve.Api.Data.Entities;

public enum ContentLevel
{
    Beginner,
    Intermediate,
    Advanced,
}

public enum Difficulty
{
    Easy,
    Medium,
    Hard,
}

public enum Verdict
{
    Accepted,
    WrongAnswer,
    RuntimeError,
    TimeLimitExceeded,
    OutputLimitExceeded,
    CompileError,
    InternalError,
}
