import { Link, useLocation } from "react-router-dom";
import { Menu, X, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { mockUser } from "@/data/mock-data";
import logo from "@/assets/logo.png";

const navLinks = [
  { label: "EduPro", href: "/#features" },
  { label: "Tools", href: "/assistants" },
  { label: "Plans & Credits", href: "/buy-credits" },
  { label: "Member Pro", href: "/dashboard" },
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
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1">
          <img src={logo} alt="CoachPro AI" className="h-10 w-auto" />
        </Link>

        {/* Center Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              to={l.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right Side */}
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
            <Button asChild className="rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-brand-orange-hover">
              <Link to="/login">LOGIN / SIGN UP</Link>
            </Button>
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
              <Button asChild className="mt-2 rounded-full">
                <Link to="/login">LOGIN / SIGN UP</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
