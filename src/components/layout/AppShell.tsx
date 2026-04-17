import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { mockUser } from "@/data/mock-data";
import { Coins, Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background md:flex-row">
      {/* Mobile top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <img src={logo} alt="CoachPro AI" className="h-7 w-auto" />
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Coins className="h-3 w-3" />
            {mockUser.credits}
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md p-1.5 hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <AppSidebar mobileMode onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop top bar */}
        <header className="hidden h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6 md:flex">
          <div className="text-sm font-medium text-foreground">Workspace</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Coins className="h-3.5 w-3.5" />
              {mockUser.credits}
            </div>
            <span className="text-sm text-muted-foreground">{mockUser.email}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
