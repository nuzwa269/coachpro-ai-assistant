import { Link, useLocation } from "react-router-dom";
import { Zap, Menu, X, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { mockUser } from "@/data/mock-data";

const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Assistants", href: "/assistants" },
];

const authLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Assistants", href: "/assistants" },
  { label: "Saved", href: "/saved" },
  { label: "Settings", href: "/settings" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isLoggedIn = location.pathname !== "/" && location.pathname !== "/login" && location.pathname !== "/signup" && location.pathname !== "/pricing";
  const links = isLoggedIn ? authLinks : navLinks;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-heading text-xl font-bold">CoachPro AI</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium">
                <CreditCard className="h-4 w-4 text-primary" />
                {mockUser.credits} Credits
              </div>
              <Link to="/settings">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-4 w-4" />
                </div>
              </Link>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className="text-sm font-medium text-muted-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            {!isLoggedIn && (
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" asChild className="flex-1">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
