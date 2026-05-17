'use client';

import Link from 'next/link';
import {
  Baby,
  Milk,
  Stethoscope,
  Smartphone,
  ClipboardList,
  Users,
  Apple,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ── Feature definitions ────────────────────────────────────────

const FEATURES = [
  {
    icon: Milk,
    title: 'Feed Tracking',
    description:
      'Log latch duration, bottle volumes, and solids with ease. Track feeding patterns over time.',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    icon: Baby,
    title: 'Diaper Changes',
    description:
      'Record wet, dirty, and mixed diaper changes. Spot trends at a glance.',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    icon: Stethoscope,
    title: 'Medical Logs',
    description:
      'Track temperatures and medicine doses. Keep a complete health record for your little one.',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/20',
  },
  {
    icon: ClipboardList,
    title: 'Organised Activity List',
    description:
      'View all activities grouped by date, with quick summaries and easy navigation.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
  },
  {
    icon: Users,
    title: 'Family Sharing',
    description:
      'Invite partners and caregivers. Everyone stays in sync with shared activity feeds.',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
  },
  {
    icon: Smartphone,
    title: 'Mobile & PWA Ready',
    description:
      'Install as a Progressive Web App for a native-like experience on any device.',
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/20',
  },
];

// ── Page Component ──────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center px-4 py-20 sm:py-28">
        <div className="max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5">
            <Baby className="h-4 w-4 text-rose-500" />
            <span className="text-xs font-medium text-muted-foreground">
              New parent? We&apos;ve got you covered.
            </span>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-foreground">
            Baby Tracker
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The simple, stress-free way to track your baby&apos;s feeds, diaper changes, and
            medical records. Built for parents who want to spend less time logging and more time
            bonding.
          </p>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Button asChild size="lg">
              <Link href="/app">Get Started Free</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/app">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
              Everything you need
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Purpose-built features to make baby tracking simple, fast, and actually enjoyable.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, description, color, bg }) => (
              <Card key={title} className="border-border">
                <CardContent className="flex flex-col items-start gap-3 p-6">
                  <div className={`rounded-xl p-2.5 ${bg}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Download Section ─────────────────────────────────── */}
      <section className="px-4 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h2 className="text-2xl font-bold sm:text-3xl text-foreground">
              Try it now
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Available as a Progressive Web App — works on any device, no download required.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button variant="outline" size="lg" className="gap-2 min-w-[200px]" disabled>
              <Apple className="h-5 w-5" />
              App Store (Coming Soon)
            </Button>
            <Button variant="outline" size="lg" className="gap-2 min-w-[200px]" disabled>
              <Play className="h-5 w-5" />
              Google Play (Coming Soon)
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Also available as a{' '}
            <Link href="/app" className="underline underline-offset-2 hover:text-foreground transition-colors">
              Progressive Web App
            </Link>
            {' '}— no download required.
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border px-4 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Baby className="h-4 w-4" />
            <span>Baby Tracker</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/app" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <Link href="/app/settings" className="hover:text-foreground transition-colors">
              Settings
            </Link>
            <Link href="/app/profile" className="hover:text-foreground transition-colors">
              Profile
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
