'use client';

import { Bell, Sun, Moon, BookOpen, ChevronDown, Search, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { SessionSwitcher } from './SessionSwitcher';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export function Header() {
  const [darkMode, setDarkMode] = useState(false);
  const { user, logout } = useAuth();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <header className="flex h-12 items-center justify-between bg-emerald-600 backdrop-blur-md px-6 border-b border-emerald-500/50 sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative max-w-md w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-white transition-colors group-focus-within:text-emerald-200 group-hover:text-white" />
          </div>
          <input
            type="search"
            placeholder="Search documents..."
            className="h-8 w-full rounded-xl border border-emerald-400/30 bg-emerald-700/50 pl-10 pr-12 text-xs text-white placeholder:text-emerald-200 transition-all focus:bg-emerald-600/70 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 opacity-40 group-focus-within:opacity-100 transition-opacity pointer-events-none">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-slate-950 px-1.5 font-mono text-[10px] font-bold text-slate-400">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Academic Session context switcher */}
        <div className="hidden lg:flex items-center">
          <SessionSwitcher />
        </div>

        <div className="flex items-center gap-2 px-1.5 py-0.5 bg-emerald-700/50 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
          {/* Dark Mode Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-8 w-8 rounded-xl hover:bg-white/20 hover:text-white transition-all active:scale-90 border border-transparent hover:border-white/20"
            title={darkMode ? 'Switch to Light' : 'Switch to Dark'}
          >
            {darkMode ? (
              <Sun className="h-4 w-4 text-amber-400 fill-amber-400/20" />
            ) : (
              <Moon className="h-4 w-4 text-white fill-white/20" />
            )}
          </Button>
          <div className="w-px h-3 bg-white/10" />
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8 rounded-xl hover:bg-slate-600/50 transition-all active:scale-90 border border-transparent hover:border-slate-600/30"
            title="Recent Alerts"
          >
            <Bell className="h-4 w-4 text-white" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900"></span>
            </span>
          </Button>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 gap-2.5 pl-1 pr-2 rounded-xl bg-emerald-700/50 hover:bg-emerald-600/70 transition-all border border-emerald-500/30 group backdrop-blur-sm"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-white to-white/80 flex items-center justify-center shadow-lg shadow-white/20 ring-1 ring-white/10 group-hover:scale-105 transition-transform">
                <span className="text-[10px] font-black text-emerald-900 tracking-tighter">
                  {user ? getInitials(user.fullName) : 'UN'}
                </span>
              </div>
              <div className="hidden lg:flex flex-col items-start text-left leading-tight">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  {user?.fullName || 'Administrator'}
                </span>
                <span className="text-[9px] text-white/70 font-bold opacity-90">
                  {user?.role || 'Super Admin'}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-white/70 group-hover:text-white transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-emerald-700/95 backdrop-blur-xl border border-emerald-500/30" align="end">
            <DropdownMenuLabel>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-white via-white/80 to-white flex items-center justify-center">
                  <span className="text-sm font-semibold text-emerald-900">
                    {user ? getInitials(user.fullName) : 'U'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-white">{user?.fullName || 'User'}</p>
                  <p className="text-xs text-white/70">{user?.email || 'No email'}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-sm text-white" asChild>
              <Link href="/settings/profile" className="cursor-pointer w-full flex items-center">
                <User className="mr-2 h-4 w-4 text-white" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm text-white" asChild>
              <Link href="/settings/general" className="cursor-pointer w-full flex items-center">
                <Settings className="mr-2 h-4 w-4 text-white" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-sm text-white" asChild>
              <Link href="/settings/notifications" className="cursor-pointer w-full flex items-center">
                <Bell className="mr-2 h-4 w-4 text-white" />
                <span>Notifications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-sm text-red-500 focus:text-red-400 cursor-pointer"
              onClick={logout}
            >
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

