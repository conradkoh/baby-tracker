'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Milk, ChevronLeft } from 'lucide-react';
import { useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { getDefaultDatetime, toSeconds } from '@/lib/activity-form-utils';

// ── Feed types ──────────────────────────────────────────────────

const FEED_TYPES = ['latch', 'expressed', 'formula', 'water', 'solids'] as const;
type FeedType = (typeof FEED_TYPES)[number];

const FEED_TYPE_LABELS: Record<FeedType, string> = {
  latch: 'Latch',
  expressed: 'Expressed',
  formula: 'Formula',
  water: 'Water',
  solids: 'Solids',
};

// ── Page Component ──────────────────────────────────────────────

export default function FeedCreatePage() {
  const router = useRouter();
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';

  const createActivity = useSessionMutation(api.web.babyTracker.activities.create);

  // Form state
  const [feedType, setFeedType] = useState<FeedType>('latch');
  const [datetime, setDatetime] = useState(getDefaultDatetime());

  // Latch fields
  const [leftMin, setLeftMin] = useState('');
  const [leftSec, setLeftSec] = useState('');
  const [rightMin, setRightMin] = useState('');
  const [rightSec, setRightSec] = useState('');

  // Bottle fields
  const [volumeMl, setVolumeMl] = useState('');

  // Solids fields
  const [description, setDescription] = useState('');

  // Submit state
  const [saving, setSaving] = useState(false);

  // Unauthenticated guard — must be after all hooks
  if (!isAuthenticated) {
    return null;
  }

  /** Build the activity payload and submit. */
  const handleSave = async () => {
    setSaving(true);
    try {
      const timestamp = new Date(datetime).toISOString();

      let feed: Record<string, unknown>;
      switch (feedType) {
        case 'latch':
          feed = {
            type: 'latch',
            duration: {
              left: { seconds: toSeconds(Number(leftMin) || 0, Number(leftSec) || 0) },
              right: { seconds: toSeconds(Number(rightMin) || 0, Number(rightSec) || 0) },
            },
          };
          break;
        case 'expressed':
        case 'formula':
        case 'water':
          feed = {
            type: feedType,
            volume: { ml: Number(volumeMl) || 0 },
          };
          break;
        case 'solids':
          feed = {
            type: 'solids',
            description: description || '',
          };
          break;
        default:
          return;
      }

      await createActivity({
        activity: {
          timestamp,
          type: 'feed',
          feed,
        },
      } as any);

      router.push('/app');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 pt-4 pb-8 max-w-xl">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push('/app')}
          className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <Milk className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-xl font-bold">Log Feed</h1>
      </div>

      <div className="flex flex-col gap-3">
        <Card>
          <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-base font-semibold">Feed Type</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
            <Tabs
              value={feedType}
              onValueChange={(v) => setFeedType(v as FeedType)}
            >
              <TabsList className="w-full">
                {FEED_TYPES.map((type) => (
                  <TabsTrigger key={type} value={type} className="flex-1">
                    {FEED_TYPE_LABELS[type]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-base font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-5">
            {/* Latch fields */}
            {feedType === 'latch' && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Left Side (min / sec)</p>
                  <div className="flex gap-3">
                    <div className="space-y-1.5 flex-1">
                      <Label htmlFor="left-min">Min</Label>
                      <Input
                        id="left-min"
                        type="number"
                        min="0"
                        placeholder="0"
                        className="h-11"
                        value={leftMin}
                        onChange={(e) => setLeftMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <Label htmlFor="left-sec">Sec</Label>
                      <Input
                        id="left-sec"
                        type="number"
                        min="0"
                        max="59"
                        placeholder="0"
                        className="h-11"
                        value={leftSec}
                        onChange={(e) => setLeftSec(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Right Side (min / sec)</p>
                  <div className="flex gap-3">
                    <div className="space-y-1.5 flex-1">
                      <Label htmlFor="right-min">Min</Label>
                      <Input
                        id="right-min"
                        type="number"
                        min="0"
                        placeholder="0"
                        className="h-11"
                        value={rightMin}
                        onChange={(e) => setRightMin(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <Label htmlFor="right-sec">Sec</Label>
                      <Input
                        id="right-sec"
                        type="number"
                        min="0"
                        max="59"
                        placeholder="0"
                        className="h-11"
                        value={rightSec}
                        onChange={(e) => setRightSec(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottle/Expressed/Formula/Water fields */}
            {(feedType === 'expressed' || feedType === 'formula' || feedType === 'water') && (
              <div className="space-y-1.5">
                <Label htmlFor="volume">Volume (ml)</Label>
                <Input
                  id="volume"
                  type="number"
                  min="1"
                  placeholder="e.g. 120"
                  className="h-11"
                  value={volumeMl}
                  onChange={(e) => setVolumeMl(e.target.value)}
                />
              </div>
            )}

            {/* Solids fields */}
            {feedType === 'solids' && (
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  type="text"
                  placeholder="e.g. Banana porridge"
                  className="h-11"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}

            {/* DateTime */}
            <div className="space-y-1.5 pt-4 border-t border-border">
              <Label htmlFor="datetime">Date & Time</Label>
              <Input
                id="datetime"
                type="datetime-local"
                className="h-11"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
        <Button variant="ghost" onClick={() => router.push('/app')}>Cancel</Button>
        <Button className="flex-1" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
}
