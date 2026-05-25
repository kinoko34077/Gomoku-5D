import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface PanelCardProps {
  title: string;
  subtitle?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
  onClose?: () => void;
  headerTrailing?: ReactNode;
}

export function PanelCard({
  title,
  subtitle,
  className = '',
  contentClassName = '',
  children,
  onClose,
  headerTrailing,
}: PanelCardProps) {
  return (
    <section className={`pointer-events-auto overflow-hidden rounded-[1.6rem] border border-slate-700/80 bg-slate-950/94 shadow-2xl ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-800/90 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-200">
            {title}
          </div>
          {subtitle ? <div className="mt-1 text-[10px] text-slate-500">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-2">
          {headerTrailing}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 bg-slate-900/80 p-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              title="閉じる"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>
      <div className={`px-4 py-3 ${contentClassName}`}>{children}</div>
    </section>
  );
}
