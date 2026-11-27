import { getLocale } from '@/i18n/locale';
import { currentMessages, defineMessages } from '@/i18n/messages';
import type { Session } from './types';

/** Sunucunun RFC 9457 problem yanıtlarından üretilen hata. */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  /** Alan adı (küçük harfe çevrilmiş) -> doğrulama iletileri. */
  readonly fieldErrors: Record<string, string[]>;

  constructor(status: number, message: string, code?: string, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

interface ProblemBody {
  title?: string;
  detail?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

const messages = defineMessages({
  tr: {
    status: {
      401: 'Bu işlem için giriş yapmalısınız.',
      403: 'Bu işlem için yetkiniz yok.',
      404: 'Aradığınız içerik bulunamadı.',
      429: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.',
      503: 'Servis şu anda kullanılamıyor. Lütfen birkaç saniye sonra tekrar deneyin.',
    } as Record<number, string>,
    fieldErrors: 'Lütfen işaretli alanları düzeltin.',
    unexpected: 'Beklenmeyen bir hata oluştu.',
    offline: 'Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edin.',
  },
  en: {
    status: {
      401: 'You need to sign in to do this.',
      403: "You don't have permission to do this.",
      404: "The content you're looking for wasn't found.",
      429: "You've sent too many requests. Please wait a moment.",
      503: 'The service is unavailable right now. Please try again in a few seconds.',
    },
    fieldErrors: 'Please fix the highlighted fields.',
    unexpected: 'An unexpected error occurred.',
    offline: "Couldn't reach the server. Check your internet connection.",
  },
});

// CSRF belirteci yalnızca bellekte tutulur: sayfadaki betikler dışında hiçbir yerden okunamaz.
// Oturum çerezi HttpOnly + SameSite=Strict'tir; belirteç ikinci savunma katmanıdır.
let csrfToken: string | null = null;
let sessionRequest: Promise<Session> | null = null;

function rememberCsrfToken(data: unknown): void {
  if (typeof data === 'object' && data !== null && 'csrfToken' in data && typeof data.csrfToken === 'string') {
    csrfToken = data.csrfToken;
  }
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const problem = (typeof body === 'object' && body !== null ? body : {}) as ProblemBody;
  const fieldErrors: Record<string, string[]> = {};

  for (const [field, messages] of Object.entries(problem.errors ?? {})) {
    fieldErrors[field.toLowerCase()] = messages;
  }

  const t = currentMessages(messages);
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;
  const message = hasFieldErrors ? t.fieldErrors : (problem.title ?? problem.detail ?? t.status[status] ?? t.unexpected);

  return new ApiError(status, message, problem.code, fieldErrors);
}

async function request<T>(method: string, path: string, body?: unknown, isRetry = false): Promise<T> {
  const isUnsafe = method !== 'GET';

  if (isUnsafe && csrfToken === null) {
    await loadSession();
  }

  // Sunucu içeriği ve iletileri bu dilde döndürür; tarayıcının kendi Accept-Language değeri geçersiz kılınır.
  const headers: Record<string, string> = { Accept: 'application/json', 'Accept-Language': getLocale() };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (isUnsafe && csrfToken !== null) headers['X-CSRF-TOKEN'] = csrfToken;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, currentMessages(messages).offline);
  }

  const text = await response.text();
  const data = text ? parseJson(text) : undefined;

  if (response.ok) {
    rememberCsrfToken(data);
    return data as T;
  }

  const error = toApiError(response.status, data);

  // Belirteç eskimiş olabilir (ör. başka sekmede giriş/çıkış yapıldı): yenileyip bir kez daha dene.
  if (error.code === 'csrf_invalid' && !isRetry) {
    await loadSession();
    return request<T>(method, path, body, true);
  }

  throw error;
}

/** Oturumu (ve onunla birlikte CSRF belirtecini) yükler. Eşzamanlı çağrılar tek isteği paylaşır. */
export function loadSession(): Promise<Session> {
  sessionRequest ??= request<Session>('GET', '/auth/session').finally(() => {
    sessionRequest = null;
  });

  return sessionRequest;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
};

/** Yalnızca testler için: modül durumunu sıfırlar. */
export function resetApiStateForTests(): void {
  csrfToken = null;
  sessionRequest = null;
}
