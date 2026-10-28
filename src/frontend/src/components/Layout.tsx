import { SignInButton } from "@/components/InternetIdentity";
import { vi } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Pill,
  Search,
  Stethoscope,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import type { ReactNode } from "react";

type NavItem = {
  to: string;
  label: string;
  icon: ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    to: "/",
    label: vi.nav.dashboard,
    icon: <LayoutDashboard className="size-4" />,
  },
  {
    to: "/patients",
    label: vi.nav.patients,
    icon: <Users className="size-4" />,
  },
  {
    to: "/doctors",
    label: vi.nav.doctors,
    icon: <Stethoscope className="size-4" />,
  },
  {
    to: "/appointments",
    label: vi.nav.appointments,
    icon: <CalendarDays className="size-4" />,
  },
  {
    to: "/records",
    label: vi.nav.records,
    icon: <ClipboardList className="size-4" />,
  },
  {
    to: "/prescriptions",
    label: vi.nav.prescriptions,
    icon: <Pill className="size-4" />,
  },
  {
    to: "/medicines",
    label: vi.nav.medicines,
    icon: <Activity className="size-4" />,
  },
  {
    to: "/accounts",
    label: vi.nav.accounts,
    icon: <UserCog className="size-4" />,
  },
  {
    to: "/roles",
    label: vi.nav.roles,
    icon: <UsersRound className="size-4" />,
  },
];

function SidebarNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav
      data-ocid="sidebar.nav"
      aria-label="Điều hướng chính"
      className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4"
    >
      {NAV_ITEMS.map((item) => {
        const active =
          item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to}
            data-ocid={`sidebar.link.${item.to === "/" ? "dashboard" : item.to.slice(1)}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-smooth focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sidebar-ring",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <span aria-hidden="true">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh bg-background">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold leading-tight text-sidebar-foreground">
              {vi.app.shortName}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/60">
              {vi.app.tagline}
            </p>
          </div>
        </div>
        <SidebarNav />
        <div className="border-t border-sidebar-border px-5 py-3">
          <p className="text-xs text-sidebar-foreground/60">
            © {new Date().getFullYear()} {vi.app.shortName}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-border bg-card px-4 py-3 shadow-subtle md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity className="size-4" aria-hidden="true" />
            </span>
          </div>
          <div className="relative hidden min-w-0 flex-1 sm:block">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              data-ocid="header.search_input"
              placeholder={vi.common.searchPlaceholder}
              aria-label={vi.common.search}
              className="w-full max-w-md rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              data-ocid="header.notifications_button"
              aria-label="Thông báo"
              className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-smooth hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Bell className="size-4" aria-hidden="true" />
            </button>
            <SignInButton className="rounded-md border border-input bg-card px-3 py-2 text-sm font-medium text-foreground transition-smooth hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-60" />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in space-y-6 md:space-y-8">
            {children}
          </div>
        </main>

        <footer className="border-t border-border bg-muted/40 px-4 py-3 md:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {vi.footer.attribution}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
