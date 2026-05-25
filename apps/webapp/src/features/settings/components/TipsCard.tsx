'use client';

import { Lightbulb } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';

interface TipsCardProps {
  vitaminDTipEnabled: boolean;
  onToggleVitaminDTip: (next: boolean) => void;
  disabled?: boolean;
}

export function TipsCard({ vitaminDTipEnabled, onToggleVitaminDTip, disabled }: TipsCardProps) {
  return (
    <Card>
      <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Lightbulb className="h-5 w-5" />
          Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Vitamin D reminder</p>
            <p className="text-xs text-muted-foreground">
              Show a daily tip on the dashboard when all feeds are breast milk
            </p>
          </div>
          <Switch
            checked={vitaminDTipEnabled}
            onCheckedChange={onToggleVitaminDTip}
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
