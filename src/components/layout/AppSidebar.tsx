import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Bookmark, Coins, Settings, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { mockUser } from "@/data/mock-data";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Saved Outputs", to: "/saved", icon: Bookmark },
  { label: "Buy Credits", to: "/buy-credits", icon: Coins },
];

interface AppSidebarProps {
  mobileMode?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({ mobileMode = false, onNavigate }: AppSidebarProps) {
  const navigate = useNavigate();
  const handleSignOut = () => navigate("/signup");

  return (
    <aside className={cn("h-full border-r border-border bg-card", mobileMode ? "w-full" : "w-64 shrink-0")}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <img src={logo} alt="CoachPro AI" className="h-8 w-auto" />
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
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
          <div className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground/60">
            <span className="flex items-center gap-3">
              <Settings className="h-4 w-4" />
              Settings
            </span>
            <span className="text-xs">(Soon)</span>
          </div>
        </nav>

        {/* Footer */}
        <div className="space-y-1 border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium">
            <Coins className="h-4 w-4 text-primary" />
            <span>{mockUser.credits} credits</span>
          </div>
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
