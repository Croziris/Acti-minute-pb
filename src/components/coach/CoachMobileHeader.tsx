import { Menu, LogOut, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const CoachMobileHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
    setOpen(false);
  };

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-nav text-nav-foreground border-b border-white/10 flex items-center justify-between px-4">
      <div className="flex items-center space-x-2">
        <img src="/logo-actiminute.png" alt="Acti'Minute" className="h-8 w-8" />
        <h1 className="font-bold text-lg">Acti'Minute</h1>
      </div>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-nav-foreground">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64">
          <SheetHeader>
            <SheetTitle>Menu Coach</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="pb-4 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{user?.name || 'Coach'}</p>
                  <p className="text-sm text-muted-foreground">Compte coach</p>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                // Future: navigate to profile
                setOpen(false);
              }}
            >
              <User className="h-4 w-4 mr-2" />
              Mon profil
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                // Future: navigate to settings
                setOpen(false);
              }}
            >
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>

            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
};
