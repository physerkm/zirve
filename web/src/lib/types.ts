// API sözleşmesi. Sunucu null değerleri yanıta yazmaz; bu yüzden isteğe bağlı alanlar `?` ile işaretlidir.

export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type Language = 'csharp' | 'javascript' | 'typescript';
export type ProblemStatus = 'solved' | 'attempted';

export type Verdict =
  | 'accepted'
  | 'wrongAnswer'
  | 'runtimeError'
  | 'timeLimitExceeded'
  | 'outputLimitExceeded'
  | 'compileError'
  | 'internalError';

export type TestStatus = 'passed' | 'failed' | 'error' | 'timeout' | 'skipped';

export type ExecutionStatus = 'completed' | 'compileError' | 'runtimeError' | 'timeout' | 'outputLimit' | 'internalError';

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

// ------------------------------------------------------------------ kimlik

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Session {
  user?: User;
  csrfToken: string;
}

// ------------------------------------------------------------------ katalog

export interface Link {
  slug: string;
  title: string;
}

export interface TrackSummary {
  slug: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  lessonCount: number;
  totalMinutes: number;
  quizCount: number;
  completedLessons: number;
}

export interface LessonSummary {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  level: Level;
  completed: boolean;
}

export interface ModuleDetail {
  slug: string;
  title: string;
  description: string;
  lessons: LessonSummary[];
}

export interface TrackQuiz {
  slug: string;
  title: string;
  description: string;
  level: Level;
  questionCount: number;
  timeLimitMinutes?: number;
  bestScore?: number;
}

export interface TrackDetail {
  slug: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  modules: ModuleDetail[];
  quizzes: TrackQuiz[];
}

export interface LessonDetail {
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  level: Level;
  content: string;
  track: Link;
  module: Link;
  previous?: Link;
  next?: Link;
  position: number;
  total: number;
  completed: boolean;
}

// ------------------------------------------------------------------ testler (quiz)

export interface QuizSummary {
  slug: string;
  title: string;
  description: string;
  level: Level;
  questionCount: number;
  timeLimitMinutes?: number;
  track: Link;
  bestScore?: number;
  attempts: number;
}

export interface QuizOption {
  id: number;
  text: string;
}

export interface QuizQuestion {
  id: number;
  text: string;
  isMultiple: boolean;
  difficulty: Difficulty;
  options: QuizOption[];
}

export interface QuizDetail {
  slug: string;
  title: string;
  description: string;
  level: Level;
  timeLimitMinutes?: number;
  track: Link;
  questions: QuizQuestion[];
}

export interface QuestionResult {
  id: number;
  correct: boolean;
  correctOptionIds: number[];
  selectedOptionIds: number[];
  explanation: string;
}

export interface QuizAttemptResult {
  correctCount: number;
  totalCount: number;
  scorePercent: number;
  saved: boolean;
  questions: QuestionResult[];
}

// ------------------------------------------------------------------ problemler

export interface ParamSpec {
  name: string;
  type: string;
}

export interface MethodSpec {
  name: string;
  params: ParamSpec[];
  returns: string;
}

export interface ProblemSpec {
  kind: 'function' | 'class';
  name: string;
  params: ParamSpec[];
  returns: string;
  methods: MethodSpec[];
  compare: string;
}

export interface ProblemListItem {
  slug: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  languages: Language[];
  status?: ProblemStatus;
}

export interface SampleTest {
  id: number;
  args: Json[];
  ops?: string[];
  expected: Json;
}

export interface ProblemDetail {
  slug: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  tags: string[];
  statement: string;
  hints: string[];
  languages: Language[];
  spec: ProblemSpec;
  starterCode: Partial<Record<Language, string>>;
  sampleTests: SampleTest[];
  testCount: number;
  hasEditorial: boolean;
  status?: ProblemStatus;
  previous?: Link;
  next?: Link;
}

export interface Editorial {
  editorial: string;
  solutions: Partial<Record<Language, string>>;
}

export interface CompileDiagnostic {
  line: number;
  column: number;
  message: string;
}

export interface JudgedTest {
  id: number;
  status: TestStatus;
  sample: boolean;
  args: Json[];
  ops?: string[];
  expected: Json;
  actual?: Json;
  stdout?: string;
  error?: string;
  errorLine?: number;
  durationMs: number;
}

export interface JudgeResponse {
  verdict: Verdict;
  message?: string;
  diagnostics: CompileDiagnostic[];
  tests: JudgedTest[];
  passedCount: number;
  totalCount: number;
  durationMs: number;
  submissionId?: string;
}

export interface SubmissionSummary {
  id: string;
  language: Language;
  verdict: Verdict;
  passedCount: number;
  totalCount: number;
  durationMs: number;
  createdAt: string;
}

export interface SubmissionDetail extends SubmissionSummary {
  problemSlug: string;
  problemTitle: string;
  code: string;
}

export interface ExecutionResult {
  status: ExecutionStatus;
  message?: string;
  diagnostics: CompileDiagnostic[];
  stdout?: string;
  stderr?: string;
  durationMs: number;
}

// ------------------------------------------------------------------ panel ve arama

export interface ProgressCount {
  completed: number;
  total: number;
}

export interface Dashboard {
  lessons: ProgressCount;
  problems: { solved: number; total: number; easy: ProgressCount; medium: ProgressCount; hard: ProgressCount };
  quizzes: { attempts: number; averageScore?: number; distinctQuizzes: number; totalQuizzes: number };
  streakDays: number;
  tracks: { slug: string; title: string; icon: string; accent: string; completed: number; total: number }[];
  recentSubmissions: {
    id: string;
    problemSlug: string;
    problemTitle: string;
    language: Language;
    verdict: Verdict;
    createdAt: string;
  }[];
  continue?: { trackSlug: string; trackTitle: string; lessonSlug: string; lessonTitle: string };
  activity: { date: string; count: number }[];
}

export interface SearchResults {
  lessons: { trackSlug: string; trackTitle: string; slug: string; title: string; summary: string }[];
  problems: { slug: string; number: number; title: string; difficulty: Difficulty }[];
  quizzes: { slug: string; title: string; trackTitle: string }[];
}
