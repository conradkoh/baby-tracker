'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Milk, ChevronLeft, MoreVertical, Trash2 } from 'lucide-react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';
import { Id } from '@workspace/backend/convex/_generated/dataModel';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthState } from '@/modules/auth/AuthProvider';
import { toSeconds, toMinutesSeconds, toLocalDatetimeString, toTimestamp } from '@/lib/activity-form-utils';

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

export default function FeedEditPage() {
  const router = useRouter();
  const params = useParams();
  const authState = useAuthState();
  const isAuthenticated = authState?.state === 'authenticated';

  const activityId = params?.activityId as Id<'activities'> | undefined;

  const result = useSessionQuery(
    api.web.babyTracker.activities.getById,
    activityId ? { activityId } : 'skip'
  );

  const activity = result?.status === 'found'
    ? (result.data as Record<string, unknown>)
    : undefined;
  const isNotFound = result?.status === 'not_found';

  const updateActivity = useSessionMutation(api.web.babyTracker.activities.update);
  const deleteActivity = useSessionMutation(api.web.babyTracker.activities.deleteActivity);

  // Form state
  const [feedType, setFeedType] = useState<FeedType>('latch');
  const [datetime, setDatetime] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Latch fields
  const [leftMin, setLeftMin] = useState('');
  const [leftSec, setLeftSec] = useState('');
  const [rightMin, setRightMin] = useState('');
  const [rightSec, setRightSec] = useState('');

  // Bottle fields
  const [volumeMl, setVolumeMl] = useState('');

  // Solids fields
  const [description, setDescription] = useState('');

  // Action states
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pre-populate form when activity loads
  useEffect(() => {
    if (!activity || initialized) return;

    const feed = activity.feed as Record<string, unknown> | undefined;
    const feedSubType = feed?.type as string;
    const ts = activity.timestamp;

    setFeedType((feedSubType as FeedType) || 'latch');
    setDatetime(ts ? toLocalDatetimeString(ts) : '');

    if (feedSubType === 'latch') {
      const duration = feed?.duration as Record<string, { seconds: number }> | undefined;
      const l = toMinutesSeconds(duration?.left?.seconds ?? 0);
      const r = toMinutesSeconds(duration?.right?.seconds ?? 0);
      setLeftMin(String(l.min));
      setLeftSec(String(l.sec));
      setRightMin(String(r.min));
      setRightSec(String(r.sec));
    } else if (
      feedSubType === 'expressed' ||
      feedSubType === 'formula' ||
      feedSubType === 'water'
    ) {
      const volume = feed?.volume as { ml: number } | undefined;
      setVolumeMl(String(volume?.ml ?? ''));
    } else if (feedSubType === 'solids') {
      setDescription((feed?.description as string) ?? '');
    }

    setInitialized(true);
  }, [activity, initialized]);

  // Unauthenticated guard — must be after all hooks
  if (!isAuthenticated) {
    return null;
  }

  // 404 — activity not found
  if (isNotFound) {
    return (
      <div className="container mx-auto px-4 pt-8 max-w-xl flex flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground">Activity not found.</p>
        <Button variant="outline" onClick={() => router.push('/app')}>
          Go to Home
        </Button>
      </div>
    );
  }

  // Loading state
  if (!initialized) {
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
          <h1 className="text-xl font-bold">Edit Feed</h1>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <p className="text-center text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  // ── Handlers ─────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const timestamp = toTimestamp(datetime);

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

      await updateActivity({
        activityId,
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteActivity({ activityId } as any);
      router.push('/app');
    } finally {
      setDeleting(false);
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
        <h1 className="text-xl font-bold">Edit Feed</h1>
        <div className="ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More options">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
                className="h-11 w-auto max-w-full"
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
