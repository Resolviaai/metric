import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Play, Pause, Square, Clock, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

type Session = {
  id: string;
  description: string;
  start: Date;
  end?: Date;
  duration: number;
};

interface TimerProps {
  currentSession: Session | null;
  onStartSession: (description: string) => void;
  onEndSession: () => void;
  onInactivityPrompt: () => void;
}

export const Timer: React.FC<TimerProps> = ({
  currentSession,
  onStartSession,
  onEndSession,
  onInactivityPrompt
}) => {
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const intervalRef = useRef<NodeJS.Timeout>();
  const inactivityTimeoutRef = useRef<NodeJS.Timeout>();

  // Update elapsed time when session is active
  useEffect(() => {
    if (currentSession) {
      const updateElapsed = () => {
        setElapsedTime(Date.now() - currentSession.start.getTime());
      };

      intervalRef.current = setInterval(updateElapsed, 1000);
      updateElapsed(); // Initial update

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setElapsedTime(0);
    }
  }, [currentSession]);

  // Inactivity detection
  useEffect(() => {
    if (!currentSession) return;

    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const sessionDuration = now - currentSession.start.getTime();

      // First check at 45 minutes, then every 30 minutes
      const inactivityThreshold = sessionDuration < 45 * 60 * 1000 
        ? 45 * 60 * 1000 
        : 30 * 60 * 1000;

      if (timeSinceActivity > inactivityThreshold) {
        onInactivityPrompt();
        setLastActivity(now); // Reset activity timer after prompt
      }
    };

    // Add activity listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    // Check inactivity every 30 seconds
    const inactivityInterval = setInterval(checkInactivity, 30000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearInterval(inactivityInterval);
    };
  }, [currentSession, lastActivity, onInactivityPrompt]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (!description.trim()) return;
    onStartSession(description);
    setLastActivity(Date.now());
  };

  const handleStop = () => {
    onEndSession();
    setDescription('');
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 gradient-text">
          FlowCheck
        </h1>
        <p className="text-xl text-foreground-secondary max-w-2xl mx-auto">
          Track your focus sessions with smart inactivity detection and detailed analytics
        </p>
      </div>

      {/* Timer Display */}
      <Card className={cn(
        "p-8 md:p-12 text-center mb-8 glass-effect border-2",
        currentSession && "pulse-glow border-primary"
      )}>
        <div className="mb-8">
          <div className="timer-display mb-4">
            {formatTime(elapsedTime)}
          </div>
          
          {currentSession && (
            <div className="flex items-center justify-center gap-2 text-lg text-foreground-secondary">
              <Target className="w-5 h-5" />
              <span>{currentSession.description}</span>
            </div>
          )}
        </div>

        {!currentSession ? (
          <div className="space-y-6">
            <div className="max-w-md mx-auto">
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you focusing on?"
                className="text-center text-lg py-6 border-2 border-primary/20 focus:border-primary"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && description.trim()) {
                    handleStart();
                  }
                }}
              />
            </div>
            
            <Button
              onClick={handleStart}
              disabled={!description.trim()}
              size="lg"
              className="px-12 py-6 text-lg bg-gradient-primary hover:opacity-90 shadow-glow transition-all duration-300"
            >
              <Play className="w-6 h-6 mr-2" />
              Start Focus Session
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-center gap-4 text-sm text-foreground-muted">
              <Clock className="w-4 h-4" />
              <span>Session started at {currentSession.start.toLocaleTimeString()}</span>
            </div>
            
            <Button
              onClick={handleStop}
              variant="destructive"
              size="lg"
              className="px-12 py-6 text-lg"
            >
              <Square className="w-6 h-6 mr-2" />
              End Session
            </Button>
          </div>
        )}
      </Card>

      {/* Tips */}
      <Card className="p-6 bg-surface-elevated border border-primary/20">
        <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
          <Target className="w-5 h-5" />
          Focus Tips
        </h3>
        <ul className="space-y-2 text-sm text-foreground-secondary">
          <li>• FlowCheck will check for inactivity after 45 minutes, then every 30 minutes</li>
          <li>• Move your mouse or use your keyboard to stay active</li>
          <li>• Take breaks when prompted to maintain optimal focus</li>
          <li>• Review your analytics to understand your peak focus times</li>
        </ul>
      </Card>
    </div>
  );
};