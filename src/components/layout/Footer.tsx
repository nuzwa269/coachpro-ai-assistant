import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer>
      {/* Main footer — white background */}
      <div className="bg-background border-t border-border">
        <div className="container py-16">
          <div className="grid gap-10 md:grid-cols-3">
            {/* Brand */}
            <div className="space-y-4">
              <Link to="/" className="inline-block">
                <img src={logo} alt="CoachPro AI" className="h-14 w-auto" />
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simple, fast, powerful AI tools for learning, teaching, and creating.
              </p>
            </div>

            {/* Useful Links */}
            <div>
              <h4 className="mb-5 font-heading text-lg font-bold text-foreground">
                Useful Links
              </h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/assistants" className="text-muted-foreground hover:text-foreground transition-colors">EduPaper Pro</Link></li>
                <li><Link to="/assistants" className="text-muted-foreground hover:text-foreground transition-colors">EduActivity Pro</Link></li>
                <li><Link to="/assistants" className="text-muted-foreground hover:text-foreground transition-colors">Small Biz Boost</Link></li>
                <li><Link to="/assistants" className="text-muted-foreground hover:text-foreground transition-colors">Calculator</Link></li>
              </ul>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="mb-5 font-heading text-lg font-bold text-foreground">
                Quick Links
              </h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link></li>
                <li><Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — dark gray */}
      <div className="bg-[#4a4a4a] py-4 text-center text-sm text-white">
        &copy; {new Date().getFullYear()} CoachPro AI | Developed by Codfusion.
      </div>
    </footer>
  );
}