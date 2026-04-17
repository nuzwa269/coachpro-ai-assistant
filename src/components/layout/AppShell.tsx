import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { mockUser } from "@/data/mock-data";
import { Coins } from "lucide-react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <AppSidebar />
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
