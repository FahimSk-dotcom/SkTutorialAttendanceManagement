"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  CheckCircle2,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Students", href: "/students", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

const LOGO_URL =
  "https://res.cloudinary.com/dfmcngduw/image/upload/v1784896530/86a65215-ce9c-427d-9cc5-f67d0a08040c_gyndgk.png";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card text-card-foreground min-h-screen p-4 transition-all duration-300 shadow-soft z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-4 mb-6">
        <div className="relative w-11 h-11 rounded-2xl overflow-hidden bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
          <Image
            src={LOGO_URL}
            alt="SK Tutorials Logo"
            width={44}
            height={44}
            className="object-cover w-full h-full"
            priority
          />
        </div>
        <div>
          <h1 className="font-extrabold text-lg leading-tight tracking-tight text-foreground">
            SK Tutorials
          </h1>
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="w-3 h-3 inline" /> Attendance App
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-muted-foreground"}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 bg-muted/60 rounded-2xl border border-border/50 text-center">
        <p className="text-xs text-foreground font-extrabold">Prof. Fahim Sir</p>
        <p className="text-[11px] text-muted-foreground font-medium">Personal Tuition Suite</p>
      </div>
    </aside>
  );
}
