import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message.includes("already") ? "Ye email pehle se registered hai. Sign in karein." : error.message);
      return;
    }
    if (data.session) {
      toast.success("Account ban gaya! 20 free credits mil gaye.");
      navigate("/dashboard", { replace: true });
    } else {
      toast.success("Check your email to confirm your account.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-10">
      <Link to="/signup" className="mb-8 flex items-center gap-3">
        <img src={logo} alt="CoachPro AI" className="h-10 w-auto" />
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground sm:text-3xl">Create your account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Start with 20 free credits — no card required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Jane Doe" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary hover:text-primary-foreground"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        © {new Date().getFullYear()} CoachPro AI. All rights reserved.
      </p>
    </div>
  );
}
