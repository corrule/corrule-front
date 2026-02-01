import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChatwayWidget } from "@/components/ChatwayWidget";
import Dashboard from "@/pages/Dashboard";
import RulesList from "@/pages/RulesList";
import RuleDetail from "@/pages/RuleDetail";
import RuleEditor from "@/pages/RuleEditor";
import MyRules from "@/pages/MyRules";
import Favorites from "@/pages/Favorites";
import Purchase from "@/pages/Purchase";
import Profile from "@/pages/Profile";
import Billing from "@/pages/Billing";
import Notifications from "@/pages/Notifications";
import Chat from "@/pages/Chat";
import SearchResults from "@/pages/SearchResults";
import PublicProfile from "@/pages/PublicProfile";
import AdminPanel from "@/pages/AdminPanel";
import ModeratorPanel from "@/pages/ModeratorPanel";
import VerifiedContributorPanel from "@/pages/VerifiedContributorPanel";
import AccessDenied from "@/pages/AccessDenied";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Welcome from "@/pages/Welcome";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

// Component to handle conditional root rendering
const RootPage = () => {
  const { isAuthenticated } = useAuth();
  // If logged in, send users to the dashboard route which is wrapped by AppLayout
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Welcome />;
};

const App = () => (
  <GoogleOAuthProvider clientId="204500874677-q30falvq25vet9j1j2dq65ipeocu3cc2.apps.googleusercontent.com">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ChatwayWidget />
          <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/" element={<RootPage />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/users/:username" element={<PublicProfile />} />
            <Route path="/profile/:userId" element={<PublicProfile />} />
            <Route element={<AppLayout />}>
              {/* Dashboard route inside AppLayout so sidebar/header show for authenticated users */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rules"
                element={
                  <ProtectedRoute>
                    <RulesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rules/:id"
                element={
                  <ProtectedRoute>
                    <RuleDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rules/new"
                element={
                  <ProtectedRoute>
                    <RuleEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rules/:id/edit"
                element={
                  <ProtectedRoute>
                    <RuleEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-rules"
                element={
                  <ProtectedRoute>
                    <MyRules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/purchase/:ruleId"
                element={
                  <ProtectedRoute>
                    <Purchase />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat"
                element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="ADMIN" fallback={<AccessDenied requiredRole="ADMIN" panelName="Admin" />}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/moderator"
                element={
                  <ProtectedRoute requiredRole={["MODERATOR", "ADMIN"]} fallback={<AccessDenied requiredRole="MODERATOR" panelName="Moderator" />}>
                    <ModeratorPanel />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/contributor"
                element={
                  <ProtectedRoute requiredRole={["VERIFIED_CONTRIBUTOR", "MODERATOR", "ADMIN"]} fallback={<AccessDenied requiredRole="VERIFIED_CONTRIBUTOR" panelName="Contributor" />}>
                    <VerifiedContributorPanel />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
