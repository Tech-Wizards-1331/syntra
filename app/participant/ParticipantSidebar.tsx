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
  Sparkles,
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

  // Determine if this is a focused, distraction-free page (e.g. checkout or pass screen)
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
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/40 backdrop-blur-md border-r border-slate-800/60 h-screen sticky top-0 z-30 flex-shrink-0 select-none">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800/40 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-slate-950 font-black text-lg tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none mb-1">Syntra</h1>
            <p className="text-[9px] text-teal-400 font-semibold tracking-wider uppercase">Participant Console</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-400 border-l-2 border-teal-500"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-300 ${
                    active ? "text-teal-400 scale-110" : "text-slate-400 group-hover:scale-110 group-hover:text-slate-200"
                  }`} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500 text-slate-950 animate-glow-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-800/40 bg-slate-950/20 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
              {getInitials(userName)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{userName}</p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 justify-center px-4 py-2.5 rounded-xl border border-slate-800/60 bg-slate-900/40 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 text-xs font-bold text-slate-400 transition-all duration-300 cursor-pointer group/btn"
          >
            <LogOut className="w-3.5 h-3.5 group-hover/btn:rotate-12 transition-transform" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── MOBILE HEADER & DRAWER ─── */}
      <header className="lg:hidden w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-5 py-4 flex items-center justify-between sticky top-0 z-30">
        <Link href="/participant/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-md shadow-teal-500/15">
            <span className="text-slate-950 font-black text-base">S</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none mb-0.5">Syntra</h1>
            <p className="text-[8px] text-teal-400 font-semibold tracking-wider uppercase">Participant</p>
          </div>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-white"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsOpen(false)}>
          <div
            className="w-64 bg-slate-950 border-r border-slate-800 h-full flex flex-col animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header in Drawer */}
            <div className="p-5 border-b border-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center">
                  <span className="text-slate-950 font-black text-base">S</span>
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">Syntra</h1>
                  <p className="text-[8px] text-teal-400 font-semibold uppercase">Participant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
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
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-400 border-l-2 border-teal-500"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="flex items-center justify-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-500 text-slate-950">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Profile & Logout in Drawer */}
            <div className="p-4 border-t border-slate-800/40 bg-slate-900/20 flex flex-col gap-3">
              <div className="flex items-center gap-3 px-1">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-bold text-xs">
                  {getInitials(userName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{userName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{userEmail}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 justify-center px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:text-red-400 text-xs font-bold text-slate-400 cursor-pointer"
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
