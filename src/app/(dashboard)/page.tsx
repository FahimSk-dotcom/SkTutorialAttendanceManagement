"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Users,
  AlertTriangle,
  Clock,
  Phone,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Award,
} from "lucide-react";
import { AbsenteeInfo, BatchStats } from "@/types";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (res.ok) {
        setData(json);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-32 bg-card border border-border rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-44 bg-card border border-border rounded-3xl" />
          <div className="h-44 bg-card border border-border rounded-3xl" />
        </div>
        <div className="h-64 bg-card border border-border rounded-3xl" />
      </div>
    );
  }

  const {
    formattedDate,
    greeting,
    teacherName,
    instituteName,
    stats57,
    stats79,
    todaysAbsentees = [],
    consecutiveAbsenceAlerts = [],
    lowAttendanceAlerts = [],
  }: {
    formattedDate: string;
    greeting: string;
    teacherName: string;
    instituteName: string;
    stats57: BatchStats;
    stats79: BatchStats;
    todaysAbsentees: AbsenteeInfo[];
    consecutiveAbsenceAlerts: any[];
    lowAttendanceAlerts: any[];
  } = data || {};

  return (
    <div className="space-y-6 pb-6">
      {/* Top Banner Greeting */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-900 text-white p-6 sm:p-7 rounded-3xl shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md mb-2">
              <Clock className="w-3.5 h-3.5" />
              {formattedDate || "Today"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {greeting}, {teacherName}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100/90 mt-1 font-medium">
              {instituteName} — Attendance Overview & Today&apos;s Records
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/attendance"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-700 hover:bg-indigo-50 font-extrabold text-sm rounded-2xl shadow-lg transition-all active:scale-95 w-full sm:w-auto"
            >
              <CalendarCheck className="w-5 h-5" />
              <span>Take Attendance</span>
            </Link>

            <button
              onClick={fetchDashboardData}
              className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all active:scale-95"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/attendance"
          className="p-4 rounded-3xl bg-card border border-border shadow-soft hover:border-indigo-500/50 transition-all flex flex-col items-center text-center group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-all">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-sm text-foreground">Take Attendance</span>
          <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Primary Action</span>
        </Link>

        <a
          href="#absentees"
          className="p-4 rounded-3xl bg-card border border-border shadow-soft hover:border-rose-500/50 transition-all flex flex-col items-center text-center group"
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-all">
            <AlertCircle className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-sm text-foreground">Today&apos;s Absentees</span>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-0.5">
            {todaysAbsentees.length} Absent Today
          </span>
        </a>

        <Link
          href="/students"
          className="p-4 rounded-3xl bg-card border border-border shadow-soft hover:border-emerald-500/50 transition-all flex flex-col items-center text-center group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-all">
            <Users className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-sm text-foreground">Students</span>
          <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Manage Batches</span>
        </Link>

        <Link
          href="/reports"
          className="p-4 rounded-3xl bg-card border border-border shadow-soft hover:border-indigo-500/50 transition-all flex flex-col items-center text-center group"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-all">
            <TrendingUp className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-sm text-foreground">Reports</span>
          <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Analytics & Export</span>
        </Link>
      </div>

      {/* Batch Cards: Batch 5-7 and Batch 7-9 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Batch 5-7 Card */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-soft space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Batch 1
              </span>
              <h2 className="text-xl font-black text-foreground">
                {stats57?.batchName || "5–7 Batch"}
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                {stats57?.batchTiming || "5:00 PM – 7:00 PM"}
              </p>
            </div>

            {stats57?.isHoliday ? (
              <span className="px-3 py-1.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold border border-amber-500/20">
                🏖️ {stats57.holidayReason || "Holiday"}
              </span>
            ) : stats57?.status === "Completed" ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> Marked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold border border-amber-500/20">
                <Clock className="w-4 h-4" /> Pending
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 text-center bg-muted/40 p-3 rounded-2xl border border-border/60">
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
                Total
              </span>
              <span className="text-lg font-black text-foreground">
                {stats57?.totalStudents || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block uppercase">
                Present
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {stats57?.present || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block uppercase">
                Absent
              </span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                {stats57?.absent || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block uppercase">
                Rate
              </span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {stats57?.attendancePercentage || 0}%
              </span>
            </div>
          </div>

          <Link
            href={`/attendance?batch=5-7`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>
              {stats57?.status === "Completed" ? "Edit 5–7 Attendance" : "Take 5–7 Attendance"}
            </span>
          </Link>
        </div>

        {/* Batch 7-9 Card */}
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-soft space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Batch 2
              </span>
              <h2 className="text-xl font-black text-foreground">
                {stats79?.batchName || "7–9 Batch"}
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                {stats79?.batchTiming || "7:00 PM – 9:00 PM"}
              </p>
            </div>

            {stats79?.isHoliday ? (
              <span className="px-3 py-1.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold border border-amber-500/20">
                🏖️ {stats79.holidayReason || "Holiday"}
              </span>
            ) : stats79?.status === "Completed" ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" /> Marked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-extrabold border border-amber-500/20">
                <Clock className="w-4 h-4" /> Pending
              </span>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 text-center bg-muted/40 p-3 rounded-2xl border border-border/60">
            <div>
              <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
                Total
              </span>
              <span className="text-lg font-black text-foreground">
                {stats79?.totalStudents || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block uppercase">
                Present
              </span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {stats79?.present || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block uppercase">
                Absent
              </span>
              <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                {stats79?.absent || 0}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold block uppercase">
                Rate
              </span>
              <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {stats79?.attendancePercentage || 0}%
              </span>
            </div>
          </div>

          <Link
            href={`/attendance?batch=7-9`}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            <CalendarCheck className="w-4 h-4" />
            <span>
              {stats79?.status === "Completed" ? "Edit 7–9 Attendance" : "Take 7–9 Attendance"}
            </span>
          </Link>
        </div>
      </div>

      {/* TODAY'S ABSENTEES SECTION */}
      <div id="absentees" className="bg-card border border-border rounded-3xl p-5 sm:p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black flex items-center gap-2 text-foreground">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <span>Today&apos;s Absentees</span>
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Instant Phone Call & WhatsApp Reminders to Parents
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-extrabold border border-rose-500/20">
            {todaysAbsentees.length} Absent Today
          </span>
        </div>

        {todaysAbsentees.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-border rounded-2xl bg-muted/20">
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              🎉 100% Attendance Recorded!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              No students absent today or attendance is pending.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaysAbsentees.map((abs) => (
              <div
                key={abs.studentId}
                className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-all space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider mb-1">
                      🔴 ABSENT ({abs.batch} Batch)
                    </span>
                    <h3 className="font-extrabold text-sm text-foreground">{abs.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {abs.studentId} • {abs.class}
                    </p>
                  </div>
                  {abs.consecutiveAbsences >= 2 && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                      {abs.consecutiveAbsences}x Consecutive
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-rose-500/15">
                  <span className="text-[11px] text-muted-foreground font-semibold">
                    Parent: {abs.parentName || "Parent"}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Call Button */}
                    {abs.telLink ? (
                      <a
                        href={abs.telLink}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95"
                        title="Call Parent"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    ) : (
                      <button
                        disabled
                        className="px-2.5 py-1.5 bg-muted text-muted-foreground rounded-xl text-xs font-semibold cursor-not-allowed opacity-60"
                        title="No contact number available"
                      >
                        No Phone
                      </button>
                    )}

                    {/* WhatsApp Button */}
                    {abs.whatsappUrl ? (
                      <a
                        href={abs.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95"
                        title="Open WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONSECUTIVE ABSENCE & LOW ATTENDANCE ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Consecutive Absence Alert Widget */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
              <span>Consecutive Absence Alerts (≥3 Classes)</span>
            </h2>
            <Link
              href="/reports?tab=consecutive"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All
            </Link>
          </div>

          {consecutiveAbsenceAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No students with 3+ consecutive absences. Excellent!
            </p>
          ) : (
            <div className="space-y-2">
              {consecutiveAbsenceAlerts.slice(0, 4).map((item: any) => (
                <div
                  key={item.student.studentId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20"
                >
                  <div>
                    <p className="font-bold text-xs text-foreground">{item.student.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.student.studentId} • Class {item.student.class} ({item.student.batch || "5-7"})
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[11px] font-extrabold">
                      ⚠️ {item.consecutiveAbsences} Absences
                    </span>
                    {item.whatsappUrl && (
                      <a
                        href={item.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                        title="WhatsApp Parent"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Attendance Alert Widget (<75%) */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-sm flex items-center gap-2">
              <Award className="w-4.5 h-4.5 text-rose-500" />
              <span>Low Attendance Students (&lt;75%)</span>
            </h2>
            <Link
              href="/reports?tab=low"
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All
            </Link>
          </div>

          {lowAttendanceAlerts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              All students have healthy attendance above threshold.
            </p>
          ) : (
            <div className="space-y-2">
              {lowAttendanceAlerts.slice(0, 4).map((item: any) => (
                <div
                  key={item.student.studentId}
                  className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/5 border border-rose-500/20"
                >
                  <div>
                    <p className="font-bold text-xs text-foreground">{item.student.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.student.studentId} • Class {item.student.class}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-black">
                      {item.percentage}% Rate
                    </span>
                    {item.whatsappUrl && (
                      <a
                        href={item.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                        title="WhatsApp Parent"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
