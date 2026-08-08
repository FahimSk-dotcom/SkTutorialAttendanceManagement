"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  User,
  Phone,
  MessageSquare,
  CalendarCheck,
  Award,
  AlertTriangle,
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { Student } from "@/types";
import { getContactMobile, generateTelLink } from "@/lib/phone";
import { generateWhatsAppLink } from "@/lib/whatsapp";
import { getDaysInMonth, formatKolkataShortDate } from "@/lib/date";

export default function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [studentData, setStudentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMonth, setViewMonth] = useState<number>(new Date().getMonth() + 1);
  const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/students/${id}`);
      const json = await res.json();
      if (res.ok) {
        setStudentData(json);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-44 bg-card border border-border rounded-3xl" />
        <div className="h-64 bg-card border border-border rounded-3xl" />
      </div>
    );
  }

  if (!studentData || !studentData.student) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-card">
        <p className="font-extrabold text-base text-foreground">Student profile not found</p>
        <Link href="/students" className="text-xs text-indigo-600 font-bold hover:underline mt-2 inline-block">
          ← Back to Students
        </Link>
      </div>
    );
  }

  const { student, summary, attendanceRecords = [] }: { student: Student; summary: any; attendanceRecords: any[] } =
    studentData;

  const contactMobile = getContactMobile(student);
  const telLink = generateTelLink(contactMobile);
  const waUrl = generateWhatsAppLink(contactMobile, student.name);

  // Calendar matrix calculation for viewMonth & viewYear
  const monthDays = getDaysInMonth(viewYear, viewMonth);
  const recordMap = new Map<string, string>();
  attendanceRecords.forEach((rec: any) => {
    recordMap.set(rec.date, rec.status);
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Top Back Navigation */}
      <Link
        href="/students"
        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-muted-foreground hover:text-foreground transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Student Directory</span>
      </Link>

      {/* Main Student Info Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-600/30">
              {student.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-foreground">{student.name}</h1>
                <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black">
                  Batch {student.batch || "Unassigned"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                ID: <strong>{student.studentId}</strong> • Class: <strong>{student.class}</strong> • Status:{" "}
                <strong className={student.status === "Active" ? "text-emerald-600" : "text-muted-foreground"}>
                  {student.status}
                </strong>
              </p>
            </div>
          </div>

          {/* Direct Action Contact Buttons */}
          <div className="flex items-center gap-2">
            {telLink && (
              <a
                href={telLink}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>Call Parent</span>
              </a>
            )}

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Parent</span>
              </a>
            )}
          </div>
        </div>

        {/* Parent Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/60 text-xs">
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Parent Name</span>
            <span className="font-extrabold text-foreground">{student.parentName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Parent Mobile</span>
            <span className="font-extrabold text-foreground">{student.parentMobile}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Alternate Mobile</span>
            <span className="font-extrabold text-foreground">{student.alternateMobile || "None"}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-[10px] uppercase font-bold">Admission Date</span>
            <span className="font-extrabold text-foreground">{student.admissionDate || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* ATTENDANCE SUMMARY STATS & STREAK BADGES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Overall Percentage */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
          <span className="text-xs font-bold text-muted-foreground uppercase">Overall Attendance</span>
          <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {summary.percentage}%
          </div>
          <p className="text-[11px] text-muted-foreground font-medium mt-1">
            {summary.presentCount} Present / {summary.totalConducted} Conducted
          </p>
        </div>

        {/* Current Month Percentage */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
          <span className="text-xs font-bold text-muted-foreground uppercase">This Month Rate</span>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {summary.currentMonthPercentage}%
          </div>
          <p className="text-[11px] text-muted-foreground font-medium mt-1">
            {summary.currentMonthPresent} Present / {summary.currentMonthConducted} Conducted
          </p>
        </div>

        {/* Total Absences */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
          <span className="text-xs font-bold text-muted-foreground uppercase">Total Absences</span>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {summary.absentCount}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium mt-1">Total missed classes</p>
        </div>

        {/* Streak Badge */}
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft">
          <span className="text-xs font-bold text-muted-foreground uppercase">Current Streak</span>
          <div className="mt-1">
            {summary.consecutiveAbsences > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3 py-1 rounded-2xl border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" /> {summary.consecutiveAbsences} Consecutive Absences
              </span>
            ) : summary.consecutivePresence > 0 ? (
              <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-2xl border border-emerald-500/20">
                <Sparkles className="w-4 h-4" /> 🔥 {summary.consecutivePresence} Present Streak
              </span>
            ) : (
              <span className="text-xs font-bold text-muted-foreground">No recent streak</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground font-medium mt-1">Consecutive trend</p>
        </div>
      </div>

      {/* INTERACTIVE ATTENDANCE CALENDAR VIEW */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Attendance Calendar View</span>
          </h2>

          <div className="flex items-center gap-2">
            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(parseInt(e.target.value))}
              className="px-3 py-1.5 text-xs font-bold bg-muted border border-border rounded-xl"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1, 1).toLocaleString("en-IN", { month: "long" })}
                </option>
              ))}
            </select>

            <select
              value={viewYear}
              onChange={(e) => setViewYear(parseInt(e.target.value))}
              className="px-3 py-1.5 text-xs font-bold bg-muted border border-border rounded-xl"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Legend Bar */}
        <div className="flex items-center gap-4 text-xs font-extrabold pt-1">
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Present
          </span>
          <span className="flex items-center gap-1 text-rose-600">
            <span className="w-3 h-3 rounded-full bg-rose-600 inline-block" /> Absent
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <span className="w-3 h-3 rounded-full bg-muted border border-border inline-block" /> No Class
          </span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 pt-2 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-[10px] font-black uppercase text-muted-foreground py-1">
              {day}
            </div>
          ))}

          {monthDays.map((dStr) => {
            const status = recordMap.get(dStr);
            const dayNum = parseInt(dStr.split("-")[2], 10);

            return (
              <div
                key={dStr}
                className={`p-2.5 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center border ${
                  status === "present"
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                    : status === "absent"
                    ? "bg-rose-600 text-white border-rose-700 shadow-xs"
                    : "bg-muted/40 text-muted-foreground border-border/50"
                }`}
                title={`${dStr}: ${status || "No class"}`}
              >
                <span>{dayNum}</span>
                {status && (
                  <span className="text-[9px] uppercase font-extrabold mt-0.5">
                    {status === "present" ? "P" : "A"}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL ATTENDANCE HISTORY LOG TABLE */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
        <h2 className="text-lg font-black text-foreground">Complete Attendance Logs</h2>

        <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden">
          {attendanceRecords.length === 0 ? (
            <p className="text-xs text-muted-foreground p-6 text-center">
              No attendance logs recorded for this student yet.
            </p>
          ) : (
            attendanceRecords.map((rec: any) => (
              <div key={rec._id} className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-foreground">{formatKolkataShortDate(rec.date)}</span>
                  <span className="ml-2 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 font-bold">
                    {rec.batch} Batch
                  </span>
                </div>

                <div>
                  {rec.status === "present" ? (
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 font-black">
                      🟢 Present
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 font-black">
                      🔴 Absent
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
