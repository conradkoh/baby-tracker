'use client';

import Link from 'next/link';
import { User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export interface AccountCardProps {
  userName: string;
}

/**
 * Displays the authenticated user's account information.
 * Shown at the top of the Settings page.
 */
export function AccountCard({ userName }: AccountCardProps) {
  return (
    <Card className="mb-6">
      <CardHeader className="px-4 pt-4 pb-3 sm:px-6 sm:pt-6">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <User className="h-5 w-5" />
          Account
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 space-y-3">
        <div className="space-y-0.5">
          <Label className="text-sm text-muted-foreground">Name</Label>
          <p className="text-foreground font-medium">{userName}</p>
        </div>
        <Link href="/app/profile">
          <Button variant="outline" size="sm">
            Manage Profile
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
