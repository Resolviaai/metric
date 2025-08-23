import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Square, Clock, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InactivityDialog } from './InactivityDialog';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

export const Timer = ({ currentSession, onStartSession, onEndSession, onInactivityPrompt }: TimerProps) => {
  const [description, setDescription] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [showInactivityDialog, setShowInactivityDialog] = useState(false);
  const [inactivityStage, setInactivityStage] = useState<'first' | 'repeat'>('first');
  const intervalRef = useRef<NodeJS.Timeout>();
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const { isOnline, saveSessionOffline } = useOfflineSync();
  const { user } = useAuth();

  // Update elapsed time
  useEffect(() => {
    if (currentSession) {
      const updateElapsed = () => {
        setElapsedTime(Date.now() - currentSession.start.getTime());
      };

      updateElapsed();
      intervalRef.current = setInterval(updateElapsed, 1000);

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

    const resetActivity = () => {
      setLastActivity(Date.now());
    };

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      // First prompt at 45 minutes, then every 30 minutes
      const firstThreshold = 45 * 60 * 1000; // 45 minutes
      const repeatThreshold = 30 * 60 * 1000; // 30 minutes
      
      const threshold = inactivityStage === 'first' ? firstThreshold : repeatThreshold;
      
      if (timeSinceLastActivity >= threshold) {
        setShowInactivityDialog(true);
        setLastActivity(now); // Reset to prevent immediate re-triggering
      }
    };

    // Set up event listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, resetActivity, true);
    });

    // Check for inactivity every minute
    const inactivityInterval = setInterval(checkInactivity, 60000);
    inactivityTimerRef.current = inactivityInterval;

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity, true);
      });
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [currentSession, lastActivity, inactivityStage]);

  // Format time display
  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (description.trim()) {
      onStartSession(description.trim());
      setDescription('');
      setInactivityStage('first');
    }
  };

  const handleStop = async () => {
    if (currentSession) {
      const endedSession = {
        ...currentSession,
        end: new Date(),
        duration: Date.now() - currentSession.start.getTime()
      };

      // Try to save to cloud first, fallback to offline storage
      if (isOnline && user) {
        try {
          await supabase
            .from('focus_sessions')
            .insert({
              user_id: user.id,
              description: endedSession.description,
              start_time: endedSession.start.toISOString(),
              end_time: endedSession.end.toISOString(),
              duration: endedSession.duration,
            });
        } catch (error) {
          saveSessionOffline(endedSession);
        }
      } else {
        saveSessionOffline(endedSession);
      }
    }
    onEndSession();
  };

  const handleInactivityContinue = () => {
    setShowInactivityDialog(false);
    setInactivityStage('repeat'); // Next prompts will be every 30 minutes
    setLastActivity(Date.now());
  };

  const handleInactivityEnd = () => {
    setShowInactivityDialog(false);
    handleStop();
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold">Ready to Focus?</h3>
            <p className="text-foreground-secondary">
              Start a focused work session and track your productivity
            </p>
            <div className="flex items-center justify-center space-x-2 text-sm">
              {isOnline ? (
                <><Wifi className="h-4 w-4 text-success" /><span className="text-success">Online</span></>
              ) : (
                <><WifiOff className="h-4 w-4 text-warning" /><span className="text-warning">Offline</span></>
              )}
            </div>
          </div>

          <Card className="glass-effect border-border/50 overflow-hidden">
            <CardContent className="p-8 space-y-8">
              {!currentSession ? (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="What are you working on?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleStart();
                        }
                      }}
                      className="text-center text-lg"
                    />
                    <Button 
                      onClick={handleStart}
                      disabled={!description.trim()}
                      size="lg"
                      className="w-full min-h-[60px] text-lg"
                    >
                      <Play className="w-6 h-6 mr-3" />
                      Start Focus Session
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium text-foreground-secondary">
                      Currently working on
                    </h4>
                    <h3 className="text-2xl font-semibold">{currentSession.description}</h3>
                  </div>

                  <div className="timer-display">
                    {formatTime(elapsedTime)}
                  </div>

                  <Button 
                    onClick={handleStop}
                    variant="destructive"
                    size="lg"
                    className="min-w-[120px]"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    End Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Focus Tips */}
          <div className="max-w-2xl mx-auto">
            <Card className="glass-effect border-border/50">
              <CardContent className="p-6">
                <h4 className="font-semibold mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-primary" />
                  Focus Tips
                </h4>
                <div className="text-sm text-foreground-secondary space-y-2 text-left">
                  <p>• Metric will check if you're still active after 45 minutes</p>
                  <p>• If inactive, you'll get a 5-minute warning to continue or end</p>
                  <p>• After the first check, you'll be prompted every 30 minutes</p>
                  <p>• Works offline - sessions sync automatically when online</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <InactivityDialog
        isOpen={showInactivityDialog}
        onContinue={handleInactivityContinue}
        onEnd={handleInactivityEnd}
        timeoutDuration={300} // 5 minutes
      />
    </>
  );
};