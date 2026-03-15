import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InstallPWA } from "@/components/InstallPWA";
import AuthPage from "@/pages/AuthPage";
import ClientHome from "@/pages/client/ClientHome";
import ClientSession from "@/pages/client/ClientSession";
import ClientHabits from "@/pages/client/ClientHabits";
import ClientRoutines from "@/pages/client/ClientRoutines";
import ClientArticles from "@/pages/client/ClientArticles";
import ClientArticle from "@/pages/client/ClientArticle";
import CoachDashboard from "@/pages/coach/CoachDashboard";
import CoachClients from "@/pages/coach/CoachClients";
import CoachClient from "@/pages/coach/CoachClient";
import CoachBuilder from "@/pages/coach/CoachBuilder";
import CoachWorkouts from "@/pages/coach/CoachWorkouts";
import CoachExercises from "@/pages/coach/CoachExercises";
import CoachRoutines from "@/pages/coach/CoachRoutines";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <InstallPWA />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            {/* Routes client */}
            <Route path="/client/dashboard" element={
              <ProtectedRoute allowedRoles={["sportif"]}>
                <ClientHome />
              </ProtectedRoute>
            } />
            <Route path="/client/home" element={
              <ProtectedRoute allowedRoles={["sportif"]}>
                <ClientHome />
              </ProtectedRoute>
            } />
            <Route path="/client/program" element={<Navigate to="/client/home" replace />} />
            <Route path="/client/session/:sessionId" element={
              <ProtectedRoute allowedRoles={["sportif"]}>
                <ClientSession />
              </ProtectedRoute>
            } />
            <Route path="/client/habits" element={
              <ProtectedRoute allowedRoles={["sportif"]}>
                <ClientHabits />
              </ProtectedRoute>
            } />
            <Route path="/client/routines" element={
              <ProtectedRoute allowedRoles={["sportif"]}>
                <ClientRoutines />
              </ProtectedRoute>
            } />
            <Route path="/client/articles" element={
              <ProtectedRoute allowedRoles={["sportif"]}>
                <ClientArticles />
              </ProtectedRoute>
            } />
            <Route path="/client/articles/:slug" element={
              <ProtectedRoute allowedRoles={["sportif"]}>
                <ClientArticle />
              </ProtectedRoute>
            } />

            {/* Routes coach */}
            <Route path="/coach/dashboard" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachDashboard />
              </ProtectedRoute>
            } />
            <Route path="/coach/clients" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachClients />
              </ProtectedRoute>
            } />
            <Route path="/coach/client/:id" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachClient />
              </ProtectedRoute>
            } />
            <Route path="/coach/builder/:clientId" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachBuilder />
              </ProtectedRoute>
            } />
            <Route path="/coach/workouts" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachWorkouts />
              </ProtectedRoute>
            } />
            <Route path="/coach/exercises" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachExercises />
              </ProtectedRoute>
            } />
            <Route path="/coach/routines" element={
              <ProtectedRoute allowedRoles={["coach"]}>
                <CoachRoutines />
              </ProtectedRoute>
            } />

            {/* Redirection racine vers auth */}
            <Route path="/" element={<Navigate to="/auth" replace />} />
            
            {/* Catch-all pour 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
