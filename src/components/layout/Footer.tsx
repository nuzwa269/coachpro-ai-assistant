import { Link } from "react-router-dom";
import { Zap, Mail, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-brand-light">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl font-bold text-white">CoachPro AI</span>
            </Link>
            <p className="text-sm text-gray-400">
              Learn Tech. Build Systems. With AI.
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-gray-400">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/#features" className="text-gray-300 hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/assistants" className="text-gray-300 hover:text-white transition-colors">Assistants</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-gray-400">
              Account
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Log In</Link></li>
              <li><Link to="/signup" className="text-gray-300 hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-gray-400">
              Contact
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4" /> support@coachpro.ai
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <MessageCircle className="h-4 w-4" /> WhatsApp Support
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} CoachPro AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
