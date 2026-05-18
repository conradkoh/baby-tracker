'use client';

import { Play, Square, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { useBreastTimer, formatElapsed } from '@/hooks/useBreastTimer';

export interface BreastTimerProps {
  /** Called when a timer side is stopped. Provides seconds for left and right. */
  onUpdate: (result: { left: number; right: number }) => void;
}

/**
 * Two-side breast timer with start/stop/reset controls.
 * Calls onUpdate with elapsed seconds for both sides when either side stops.
 */
export function BreastTimer({ onUpdate }: BreastTimerProps) {
  const timer = useBreastTimer();

  const handleToggle = (side: 'left' | 'right') => {
    const wasActive = side === 'left' ? timer.left.isActive : timer.right.isActive;
    const elapsedLeft = timer.left.elapsedMs;
    const elapsedRight = timer.right.elapsedMs;

    timer.toggle(side);

    if (wasActive) {
      onUpdate({
        left: Math.floor(elapsedLeft / 1000),
        right: Math.floor(elapsedRight / 1000),
      });
    }
  };

  return (
    <div className="space-y-2">
      {/* Timer displays */}
      <div className="flex gap-3">
        {/* Left */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Left
          </p>
          <p className="text-2xl font-mono font-medium text-foreground tabular-nums">
            {formatElapsed(timer.left.elapsedMs)}
          </p>
          <Button
            variant={timer.left.isActive ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handleToggle('left')}
            className="w-full"
          >
            {timer.left.isActive ? (
              <>
                <Square className="h-3.5 w-3.5 mr-1.5" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Start
              </>
            )}
          </Button>
        </div>

        {/* Right */}
        <div className="flex-1 flex flex-col items-center gap-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Right
          </p>
          <p className="text-2xl font-mono font-medium text-foreground tabular-nums">
            {formatElapsed(timer.right.elapsedMs)}
          </p>
          <Button
            variant={timer.right.isActive ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => handleToggle('right')}
            className="w-full"
          >
            {timer.right.isActive ? (
              <>
                <Square className="h-3.5 w-3.5 mr-1.5" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reset */}
      {timer.hasActivity && (
        <Button
          variant="ghost"
          size="sm"
          onClick={timer.reset}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Reset timer
        </Button>
      )}
    </div>
  );
}
