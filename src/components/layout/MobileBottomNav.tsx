"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Students", href: "/students", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border px-1.5 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2.5 rounded-2xl transition-all duration-200 ${
                isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-muted-foreground"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive ? "bg-indigo-600/10 dark:bg-indigo-500/20 scale-105" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 font-semibold tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
