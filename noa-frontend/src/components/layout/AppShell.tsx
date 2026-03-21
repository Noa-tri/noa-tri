import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

type Props = {
  children: ReactNode;
};

export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-[1600px] px-6 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
