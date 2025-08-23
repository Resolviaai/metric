import React from 'react';
import { Button } from '@/components/ui/button';
import { Timer, BarChart3, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';

type Session = {
  id: string;
  description: string;
  start: Date;
  end?: Date;
  duration: number;
};

interface HeaderProps {
  activeView: 'timer' | 'analytics';
  onViewChange: (view: 'timer' | 'analytics') => void;
  currentSession: Session | null;
}

export const Header: React.FC<HeaderProps> = ({ activeView, onViewChange, currentSession }) => {
  const { theme, toggleTheme } = useTheme();
  const { signOut, user } = useAuth();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Timer className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold gradient-text">Metric</h1>
          </div>
          
          {currentSession && !isMobile && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
              <span className="text-foreground-secondary">Active: {currentSession.description}</span>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex items-center space-x-2">
            <Button
              variant={activeView === 'timer' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('timer')}
              className="flex items-center space-x-2"
            >
              <Timer className="h-4 w-4" />
              <span>Timer</span>
            </Button>
            
            <Button
              variant={activeView === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('analytics')}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Analytics</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="flex items-center space-x-2"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </nav>
        )}

        {/* Mobile Menu Button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
      </div>

      {/* Mobile Menu */}
      {isMobile && mobileMenuOpen && (
        <div className="border-t border-border bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {currentSession && (
              <div className="flex items-center space-x-2 text-sm mb-4 p-3 bg-surface rounded-lg">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <span className="text-foreground-secondary">Active: {currentSession.description}</span>
              </div>
            )}
            
            <Button
              variant={activeView === 'timer' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                onViewChange('timer');
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <Timer className="h-4 w-4 mr-2" />
              Timer
            </Button>
            
            <Button
              variant={activeView === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                onViewChange('analytics');
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-full justify-start"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};