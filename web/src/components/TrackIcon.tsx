import {
  Atom,
  Binary,
  BookOpen,
  Braces,
  Building2,
  Cloud,
  Compass,
  Cpu,
  Database,
  FileCode2,
  GitBranch,
  Hammer,
  Hash,
  Network,
  Server,
  type LucideIcon,
} from 'lucide-react';
import { accentIconClass } from '@/lib/accents';
import { cn } from '@/lib/format';

const icons: Record<string, LucideIcon> = {
  compass: Compass,
  binary: Binary,
  network: Network,
  csharp: Hash,
  server: Server,
  javascript: Braces,
  typescript: FileCode2,
  react: Atom,
  database: Database,
  cpu: Cpu,
  building: Building2,
  hammer: Hammer,
  cloud: Cloud,
  git: GitBranch,
};

const boxSizes = { sm: 'size-8 rounded-lg', md: 'size-11 rounded-xl', lg: 'size-14 rounded-2xl' };
const glyphSizes = { sm: 'size-4', md: 'size-5', lg: 'size-7' };

export function TrackIcon({ icon, accent, size = 'md' }: { icon: string; accent: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = icons[icon] ?? BookOpen;

  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center', boxSizes[size], accentIconClass(accent))}>
      <Icon className={glyphSizes[size]} aria-hidden />
    </span>
  );
}
