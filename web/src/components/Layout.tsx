import { Languages, LayoutDashboard, LogOut, Menu, Moon, Sun, X } from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router';
import { type Locale, setLocale, useLocale } from '@/i18n/locale';
import { defineMessages, useMessages } from '@/i18n/messages';
import { cn } from '@/lib/format';
import { useLogout, useUser } from '@/lib/queries';
import { useTheme } from '@/lib/theme';
import { SearchBox } from './SearchBox';
import { ButtonLink, PageLoading } from './ui';

const messages = defineMessages({
  tr: {
    navigation: { tracks: 'Öğrenme Yolları', problems: 'Problemler', quizzes: 'Testler', playground: 'Deneme Alanı' },
    homeLabel: 'Zirve ana sayfa',
    lightTheme: 'Açık temaya geç',
    darkTheme: 'Koyu temaya geç',
    language: 'Dil',
    switchLanguage: 'Switch to English',
    signIn: 'Giriş yap',
    register: 'Kayıt ol',
    accountMenu: (name: string) => `Hesap menüsü: ${name}`,
    dashboard: 'Panelim',
    signOut: 'Çıkış yap',
    mainMenu: 'Ana menü',
    mobileMenu: 'Mobil menü',
    footerMenu: 'Alt menü',
    openMenu: 'Menüyü aç',
    closeMenu: 'Menüyü kapat',
    tagline: 'Büyük teknoloji şirketlerinde yazılım mühendisi olmak isteyenler için konu anlatımları, testler ve kodlama pratiği.',
    skipToContent: 'İçeriğe geç',
  },
  en: {
    navigation: { tracks: 'Learning Tracks', problems: 'Problems', quizzes: 'Quizzes', playground: 'Playground' },
    homeLabel: 'Zirve home',
    lightTheme: 'Switch to light theme',
    darkTheme: 'Switch to dark theme',
    language: 'Language',
    switchLanguage: 'Türkçeye geç',
    signIn: 'Sign in',
    register: 'Sign up',
    accountMenu: (name: string) => `Account menu: ${name}`,
    dashboard: 'My dashboard',
    signOut: 'Sign out',
    mainMenu: 'Main menu',
    mobileMenu: 'Mobile menu',
    footerMenu: 'Footer menu',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    tagline: 'Lessons, quizzes and coding practice for anyone who wants to become a software engineer at a big tech company.',
    skipToContent: 'Skip to content',
  },
});

const navigationPaths = [
  { to: '/tracks', key: 'tracks' },
  { to: '/problems', key: 'problems' },
  { to: '/quizzes', key: 'quizzes' },
  { to: '/playground', key: 'playground' },
] as const;

function useNavigation() {
  const t = useMessages(messages);
  return navigationPaths.map((item) => ({ to: item.to, label: t.navigation[item.key] }));
}

export function Logo({ className }: { className?: string }) {
  const t = useMessages(messages);

  return (
    <Link to="/" className={cn('flex items-center gap-2 font-bold tracking-tight', className)} aria-label={t.homeLabel}>
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <circle cx="22.5" cy="9.5" r="2.6" fill="#fbbf24" />
        <path d="M4 25 L12.5 10 L17 17.5 L19.5 14 L28 25 Z" className="fill-primary-fg" />
      </svg>
      <span className="text-lg">Zirve</span>
    </Link>
  );
}

/** Türkçe ↔ İngilizce. Düğme her zaman öbür dilin kısaltmasını gösterir. */
function LanguageToggle() {
  const t = useMessages(messages);
  const locale = useLocale();
  const next: Locale = locale === 'tr' ? 'en' : 'tr';

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={t.switchLanguage}
      title={t.switchLanguage}
      lang={next}
    >
      <Languages className="size-4" aria-hidden />
      <span>{next.toUpperCase()}</span>
    </button>
  );
}

function ThemeToggle() {
  const t = useMessages(messages);
  const { theme, toggle } = useTheme();
  const Icon = theme === 'dark' ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"
      aria-label={theme === 'dark' ? t.lightTheme : t.darkTheme}
    >
      <Icon className="size-4.5" aria-hidden />
    </button>
  );
}

function UserMenu() {
  const t = useMessages(messages);
  const locale = useLocale();
  const { user, isLoading } = useUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (isLoading) return <div className="h-9 w-20 animate-pulse rounded-lg bg-surface-2" />;

  if (!user) {
    const from = location.pathname + location.search;

    return (
      <div className="flex items-center gap-2">
        <ButtonLink to="/login" state={{ from }} variant="ghost" size="sm" className="hidden sm:inline-flex">
          {t.signIn}
        </ButtonLink>
        <ButtonLink to="/register" state={{ from }} size="sm">
          {t.register}
        </ButtonLink>
      </div>
    );
  }

  const initials = user.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase(locale))
    .join('');

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.accountMenu(user.displayName)}
        className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-text ring-primary/40 transition hover:ring-2"
      >
        {initials || '?'}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-surface p-1.5 shadow-card">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium">{user.displayName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <Link
            role="menuitem"
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface-2"
          >
            <LayoutDashboard className="size-4 text-muted" aria-hidden />
            {t.dashboard}
          </Link>
          <button
            role="menuitem"
            type="button"
            disabled={logout.isPending}
            onClick={() => {
              setOpen(false);
              logout.mutate(undefined, { onSuccess: () => navigate('/') });
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2"
          >
            <LogOut className="size-4 text-muted" aria-hidden />
            {t.signOut}
          </button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const t = useMessages(messages);
  const navigation = useNavigation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
      isActive ? 'bg-surface-2 text-fg' : 'text-muted hover:text-fg',
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <nav aria-label={t.mainMenu} className="ml-4 hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden w-56 md:block">
            <SearchBox />
          </div>
          <LanguageToggle />
          <ThemeToggle />
          <UserMenu />
          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 lg:hidden"
            aria-label={mobileOpen ? t.closeMenu : t.openMenu}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-menu" className="border-t border-border lg:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            <div className="pb-2 md:hidden">
              <SearchBox />
            </div>
            <nav aria-label={t.mobileMenu} className="flex flex-col gap-1">
              {navigation.map((item) => (
                <NavLink key={item.to} to={item.to} className={linkClass} onClick={() => setMobileOpen(false)}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const t = useMessages(messages);
  const navigation = useNavigation();

  return (
    <footer className="mt-20 border-t border-border">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Logo />
          <p className="mt-2 max-w-sm text-sm text-muted">{t.tagline}</p>
        </div>
        <nav aria-label={t.footerMenu} className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          {navigation.map((item) => (
            <Link key={item.to} to={item.to} className="hover:text-fg">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

/** Editör içeren sayfalar ekranın tamamını kullanır; alt bilgi gösterilmez. */
function isWorkspaceRoute(pathname: string): boolean {
  return /^\/problems\/[^/]+$/.test(pathname) || pathname === '/playground';
}

export function Layout() {
  const t = useMessages(messages);
  const { pathname } = useLocation();
  const workspace = isWorkspaceRoute(pathname);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg"
      >
        {t.skipToContent}
      </a>
      <Header />
      <main id="main" className="flex-1">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>
      {!workspace && <Footer />}
      <ScrollRestoration />
    </div>
  );
}
