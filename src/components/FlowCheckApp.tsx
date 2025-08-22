import React, { useState, useEffect } from 'react';
import { Timer } from './Timer';
import { Analytics } from './Analytics';
import { Header } from './Header';
import { useToast } from '@/hooks/use-toast';

type Session = {
  id: string;
  description: string;
  start: Date;
  end?: Date;
  duration: number;
};

export const FlowCheckApp = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeView, setActiveView] = useState<'timer' | 'analytics'>('timer');
  const { toast } = useToast();

  // Mock sessions for demonstration
  useEffect(() => {
    const mockSessions: Session[] = [
      {
        id: '1',
        description: 'Deep work session',
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 2 hours
        duration: 2 * 60 * 60 * 1000
      },
      {
        id: '2',
        description: 'Code review',
        start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000), // 90 minutes
        duration: 90 * 60 * 1000
      },
      {
        id: '3',
        description: 'Writing documentation',
        start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000), // 3 hours
        duration: 3 * 60 * 60 * 1000
      },
      {
        id: '4',
        description: 'Learning session',
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 75 * 60 * 1000), // 75 minutes
        duration: 75 * 60 * 1000
      },
      {
        id: '5',
        description: 'Project planning',
        start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 minutes
        duration: 45 * 60 * 1000
      }
    ];
    setSessions(mockSessions);
  }, []);

  const handleStartSession = (description: string) => {
    const newSession: Session = {
      id: Date.now().toString(),
      description,
      start: new Date(),
      duration: 0
    };
    setCurrentSession(newSession);
    toast({
      title: "Focus session started",
      description: `Started "${description}" - Stay focused!`,
    });
  };

  const handleEndSession = () => {
    if (currentSession) {
      const endedSession: Session = {
        ...currentSession,
        end: new Date(),
        duration: Date.now() - currentSession.start.getTime()
      };
      
      setSessions(prev => [endedSession, ...prev]);
      setCurrentSession(null);
      
      const durationMinutes = Math.round(endedSession.duration / (1000 * 60));
      toast({
        title: "Session completed!",
        description: `Great work! You focused for ${durationMinutes} minutes.`,
      });
    }
  };

  const handleInactivityPrompt = () => {
    toast({
      title: "Still there?",
      description: "You've been inactive for a while. Are you still focusing?",
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Header 
        activeView={activeView} 
        onViewChange={setActiveView}
        currentSession={currentSession}
      />
      
      <main className="pt-20">
        {activeView === 'timer' ? (
          <Timer
            currentSession={currentSession}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onInactivityPrompt={handleInactivityPrompt}
          />
        ) : (
          <Analytics sessions={sessions} />
        )}
      </main>
    </div>
  );
};