import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FolderKanban, Bookmark, Coins, Settings, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
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
  userEmail?: string;
}

export function AppSidebar({ userEmail = mockUser.email }: AppSidebarProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = () => navigate("/signup");

  const SidebarContent = (
    <div className="flex h-full flex-col bg-card">
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
            onClick={() => setOpen(false)}
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
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <img src={logo} alt="CoachPro AI" className="h-7 w-auto" />
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{userEmail}</span>
          <button onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border md:block">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-md p-1.5 hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
