'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Milk, Baby, Stethoscope, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/app',                    icon: Home,         label: 'Home'    },
  { href: '/app/feed/create',        icon: Milk,         label: 'Feed'    },
  { href: '/app/diaper-change/create', icon: Baby,       label: 'Diaper'  },
  { href: '/app/medical/create',     icon: Stethoscope,  label: 'Medical' },
  { href: '/app/settings',           icon: Settings,     label: 'Settings'},
] as const;

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border">
      <div className="flex items-stretch h-16 max-w-2xl mx-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === '/app' ? pathname === '/app' : pathname.startsWith(href.replace('/create', ''));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center flex-1 gap-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
