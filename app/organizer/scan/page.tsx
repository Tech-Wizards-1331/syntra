import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ScannerClient from "./ScannerClient";
import {
  ScanLine,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "@/auth";

interface ScanPageProps {
  searchParams: Promise<{ hackathonId?: string; categoryId?: string }>;
}

export default async function ScanPage({ searchParams }: ScanPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userId = Number(session.user.id);
  const role = session.user.role;

  // Authorization check: must be organizer or coordinator
  const isOrganizer = role === "organizer";
  let isCoordinator = false;

  if (!isOrganizer) {
    const coord = await prisma.organizer_hackathoncoordinator.findFirst({
      where: { user_id: userId, is_active: true },
    });
    isCoordinator = !!coord;
  }

  if (!isOrganizer && !isCoordinator) {
    redirect("/participant/dashboard");
  }

  const params = await searchParams;
  const hackathonId = params.hackathonId ? Number(params.hackathonId) : null;
  const categoryId = params.categoryId ? Number(params.categoryId) : null;

  // If parameters are provided, validate them
  let selectedHackathon: { id: number; name: string } | null = null;
  let selectedCategory: { id: number; name: string } | null = null;

  if (hackathonId && categoryId) {
    // Verify the user has access to this hackathon
    const hackathon = await prisma.organizer_hackathon.findUnique({
      where: { id: hackathonId },
      include: { organizer_organizerprofile: true },
    });

    if (hackathon) {
      const isOwner = hackathon.organizer_organizerprofile.user_id === userId;
      const isHackathonCoord = await prisma.organizer_hackathoncoordinator.findFirst({
        where: { hackathon_id: hackathonId, user_id: userId, is_active: true },
      });

      if (isOwner || isHackathonCoord) {
        selectedHackathon = { id: hackathon.id, name: hackathon.name };

        const category = await prisma.organizer_scancategory.findUnique({
          where: { id: categoryId },
        });
        if (category && category.hackathon_id === hackathonId && category.is_active) {
          selectedCategory = { id: category.id, name: category.name };
        }
      }
    }
  }

  // Get all accessible hackathons for the selector
  let hackathons: {
    id: number;
    name: string;
    status: string;
    scanCategories: { id: number; name: string }[];
  }[] = [];

  if (!selectedHackathon || !selectedCategory) {
    if (isOrganizer) {
      const profile = await prisma.organizer_organizerprofile.findUnique({
        where: { user_id: userId },
      });

      const ownedHackathons = profile
        ? await prisma.organizer_hackathon.findMany({
            where: { organizer_id: profile.id },
            include: {
              organizer_scancategory: {
                where: { is_active: true },
                orderBy: { display_order: "asc" },
              },
            },
            orderBy: { created_at: "desc" },
          })
        : [];

      const coordHackathons = await prisma.organizer_hackathoncoordinator.findMany({
        where: { user_id: userId, is_active: true },
        include: {
          organizer_hackathon: {
            include: {
              organizer_scancategory: {
                where: { is_active: true },
                orderBy: { display_order: "asc" },
              },
            },
          },
        },
      });

      const allIds = new Set<number>();
      hackathons = [];

      for (const h of ownedHackathons) {
        if (!allIds.has(h.id)) {
          allIds.add(h.id);
          hackathons.push({
            id: h.id,
            name: h.name,
            status: h.status,
            scanCategories: h.organizer_scancategory.map((sc) => ({ id: sc.id, name: sc.name })),
          });
        }
      }

      for (const c of coordHackathons) {
        if (!allIds.has(c.organizer_hackathon.id)) {
          allIds.add(c.organizer_hackathon.id);
          hackathons.push({
            id: c.organizer_hackathon.id,
            name: c.organizer_hackathon.name,
            status: c.organizer_hackathon.status,
            scanCategories: c.organizer_hackathon.organizer_scancategory.map((sc) => ({
              id: sc.id,
              name: sc.name,
            })),
          });
        }
      }
    } else {
      // Coordinator only
      const coordinations = await prisma.organizer_hackathoncoordinator.findMany({
        where: { user_id: userId, is_active: true },
        include: {
          organizer_hackathon: {
            include: {
              organizer_scancategory: {
                where: { is_active: true },
                orderBy: { display_order: "asc" },
              },
            },
          },
        },
      });

      hackathons = coordinations.map((c) => ({
        id: c.organizer_hackathon.id,
        name: c.organizer_hackathon.name,
        status: c.organizer_hackathon.status,
        scanCategories: c.organizer_hackathon.organizer_scancategory.map((sc) => ({
          id: sc.id,
          name: sc.name,
        })),
      }));
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative w-full max-w-5xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <ScanLine className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">QR Scanner</h1>
            <p className="text-[10px] text-teal-400 font-medium tracking-widest uppercase">
              Attendance Console
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/organizer/dashboard"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 transition duration-300 flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 hover:text-red-400 transition duration-300 flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 max-w-5xl mx-auto w-full px-6 py-10 z-10">
        <ScannerClient
          preSelectedHackathon={selectedHackathon}
          preSelectedCategory={selectedCategory}
          hackathons={hackathons}
        />
      </main>
    </div>
  );
}
