"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Compass,
  Trophy,
  Mail,
  User,
  QrCode,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  userName: string;
  userEmail: string;
  pendingInvitesCount: number;
  activePass: {
    hackathonId: number;
    hackathonName: string;
  } | null;
}

export default function ParticipantSidebar({
  userName,
  userEmail,
  pendingInvitesCount,
  activePass,
}: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Determine if this is a focused, distraction-free page
  const isFocusedPage =
    pathname.includes("/checkout/") || pathname.includes("/pass");

  if (isFocusedPage) {
    return null; // Render nothing so the page can use the full viewport width
  }

  const navItems = [
    {
      name: "Dashboard",
      href: "/participant/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Browse Hackathons",
      href: "/participant/hackathons",
      icon: Compass,
    },
    {
      name: "My Registrations",
      href: "/participant/registrations",
      icon: Trophy,
    },
    {
      name: "Inbox & Invites",
      href: "/participant/inbox",
      icon: Mail,
      badge: pendingInvitesCount > 0 ? pendingInvitesCount : undefined,
    },
    {
      name: "Profile Settings",
      href: "/participant/profile",
      icon: User,
    },
  ];

  // Dynamically inject pass check-in link if they have an active registered team
  if (activePass) {
    navItems.push({
      name: "Check-In Pass",
      href: `/participant/hackathons/${activePass.hackathonId}/pass`,
      icon: QrCode,
    });
  }

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || "?").toUpperCase();
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Helper to check if item is active
  const isActive = (href: string) => {
    if (href === "/participant/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      {/* Spacer to reserve space for fixed sidebar */}
      <div className="hidden lg:block w-64 shrink-0" />
      <aside className="hidden lg:flex flex-col w-64 apple-glass-nav border-r border-black/[0.06] h-screen fixed top-0 left-0 z-30 select-none">
        
        {/* Brand Header */}
        <div className="p-6 border-b border-black/[0.06] flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-tile-black flex items-center justify-center">
            <span className="text-white font-black text-lg tracking-tighter"></span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-ink tracking-tight leading-none mb-1">Syntra</h1>
            <p className="text-[9px] text-primary font-medium tracking-wider uppercase">Participant Console</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-2.5 rounded-md text-[13px] font-medium transition-all duration-200 group ${
                  active
                    ? "bg-primary/5 text-primary border-l-2 border-primary"
                    : "text-ink-muted hover:text-ink hover:bg-black/[0.03]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 transition-transform duration-300 ${
                    active ? "text-primary scale-105" : "text-ink-muted group-hover:scale-105 group-hover:text-ink"
                  }`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex items-center justify-center px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-primary text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-black/[0.06] flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-md bg-tile-black flex items-center justify-center text-white font-bold text-xs">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink truncate leading-tight">{userName}</p>
              <p className="text-[10px] text-ink-muted truncate mt-0.5">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 justify-center px-4 py-2 rounded-md border border-black/[0.12] bg-canvas/50 hover:bg-canvas-pearl hover:text-danger text-xs font-normal text-ink-muted transition-all duration-300 cursor-pointer group/btn apple-press-effect"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MOBILE HEADER & DRAWER ─── */}
      <header className="lg:hidden w-full apple-glass-nav border-b border-black/[0.08] px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <Link href="/participant/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-tile-black flex items-center justify-center">
            <span className="text-white font-black text-base"></span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-ink tracking-tight leading-none mb-0.5">Syntra</h1>
            <p className="text-[8px] text-primary font-medium tracking-wider uppercase">Participant</p>
          </div>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-md bg-canvas border border-black/[0.12] text-ink-muted hover:text-ink"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-tile-black/30 backdrop-blur-sm z-40 transition-opacity animate-backdrop-in" onClick={() => setIsOpen(false)}>
          <div
            className="w-64 bg-canvas border-r border-black/[0.08] h-full flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header in Drawer */}
            <div className="p-5 border-b border-black/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-tile-black flex items-center justify-center">
                  <span className="text-white font-black text-base"></span>
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-ink">Syntra</h1>
                  <p className="text-[8px] text-primary font-medium uppercase">Participant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md bg-canvas border border-black/[0.12] text-ink-muted"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Navigation links in Drawer */}
            <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-md text-[13px] font-medium transition-all ${
                      active
                        ? "bg-primary/5 text-primary border-l-2 border-primary"
                        : "text-ink-muted hover:text-ink hover:bg-black/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="flex items-center justify-center px-2 py-0.5 rounded-pill text-[9px] font-semibold bg-primary text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Profile & Logout in Drawer */}
            <div className="p-4 border-t border-black/[0.06] bg-canvas-parchment/30 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-md bg-tile-black flex items-center justify-center text-white font-bold text-xs">
                  {getInitials(userName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-ink truncate leading-tight">{userName}</p>
                  <p className="text-[10px] text-ink-muted truncate mt-0.5">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 justify-center px-4 py-2 rounded-md border border-black/[0.12] bg-canvas hover:bg-canvas-pearl hover:text-danger text-xs font-normal text-ink-muted cursor-pointer apple-press-effect"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
