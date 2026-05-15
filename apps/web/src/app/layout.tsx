import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import ConvexClientProvider from './ConvexClientProvider';
import DeviceSyncWrapper from './DeviceSyncWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Baby Tracker',
  description: 'Track your baby activities',
};

const navItems = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/feed/create', label: 'Feed', icon: '🍼' },
  { href: '/diaper-change/create', label: 'Diaper', icon: '💩' },
  { href: '/medical', label: 'Medical', icon: '💊' },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <ConvexClientProvider>
          <DeviceSyncWrapper>
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
              <div className="max-w-lg mx-auto flex justify-around items-center h-16">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex flex-col items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>
            </nav>
            <main className="pb-20 max-w-lg mx-auto">{children}</main>
          </DeviceSyncWrapper>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
