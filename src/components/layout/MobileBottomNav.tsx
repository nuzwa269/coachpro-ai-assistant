import { NavLink } from "react-router-dom";
import { MessageSquare, FolderKanban, Bot, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Chat", to: "/dashboard", icon: MessageSquare },
  { label: "Projects", to: "/projects", icon: FolderKanban },
  { label: "Assistants", to: "/assistants", icon: Bot },
  { label: "Credits", to: "/buy-credits", icon: Coins },
];

export function MobileBottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-4">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <tab.icon
                    className={cn(
                      "h-5 w-5",
                      isActive && "stroke-[2.5]"
                    )}
                  />
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
