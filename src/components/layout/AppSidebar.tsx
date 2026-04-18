import { NavLink, useNavigate, Link } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Bot, Bookmark, Coins, Settings, LogOut, Shield, MessageSquare, Sparkles, Crown } from "lucide-react";
import logo from "@/assets/logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { creditsToMessages } from "@/lib/credits";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Assistants", to: "/assistants", icon: Bot },
  { label: "Saved Outputs", to: "/saved", icon: Bookmark },
  { label: "Buy Credits", to: "/buy-credits", icon: Coins },
  { label: "Settings", to: "/settings", icon: Settings },
];

interface AppSidebarProps {
  mobileMode?: boolean;
  onNavigate?: () => void;
}

function UpgradeCard({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Link
      to="/pricing"
      onClick={onNavigate}
      className="block rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-3 transition-all hover:border-primary/50 hover:shadow-sm"
    >
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20">
          <Crown className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">Unlock Pro</p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
            <li className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" />
              GPT-5 & Claude access
            </li>
            <li className="flex items-center gap-1">
              <Coins className="h-3 w-3 text-primary" />
              5,000 credits/mo
            </li>
            <li className="flex items-center gap-1">
              <Bot className="h-3 w-3 text-primary" />
              Unlimited assistants
            </li>
          </ul>
          <Button size="sm" className="mt-2 h-7 w-full text-xs">
            Upgrade Now
          </Button>
        </div>
      </div>
    </Link>
  );
}

export function AppSidebar({ mobileMode = false, onNavigate }: AppSidebarProps) {
  const navigate = useNavigate();
  const { profile, isAdmin, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  const isFreePlan = profile?.plan === "free";

  return (
    <aside className={cn("h-full border-r border-border bg-card", mobileMode ? "w-full" : "w-64 shrink-0")}>
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b border-border px-6">
          <img src={logo} alt="CoachPro AI" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink
              to="/admin"
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )
              }
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </NavLink>
          )}
        </nav>

        <div className="space-y-2 border-t border-border p-3">
          {isFreePlan && <UpgradeCard onNavigate={onNavigate} />}
          
          <Link
            to="/buy-credits"
            onClick={onNavigate}
            className="block rounded-lg bg-muted/50 p-3 transition-colors hover:bg-muted"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Messages left
              </span>
              <span className="text-sm font-semibold text-foreground">
                ≈ {creditsToMessages(profile?.credits).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Coins className="h-3 w-3" />
              <span>{profile?.credits ?? 0} credits · tap to top up</span>
            </div>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
