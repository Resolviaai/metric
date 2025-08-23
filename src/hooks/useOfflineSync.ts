import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Session {
  id: string;
  description: string;
  start: Date;
  end?: Date;
  duration: number;
}

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSessions, setPendingSessions] = useState<Session[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const savedSessions = localStorage.getItem('metric-pending-sessions');
    if (savedSessions) {
      setPendingSessions(JSON.parse(savedSessions));
    }
  }, []);

  useEffect(() => {
    if (isOnline && user && pendingSessions.length > 0) {
      syncPendingSessions();
    }
  }, [isOnline, user, pendingSessions.length]);

  const saveSessionOffline = (session: Session) => {
    const updated = [...pendingSessions, session];
    setPendingSessions(updated);
    localStorage.setItem('metric-pending-sessions', JSON.stringify(updated));
    
    toast({
      title: "Session saved offline",
      description: "Will sync when you're back online.",
    });
  };

  const syncPendingSessions = async () => {
    if (!user || pendingSessions.length === 0) return;

    try {
      for (const session of pendingSessions) {
        await supabase
          .from('focus_sessions')
          .insert({
            user_id: user.id,
            description: session.description,
            start_time: session.start.toISOString(),
            end_time: session.end?.toISOString(),
            duration: session.duration,
          });
      }

      setPendingSessions([]);
      localStorage.removeItem('metric-pending-sessions');
      
      toast({
        title: "Sessions synced",
        description: `${pendingSessions.length} session(s) uploaded to cloud.`,
      });
    } catch (error) {
      console.error('Failed to sync sessions:', error);
      toast({
        title: "Sync failed",
        description: "Sessions remain saved locally.",
        variant: "destructive",
      });
    }
  };

  return {
    isOnline,
    saveSessionOffline,
    pendingSessions: pendingSessions.length,
  };
};