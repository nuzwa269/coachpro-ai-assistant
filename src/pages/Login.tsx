import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import logo from "@/assets/logo.png";

export default function Login() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border border-border">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src={logo} alt="CoachPro AI" className="h-16 w-auto mx-auto" />
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>Log in to your CoachPro AI account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" />
            </div>
            <Button className="w-full rounded-full" asChild>
              <Link to="/dashboard">Log In</Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary hover:underline">Sign Up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
