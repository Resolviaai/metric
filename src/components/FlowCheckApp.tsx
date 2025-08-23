import React, { useState, useEffect } from 'react';
import { Timer } from './Timer';
import { Analytics } from './Analytics';
import { Header } from './Header';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Load user sessions
  useEffect(() => {
    const loadSessions = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('focus_sessions')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(50);

        if (error) throw error;

        const formattedSessions = data.map(session => ({
          id: session.id,
          description: session.description,
          start: new Date(session.start_time),
          end: session.end_time ? new Date(session.end_time) : undefined,
          duration: session.duration
        }));

        setSessions(formattedSessions);
      } catch (error) {
        console.error('Error loading sessions:', error);
        toast({
          title: "Error",
          description: "Failed to load your sessions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [user, toast]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-surface flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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