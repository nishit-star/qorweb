'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCustomer } from '@/hooks/useAutumnCustomer';
import { UserAvatar } from '@/components/ui/user-avatar';

// Separate component that only renders when Autumn is available
function UserCredits() {
  const { customer } = useCustomer();
  const messageUsage = customer?.features?.messages;
  const remainingMessages = messageUsage ? (messageUsage.balance || 0) : 0;

  return (
    <div className="flex items-center text-sm font-medium text-gray-700">
      <span>{remainingMessages}</span>
      <span className="ml-1">credits</span>
    </div>
  );
}

export function Navbar() {
  const { data: session, isPending } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      // Small delay to ensure the session is cleared
      setTimeout(() => {
        router.refresh();
        setIsLoggingOut(false);
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                // Navigate to Brand Monitor and reset its state
                // Using a distinct path with hash so the page mounts the BrandMonitor and can reset internally
                router.push('/#brand');
                // Force a refresh to ensure any lingering state clears
                router.refresh();
              }}
              className="flex items-center focus:outline-none"
            >
              <Image
                src="/firecrawl-logo-with-fire.png"
                alt="AutoReach"
                width={120}
                height={25}
                priority
              />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {session && (
              <>
                


              </>
            )}
            <Link
              href="/plans"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Plans
            </Link>
            {session && (
              <UserCredits />
            )}
            {isPending ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : session ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="View Profile"
                >
                  <UserAvatar size="sm" />
                  <span className="text-sm font-medium text-gray-700">Profile</span>
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="btn-firecrawl-default inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 h-8 px-3"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="btn-firecrawl-orange inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 h-8 px-3"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="btn-firecrawl-orange inline-flex items-center justify-center whitespace-nowrap rounded-[10px] text-sm font-medium transition-all duration-200 h-8 px-3"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
