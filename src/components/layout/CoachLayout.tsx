import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, Settings, LogOut, Dumbbell, ClipboardList, Library, Activity } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CoachBottomNav } from '@/components/coach/CoachBottomNav';
import { CoachMobileHeader } from '@/components/coach/CoachMobileHeader';

interface CoachLayoutProps {
  children: React.ReactNode;
}

export const CoachLayout: React.FC<CoachLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Header mobile */}
      <CoachMobileHeader />
      
      {/* Sidebar desktop - cachée sur mobile */}
      <aside className="hidden md:flex md:w-64 bg-nav text-nav-foreground flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3">
            <img src="/logo-actiminute.png" alt="Acti'Minute" className="h-10 w-10" />
            <div>
              <h1 className="font-bold text-lg">Acti'Minute</h1>
              <p className="text-sm opacity-75">Coach {user?.handle || 'Pro'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 pb-4">
          <div className="space-y-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/coach/dashboard')}
              className={`w-full justify-start text-nav-foreground hover:bg-white/10 ${
                isActive('/coach/dashboard') ?'bg-nav-active text-white' : ''
              }`}
            >
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/coach/clients')}
              className={`w-full justify-start text-nav-foreground hover:bg-white/10 ${
                isActive('/coach/client') ?'bg-nav-active text-white' : ''
              }`}
            >
              <Users className="h-5 w-5 mr-3" />
              Mes Clients
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/coach/workouts')}
              className={`w-full justify-start text-nav-foreground hover:bg-white/10 ${
                isActive('/coach/workouts') ?'bg-nav-active text-white' : ''
              }`}
            >
              <ClipboardList className="h-5 w-5 mr-3" />
              Mes Séances
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/coach/exercises')}
              className={`w-full justify-start text-nav-foreground hover:bg-white/10 ${
                isActive('/coach/exercises') ?'bg-nav-active text-white' : ''
              }`}
            >
              <Library className="h-5 w-5 mr-3" />
              Banque d'exercices
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate('/coach/routines')}
              className={`w-full justify-start text-nav-foreground hover:bg-white/10 ${
                isActive('/coach/routines') ?'bg-nav-active text-white' : ''
              }`}
            >
              <Activity className="h-5 w-5 mr-3" />
              Mes Routines
            </Button>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-nav-foreground hover:bg-white/10"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Déconnexion
          </Button>
        </div>
      </aside>

      {/* Contenu principal - padding bottom sur mobile pour la bottom nav, padding top pour header mobile */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 pt-14 md:pt-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>

      {/* Navigation bottom - visible uniquement sur mobile */}
      <CoachBottomNav />
    </div>
  );
};