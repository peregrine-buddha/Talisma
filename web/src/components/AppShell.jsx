import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Sparkles,
  Plus,
} from "lucide-react";

const NAV = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/",
  },
  {
    href: "/jobs",
    label: "Requisitions",
    icon: Briefcase,
    match: (p) => p.startsWith("/jobs"),
  },
  {
    href: "/candidates",
    label: "Talent Pool",
    icon: Users,
    match: (p) => p.startsWith("/candidates"),
  },
];

export default function AppShell({ children, title, subtitle, actions }) {
  const [path, setPath] = useState("/");

  useEffect(() => {
    setPath(window.location.pathname);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-inter text-gray-900 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col border-r border-gray-200 bg-white fixed h-screen">
        <div className="h-16 flex items-center gap-2 px-5 border-b border-gray-200">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <Sparkles size={16} color="#fff" />
          </div>
          <span className="text-base font-semibold tracking-tight">
            Talisma
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {NAV.map((item) => {
            const active = item.match(path);
            const Icon = item.icon;
            const cls = active
              ? "bg-blue-50 text-blue-600 font-medium"
              : "text-gray-600 font-normal hover:bg-gray-50";
            return (
              <a
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ${cls}`}
              >
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <a
            href="/jobs/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700"
          >
            <Plus size={16} /> New Requisition
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden h-14 flex items-center gap-2 px-4 border-b border-gray-200 bg-white">
          <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center">
            <Sparkles size={14} color="#fff" />
          </div>
          <span className="text-sm font-semibold">Talisma</span>
        </div>

        <header className="bg-white border-b border-gray-200 px-5 md:px-8 py-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-sm font-normal text-gray-500 mt-1">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex items-center gap-2">{actions}</div>
            ) : null}
          </div>

          {/* Mobile nav */}
          <nav className="md:hidden flex items-center gap-4 mt-4 -mb-1 overflow-x-auto">
            {NAV.map((item) => {
              const active = item.match(path);
              const cls = active
                ? "text-blue-600 font-medium"
                : "text-gray-500 font-normal";
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`text-sm whitespace-nowrap ${cls}`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 px-5 md:px-8 py-6">{children}</main>
      </div>
    </div>
  );
}
