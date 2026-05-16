'use client';

import { Loader2 } from 'lucide-react';
import { Suspense, useEffect } from 'react';
import { useSessionQuery, useSessionMutation } from 'convex-helpers/react/sessions';
import { api } from '@workspace/backend/convex/_generated/api';

import { AuthErrorBoundary } from '@/modules/auth/AuthErrorBoundary';
import { RequireLogin } from '@/modules/auth/RequireLogin';

/**
 * Loading fallback for Suspense boundary.
 */
function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Family auto-initializer.
 *
 * When an authenticated user has no family, this component silently
 * calls initUser() in the background. While the family is loading or
 * being initialized, a loading fallback is shown.
 *
 * Once a family exists (either pre-existing or newly created),
 * children are rendered.
 */
function FamilyInitializer({ children }: { children: React.ReactNode }) {
  const family = useSessionQuery(api.web.babyTracker.family.get);
  const initUser = useSessionMutation(api.web.babyTracker.family.initUser);

  useEffect(() => {
    // family === null means the query resolved but no family exists
    if (family === null) {
      initUser();
    }
  }, [family, initUser]);

  // family === undefined means still loading
  // family === null means no family yet (initUser is in progress)
  if (family === undefined || family === null) {
    return <LoadingFallback />;
  }

  // family exists — render children
  return <>{children}</>;
}

/**
 * Authenticated application layout.
 *
 * This layout provides a layered authentication system:
 * 1. RequireLogin - Primary auth gate, shows UnauthorizedPage if not logged in
 * 2. AuthErrorBoundary - Catches stale session errors and redirects to login
 * 3. Suspense - Provides loading state while content loads
 * 4. FamilyInitializer - Auto-creates family for new users, shows loading until ready
 *
 * The AuthErrorBoundary handles edge cases where the frontend auth state
 * is stale (says authenticated) but the backend rejects the session.
 * Instead of crashing, users are gracefully redirected to login.
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireLogin>
      <AuthErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <FamilyInitializer>{children}</FamilyInitializer>
        </Suspense>
      </AuthErrorBoundary>
    </RequireLogin>
  );
}
