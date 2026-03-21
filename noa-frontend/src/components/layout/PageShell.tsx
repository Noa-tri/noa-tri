import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageShell({ title, subtitle, actions, children }: Props) {
  return (
    <div className="min-h-full bg-[#07111f] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-6">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              NOA TRI / Adaptive Performance System
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-3xl text-sm text-slate-300">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        <div className="grid gap-6">{children}</div>
      </div>
    </div>
  );
}
