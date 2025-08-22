import React from 'react';
import { Button } from '@/components/ui/button';
import { Timer, BarChart3, Target, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  currentSession
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
            <Target className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold gradient-text">FlowCheck</h1>
            <p className="text-xs text-foreground-muted">Focus Tracker</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          <Button
            variant={activeView === 'timer' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('timer')}
            className={cn(
              "gap-2",
              activeView === 'timer' && "bg-gradient-primary text-primary-foreground"
            )}
          >
            <Timer className="w-4 h-4" />
            <span className="hidden sm:inline">Timer</span>
          </Button>
          
          <Button
            variant={activeView === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewChange('analytics')}
            className={cn(
              "gap-2",
              activeView === 'analytics' && "bg-gradient-primary text-primary-foreground"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Analytics</span>
          </Button>
        </nav>

        {/* Session Status */}
        <div className="flex items-center gap-3">
          {currentSession && (
            <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <Circle className="w-3 h-3 fill-primary text-primary animate-pulse" />
              <span className="text-sm font-medium text-primary hidden sm:inline">
                Active Session
              </span>
            </div>
          )}
          
          <div className="hidden md:flex items-center gap-2 text-sm text-foreground-muted">
            <span>Ready to focus?</span>
          </div>
        </div>
      </div>
    </header>
  );
};