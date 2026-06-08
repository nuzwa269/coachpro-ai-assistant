import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();
const Login = lazy(() => import("./pages/Login.tsx"));
const Signup = lazy(() => import("./pages/Signup.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Projects = lazy(() => import("./pages/Projects.tsx"));
const Assistants = lazy(() => import("./pages/Assistants.tsx"));
const ProjectWorkspace = lazy(() => import("./pages/ProjectWorkspace.tsx"));
const SavedResponses = lazy(() => import("./pages/SavedResponses.tsx"));
const BuyCredits = lazy(() => import("./pages/BuyCredits.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const HelpAssistants = lazy(() => import("./pages/HelpAssistants.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/dashboard" replace /> : <Index />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
              <Route path="/assistants" element={<ProtectedRoute><Assistants /></ProtectedRoute>} />
              <Route path="/project/:id" element={<ProtectedRoute><ProjectWorkspace /></ProtectedRoute>} />
              <Route path="/saved" element={<ProtectedRoute><SavedResponses /></ProtectedRoute>} />
              <Route path="/buy-credits" element={<ProtectedRoute><BuyCredits /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
              <Route path="/help/assistants" element={<ProtectedRoute><HelpAssistants /></ProtectedRoute>} />
              <Route path="/pricing" element={<Navigate to="/buy-credits" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
