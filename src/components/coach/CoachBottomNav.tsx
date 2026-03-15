import { useState } from 'react';
import { Home, Users, Dumbbell, MoreHorizontal } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { CoachMoreMenu } from './CoachMoreMenu';

export const CoachBottomNav = () => {
  const location = useLocation();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  
  const navItems = [
    { to: '/coach/dashboard', icon: Home, label: 'Dashboard', exactMatch: true },
    { to: '/coach/clients', icon: Users, label: 'Clients', exactMatch: false },
    { to: '/coach/workouts', icon: Dumbbell, label: 'Séances', exactMatch: false },
  ];

  const isMoreActive = location.pathname.startsWith('/coach/exercises') || 
                       location.pathname.startsWith('/coach/routines');
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = item.exactMatch 
            ?location.pathname === item.to
            : location.pathname.startsWith(item.to);
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                isActive 
                  ?"text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
        
        {/* More Menu Button */}
        <button
          onClick={() => setMoreMenuOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
            isMoreActive 
              ?"text-primary" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-xs font-medium">Plus</span>
        </button>
      </div>

      <CoachMoreMenu open={moreMenuOpen} onOpenChange={setMoreMenuOpen} />
    </nav>
  );
};