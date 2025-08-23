import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Coffee } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface InactivityDialogProps {
  isOpen: boolean;
  onContinue: () => void;
  onEnd: () => void;
  timeoutDuration?: number; // in seconds
}

export const InactivityDialog: React.FC<InactivityDialogProps> = ({
  isOpen,
  onContinue,
  onEnd,
  timeoutDuration = 300, // 5 minutes default
}) => {
  const [timeLeft, setTimeLeft] = useState(timeoutDuration);

  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(timeoutDuration);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onEnd, timeoutDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressValue = ((timeoutDuration - timeLeft) / timeoutDuration) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span>Still there?</span>
          </DialogTitle>
          <DialogDescription>
            You've been inactive for a while. Are you still working on your focus session?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <Coffee className="h-12 w-12 text-primary mx-auto mb-4" />
            <p className="text-2xl font-mono font-bold text-primary">
              {formatTime(timeLeft)}
            </p>
            <p className="text-sm text-foreground-secondary mt-2">
              Session will end automatically if no response
            </p>
          </div>
          
          <Progress value={progressValue} className="w-full" />
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onContinue} className="flex-1">
              Continue Session
            </Button>
            <Button onClick={onEnd} variant="outline" className="flex-1">
              End Session
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};