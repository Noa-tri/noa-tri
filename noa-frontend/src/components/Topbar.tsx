import { Bell, Search, Wifi } from "lucide-react";

export default function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-noa-line bg-noa-bg/70 px-6 py-4 backdrop-blur md:px-8 xl:px-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-noa-muted">NOA TRI</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">High Performance Command Center</h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3 md:flex">
            <Search size={16} className="text-noa-muted" />
            <span className="text-sm text-noa-muted">Search athlete, session, race...</span>
          </div>

          <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-noa-line bg-noa-panel2 text-noa-muted transition hover:text-white">
            <Bell size={18} />
          </button>

          <div className="flex items-center gap-2 rounded-2xl border border-noa-line bg-noa-panel2 px-4 py-3">
            <Wifi size={16} className="text-noa-success" />
            <span className="text-sm font-medium text-white">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
}
