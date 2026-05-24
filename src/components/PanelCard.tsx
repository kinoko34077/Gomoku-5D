import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface PanelCardProps {
  title: string;
  subtitle?: string;
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}

export function PanelCard({ title, subtitle, defaultCollapsed = false, children }: PanelCardProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <section className="pointer-events-auto rounded-2xl border border-slate-700/85 bg-slate-950/76 shadow-2xl backdrop-blur-md">
      <button
        type="button"
        onClick={() => setCollapsed(prev => !prev)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
            {title}
          </div>
          {subtitle ? <div className="mt-1 truncate text-[10px] text-slate-500">{subtitle}</div> : null}
        </div>
        <div className="shrink-0 rounded-lg border border-slate-700 bg-slate-900/80 p-1 text-slate-300">
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>
      </button>

      {!collapsed ? <div className="border-t border-slate-800/90 px-4 py-4">{children}</div> : null}
    </section>
  );
}
