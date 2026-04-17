import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { mockUser } from "@/data/mock-data";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop top bar with email */}
        <div className="hidden h-16 items-center justify-end border-b border-border bg-card px-6 md:flex">
          <span className="text-sm text-muted-foreground">{mockUser.email}</span>
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
