import React, { useState, useEffect } from 'react';
import { Play, Pause, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionTimerProps {
  onStart?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  autoStart?: boolean;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({
  onStart,
  onPause,
  onStop,
  autoStart = false
}) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTime(time => time + 1);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    onStart?.();
  };

  const handlePause = () => {
    setIsRunning(false);
    onPause?.();
  };

  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
    onStop?.();
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
      <div className="flex items-center space-x-4">
        <div className="text-2xl font-mono font-bold text-foreground">
          {formatTime(time)}
        </div>
        <div className="text-sm text-muted-foreground">
          Temps de séance
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {!isRunning ?(
          <Button onClick={handleStart} size="sm" variant="default">
            <Play className="h-4 w-4 mr-1" />
            {time === 0 ?'Démarrer' : 'Reprendre'}
          </Button>
        ) : (
          <Button onClick={handlePause} size="sm" variant="outline">
            <Pause className="h-4 w-4 mr-1" />
            Pause
          </Button>
        )}
        
        {time > 0 && (
          <Button onClick={handleStop} size="sm" variant="destructive">
            <Square className="h-4 w-4 mr-1" />
            Arrêter
          </Button>
        )}
      </div>
    </div>
  );
};