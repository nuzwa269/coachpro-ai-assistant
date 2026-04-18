import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { UserAvatarMenu } from "./UserAvatarMenu";
import { MobileBottomNav } from "./MobileBottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { Coins, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { creditsToMessages } from "@/lib/credits";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { profile } = useAuth();
  const credits = profile?.credits ?? 0;
  const messagesLeft = creditsToMessages(credits);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background md:flex-row">
      {/* Mobile top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <Link to="/dashboard" className="flex items-center">
          <img src={logo} alt="CoachPro AI" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/buy-credits"
            className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
            aria-label={`${messagesLeft} messages remaining, tap to buy credits`}
          >
            <MessageSquare className="h-3 w-3" />
            ≈ {messagesLeft.toLocaleString()}
          </Link>
          <UserAvatarMenu size="sm" />
        </div>
      </header>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop top bar */}
        <header className="hidden h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6 md:flex">
          <div className="text-sm font-medium text-foreground">Workspace</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Coins className="h-3.5 w-3.5" />
              {credits}
            </div>
            <UserAvatarMenu />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-[72px] md:pb-0">{children}</main>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileBottomNav />
    </div>
  );
}
