import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { Logo } from '@/components/Layout';
import { Button, Card, ErrorNotice, Field, PageLoading } from '@/components/ui';
import { defineMessages, useMessages } from '@/i18n/messages';
import { ApiError } from '@/lib/api';
import { useLogin, useRegister, useUser } from '@/lib/queries';

const messages = defineMessages({
  tr: {
    registerPageTitle: 'Kayıt ol — Zirve',
    loginPageTitle: 'Giriş yap — Zirve',
    registerHeading: 'Hesap oluşturun',
    loginHeading: 'Tekrar hoş geldiniz',
    registerIntro: 'İlerlemenizi kaydedin, kod çalıştırın ve testlerde kendinizi sınayın.',
    loginIntro: 'Kaldığınız yerden devam etmek için giriş yapın.',
    displayName: 'Görünen ad',
    email: 'E-posta',
    password: 'Parola',
    passwordHint: 'En az 8 karakter. Uzun bir parola cümlesi, karmaşık kısa bir paroladan daha güvenlidir.',
    rememberMe: 'Bu cihazda oturumumu açık tut',
    registerSubmit: 'Kayıt ol',
    loginSubmit: 'Giriş yap',
    haveAccount: 'Zaten hesabınız var mı?',
    noAccount: 'Hesabınız yok mu?',
    loginLink: 'Giriş yapın',
    registerLink: 'Kayıt olun',
  },
  en: {
    registerPageTitle: 'Sign up — Zirve',
    loginPageTitle: 'Sign in — Zirve',
    registerHeading: 'Create your account',
    loginHeading: 'Welcome back',
    registerIntro: 'Save your progress, run code and test yourself with quizzes.',
    loginIntro: 'Sign in to pick up where you left off.',
    displayName: 'Display name',
    email: 'Email',
    password: 'Password',
    passwordHint: 'At least 8 characters. A long passphrase is more secure than a short, complex password.',
    rememberMe: 'Keep me signed in on this device',
    registerSubmit: 'Sign up',
    loginSubmit: 'Sign in',
    haveAccount: 'Already have an account?',
    noAccount: "Don't have an account?",
    loginLink: 'Sign in',
    registerLink: 'Sign up',
  },
});

/** Yalnızca site içi yollara yönlendir: açık yönlendirme (open redirect) açığını önler. */
function safeRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const t = useMessages(messages);
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useUser();
  const login = useLogin();
  const register = useRegister();
  const mutation = isRegister ? register : login;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const from = safeRedirect((location.state as { from?: unknown } | null)?.from);

  if (isLoading) return <PageLoading />;
  if (user && !mutation.isSuccess) return <Navigate to={from} replace />;

  const fieldErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {};
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const onSuccess = () => navigate(from, { replace: true });

    if (isRegister) register.mutate({ email, password, displayName }, { onSuccess });
    else login.mutate({ email, password, rememberMe }, { onSuccess });
  };

  return (
    <div className="container-page flex min-h-[calc(100dvh-4rem)] items-center justify-center py-12">
      <title>{isRegister ? t.registerPageTitle : t.loginPageTitle}</title>

      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <Card className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight">{isRegister ? t.registerHeading : t.loginHeading}</h1>
          <p className="mt-1 text-sm text-muted">
            {isRegister ? t.registerIntro : t.loginIntro}
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            {isRegister && (
              <Field
                id="displayName"
                label={t.displayName}
                autoComplete="name"
                required
                minLength={2}
                maxLength={40}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                errors={fieldErrors.displayname}
              />
            )}

            <Field
              id="email"
              label={t.email}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              errors={fieldErrors.email}
            />

            <Field
              id="password"
              label={t.password}
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              errors={fieldErrors.password}
              hint={isRegister ? t.passwordHint : undefined}
            />

            {!isRegister && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="size-4 accent-(--primary)"
                />
                {t.rememberMe}
              </label>
            )}

            {mutation.isError && !hasFieldErrors && <ErrorNotice error={mutation.error} />}
            {mutation.isError && fieldErrors.general && <ErrorNotice error={new Error(fieldErrors.general.join(' '))} />}

            <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>
              {isRegister ? t.registerSubmit : t.loginSubmit}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-sm text-muted">
          {isRegister ? t.haveAccount : t.noAccount}{' '}
          <Link to={isRegister ? '/login' : '/register'} state={location.state} className="font-medium text-primary-text hover:underline">
            {isRegister ? t.loginLink : t.registerLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
