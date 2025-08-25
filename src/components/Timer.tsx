import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Play, Pause, Square, Clock, Wifi, WifiOff, Settings } from 'lucide-react';
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
  const [inactivityInterval, setInactivityInterval] = useState(25); // Default 25 minutes
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const inactivityTimerRef = useRef<NodeJS.Timeout>();
  const { isOnline, saveSessionOffline } = useOfflineSync();
  const { user } = useAuth();

  // Update elapsed time with seconds precision
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

  // Inactivity detection with user-configurable interval
  useEffect(() => {
    if (!currentSession) return;

    const resetActivity = () => {
      setLastActivity(Date.now());
    };

    const checkInactivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      
      // First prompt at user-set interval (default 25 minutes), then every 30 minutes
      const firstThreshold = inactivityInterval * 60 * 1000;
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
    const inactivityCheckInterval = setInterval(checkInactivity, 60000);
    inactivityTimerRef.current = inactivityCheckInterval;

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetActivity, true);
      });
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [currentSession, lastActivity, inactivityStage, inactivityInterval]);

  // Format time display with seconds
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
                      className="w-full py-4 text-lg"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Start Focus Session
                    </Button>
                  </div>
                  
                  {/* Settings Toggle */}
                  <div className="flex items-center justify-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSettings(!showSettings)}
                      className="text-foreground-muted"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Session Settings
                    </Button>
                  </div>

                  {/* Settings Panel */}
                  {showSettings && (
                    <Card className="p-4 bg-muted/50">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Inactivity Check Interval
                          </Label>
                          <Select
                            value={inactivityInterval.toString()}
                            onValueChange={(value) => setInactivityInterval(parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="15">15 minutes</SelectItem>
                              <SelectItem value="25">25 minutes (Default)</SelectItem>
                              <SelectItem value="45">45 minutes</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-foreground-muted">
                            How often to check if you're still active during sessions
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="text-center space-y-4">
                    <div className="w-32 h-32 mx-auto rounded-full border-4 border-primary bg-gradient-primary flex items-center justify-center">
                      <Clock className="w-12 h-12 text-primary-foreground" />
                    </div>
                    
                    <div>
                      <h4 className="text-xl font-semibold mb-2">{currentSession.description}</h4>
                      <div className="text-4xl font-mono font-bold text-primary">
                        {formatTime(elapsedTime)}
                      </div>
                      <p className="text-sm text-foreground-muted mt-2">
                        Session in progress • Started at {currentSession.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={handleStop}
                      className="flex items-center space-x-2"
                      size="lg"
                    >
                      <Square className="w-5 h-5" />
                      <span>End Session</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Section */}
          <Card className="p-6 bg-surface-elevated border-border/50">
            <h4 className="font-semibold mb-3 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-primary" />
              <span>Focus Tips</span>
            </h4>
            <div className="space-y-2 text-sm text-foreground-secondary text-left">
              <p>• <strong>Inactivity Detection:</strong> First check at {inactivityInterval} minutes, then every 30 minutes</p>
              <p>• <strong>Auto-End:</strong> Sessions end automatically if inactive for 5 minutes</p>
              <p>• <strong>Offline Support:</strong> Sessions save locally when offline and sync when reconnected</p>
              <p>• <strong>Precision Tracking:</strong> Time is tracked down to the second for accuracy</p>
            </div>
          </Card>
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