import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/logo.png";

export function Footer() {
  return (
    <footer className="bg-brand-dark text-brand-light">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="CoachPro AI" className="h-10 w-auto brightness-0 invert" />
            </Link>
            <p className="text-sm text-gray-400">
              Where Ideas Become Tools. Simple, fast, powerful AI tools for learning, teaching, and creating.
            </p>
          </div>

          {/* Product Info */}
          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-gray-400">
              Product Info
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/#features" className="text-gray-300 hover:text-white transition-colors">EduPro</Link></li>
              <li><Link to="/assistants" className="text-gray-300 hover:text-white transition-colors">AI Tools</Link></li>
              <li><Link to="/pricing" className="text-gray-300 hover:text-white transition-colors">Subscription Plans</Link></li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-gray-400">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/login" className="text-gray-300 hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/signup" className="text-gray-300 hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">Member Pro</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-gray-400">
              Contact
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-gray-300">
                <Mail className="h-4 w-4 shrink-0 text-primary" /> support@coachproai.com
              </li>
              <li className="flex items-center gap-2 text-gray-300">
                <Phone className="h-4 w-4 shrink-0 text-primary" /> WhatsApp Support
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <MapPin className="h-4 w-4 shrink-0 text-primary mt-0.5" /> Worldwide
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} CoachProAi. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
