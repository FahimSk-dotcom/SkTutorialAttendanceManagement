"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MessageSquare,
  AlertCircle,
  Save,
  Edit3,
  Search,
  Check,
  X,
  Layers,
  ListOrdered,
  Users,
  Grid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { getKolkataToday } from "@/lib/date";
import { Student, BatchType, AttendanceStatus, AbsenteeInfo, ALL_CLASSES } from "@/types";

function AttendanceContent() {
  const searchParams = useSearchParams();
  const initialBatch = (searchParams.get("batch") as BatchType) || "5-7";

  const [activeTab, setActiveTab] = useState<"take" | "absentees" | "history">("take");
  const [selectedBatch, setSelectedBatch] = useState<BatchType>(initialBatch);
  const [selectedDate, setSelectedDate] = useState<string>(getKolkataToday());

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [groupByClass, setGroupByClass] = useState<boolean>(true);

  // Status checks
  const [isAlreadyMarked, setIsAlreadyMarked] = useState<boolean>(false);
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [holidayReason, setHolidayReason] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(false);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Absentees tab data
  const [absenteesList, setAbsenteesList] = useState<AbsenteeInfo[]>([]);

  // History tab data
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historySearch, setHistorySearch] = useState<string>("");

  // Fetch active students for selected batch
  const fetchBatchData = async () => {
    try {
      setLoading(true);
      const checkRes = await fetch(
        `/api/attendance/check?date=${selectedDate}&batch=${selectedBatch}`
      );
      const checkData = await checkRes.json();

      setIsHoliday(checkData.isHoliday || false);
      setHolidayReason(checkData.holidayReason || "");
      setIsAlreadyMarked(checkData.isMarked || false);

      // Fetch active students for batch
      const studentsRes = await fetch(`/api/students?batch=${selectedBatch}&status=Active`);
      const studentsData: Student[] = await studentsRes.json();

      // Sort students systematically: Class order -> Name alphabetically
      const sortedStudents = [...studentsData].sort((a, b) => {
        const classIndexA = ALL_CLASSES.indexOf(a.class as any);
        const classIndexB = ALL_CLASSES.indexOf(b.class as any);

        if (classIndexA !== classIndexB) {
          return (classIndexA === -1 ? 99 : classIndexA) - (classIndexB === -1 ? 99 : classIndexB);
        }
        return a.name.localeCompare(b.name);
      });

      setStudents(sortedStudents);

      // Initialize state: Everyone PRESENT by default
      const initialState: Record<string, AttendanceStatus> = {};

      if (checkData.isMarked && checkData.records) {
        checkData.records.forEach((rec: any) => {
          initialState[rec.studentId] = rec.status;
        });
      } else {
        sortedStudents.forEach((st: Student) => {
          initialState[st.studentId] = "present";
        });
      }

      setAttendanceState(initialState);
    } catch (err) {
      console.error("Fetch batch error:", err);
      toast.error("Failed to load student batch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatchData();
  }, [selectedBatch, selectedDate]);

  // Fetch Today's Absentees
  const fetchAbsentees = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (res.ok) {
        setAbsenteesList(json.todaysAbsentees || []);
      }
    } catch (err) {
      console.error("Fetch absentees error:", err);
    }
  };

  // Fetch History
  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/attendance?batch=${selectedBatch}`);
      const json = await res.json();
      if (res.ok) {
        setHistoryRecords(json);
      }
    } catch (err) {
      console.error("Fetch history error:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "absentees") fetchAbsentees();
    if (activeTab === "history") fetchHistory();
  }, [activeTab, selectedBatch]);

  // Toggle student status
  const toggleStudentStatus = (studentId: string) => {
    setAttendanceState((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  // Mark All Present / Mark All Absent
  const setAllStatus = (status: AttendanceStatus) => {
    const nextState: Record<string, AttendanceStatus> = {};
    students.forEach((st) => {
      nextState[st.studentId] = status;
    });
    setAttendanceState(nextState);
  };

  // Filter students by search query
  const filteredStudents = students.filter((st) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      st.name.toLowerCase().includes(q) ||
      st.studentId.toLowerCase().includes(q) ||
      st.class.toLowerCase().includes(q) ||
      st.parentName.toLowerCase().includes(q)
    );
  });

  // Group students by Class
  const groupedByClass = filteredStudents.reduce((acc, st) => {
    const cls = st.class || "Other";
    if (!acc[cls]) acc[cls] = [];
    acc[cls].push(st);
    return acc;
  }, {} as Record<string, Student[]>);

  // Counters
  const totalCount = students.length;
  const presentCount = students.filter((st) => attendanceState[st.studentId] === "present").length;
  const absentCount = students.filter((st) => attendanceState[st.studentId] === "absent").length;
  const absentStudentsList = students.filter((st) => attendanceState[st.studentId] === "absent");

  // Save attendance
  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      const recordsPayload = students.map((st) => ({
        studentId: st.studentId,
        status: attendanceState[st.studentId] || "present",
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          batch: selectedBatch,
          records: recordsPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save attendance");

      toast.success(
        `Attendance saved for ${selectedBatch} Batch (${presentCount} Present, ${absentCount} Absent)`
      );
      setShowConfirmModal(false);
      setIsEditMode(false);
      setIsAlreadyMarked(true);
      fetchBatchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      {/* Header Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-1.5 bg-muted/70 p-1.5 rounded-2xl border border-border/60">
          <button
            onClick={() => setActiveTab("take")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === "take"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Take Attendance
          </button>

          <button
            onClick={() => setActiveTab("absentees")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all relative ${
              activeTab === "absentees"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Today&apos;s Absentees
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === "history"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* TAB 1: TAKE ATTENDANCE */}
      {activeTab === "take" && (
        <div className="space-y-4">
          {/* Controls Bar: Batch & Date Selectors */}
          <div className="bg-card border border-border rounded-3xl p-4 sm:p-5 shadow-soft space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Batch Selector */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
                  Select Batch
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBatch("5-7")}
                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all border ${
                      selectedBatch === "5-7"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    5–7 Batch (5 PM - 7 PM)
                  </button>

                  <button
                    onClick={() => setSelectedBatch("7-9")}
                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-2xl font-extrabold text-xs transition-all border ${
                      selectedBatch === "7-9"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/30"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    7–9 Batch (7 PM - 9 PM)
                  </button>
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase block mb-1.5">
                  Attendance Date (IST)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    max={getKolkataToday()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3.5 py-2 text-xs font-bold bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                  <button
                    onClick={() => setSelectedDate(getKolkataToday())}
                    className="px-3 py-2 text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-xl hover:bg-indigo-500/20"
                  >
                    Today
                  </button>
                </div>
              </div>
            </div>

            {/* Banner for Holiday or Marked state */}
            {isHoliday && (
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-2">
                <span>🏖️ Today is marked as a Holiday / No-Class ({holidayReason}).</span>
              </div>
            )}

            {isAlreadyMarked && !isEditMode && !isHoliday && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Attendance already marked for today ({selectedBatch} Batch).</span>
                </div>
                <button
                  onClick={() => setIsEditMode(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-bold text-xs shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Attendance</span>
                </button>
              </div>
            )}
          </div>

          {/* Structured Search & Display Options Bar */}
          <div className="bg-card border border-border rounded-3xl p-3 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search student name, ID or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-bold bg-muted/60 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setGroupByClass(!groupByClass)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border ${
                  groupByClass
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-muted text-muted-foreground border-border"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Group by Class</span>
              </button>

              <button
                onClick={() => setAllStatus("present")}
                className="px-3 py-1.5 text-xs font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-xl transition-all"
              >
                All Present
              </button>
              <button
                onClick={() => setAllStatus("absent")}
                className="px-3 py-1.5 text-xs font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-xl transition-all"
              >
                All Absent
              </button>
            </div>
          </div>

          {/* Sticky Live Counter Bar */}
          <div className="sticky top-16 z-20 bg-card/95 backdrop-blur-md border border-border rounded-3xl p-3.5 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs sm:text-sm font-black">
              <span className="text-muted-foreground">
                Total: <strong className="text-foreground">{totalCount}</strong>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                Present: <strong>{presentCount}</strong>
              </span>
              <span className="text-rose-600 dark:text-rose-400">
                Absent: <strong>{absentCount}</strong>
              </span>
            </div>

            <span className="text-[11px] font-extrabold text-muted-foreground">
              {selectedBatch} Batch • {selectedDate}
            </span>
          </div>

          {/* STRUCTURED STUDENT ATTENDANCE LIST */}
          {loading ? (
            <div className="space-y-3 py-4 animate-pulse">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-card border border-border rounded-2xl" />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-card">
              <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-2" />
              <p className="font-extrabold text-base text-foreground">
                No active students found for Batch {selectedBatch}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Verify search query or class batch assignments in Settings.
              </p>
            </div>
          ) : groupByClass ? (
            /* GROUPED BY CLASS STRUCTURED LAYOUT */
            <div className="space-y-6">
              {Object.entries(groupedByClass).map(([className, classStudents]) => (
                <div key={className} className="space-y-2">
                  <div className="flex items-center justify-between px-2 py-1 bg-muted/60 border border-border/70 rounded-2xl">
                    <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                      {className} ({classStudents.length} Students)
                    </span>
                    <span className="text-[11px] font-extrabold text-muted-foreground">
                      {classStudents.filter((st) => attendanceState[st.studentId] === "present").length}{" "}
                      Present
                    </span>
                  </div>

                  <div className="divide-y divide-border/60 bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
                    {classStudents.map((student, index) => {
                      const status = attendanceState[student.studentId] || "present";
                      const isPresent = status === "present";

                      return (
                        <div
                          key={student.studentId}
                          onClick={() => {
                            if (!isAlreadyMarked || isEditMode) {
                              toggleStudentStatus(student.studentId);
                            }
                          }}
                          className={`p-3.5 sm:p-4 flex items-center justify-between transition-all cursor-pointer select-none active:scale-[0.99] ${
                            isPresent
                              ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                              : "bg-rose-500/15 hover:bg-rose-500/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                              #{index + 1}
                            </span>

                            <div
                              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-white transition-all shadow-xs ${
                                isPresent ? "bg-emerald-500" : "bg-rose-600 scale-105"
                              }`}
                            >
                              {isPresent ? (
                                <Check className="w-5 h-5 stroke-[3]" />
                              ) : (
                                <X className="w-5 h-5 stroke-[3]" />
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-black text-sm sm:text-base text-foreground">
                                  {student.name}
                                </h3>
                                <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-extrabold text-muted-foreground border border-border">
                                  {student.studentId}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                                Parent: {student.parentName} ({student.parentMobile || "N/A"})
                              </p>
                            </div>
                          </div>

                          <div>
                            {isPresent ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-xs">
                                🟢 PRESENT
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-rose-600 text-white font-black text-xs shadow-xs animate-pulse">
                                🔴 ABSENT
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* FLAT STRUCTURED TABLE LIST LAYOUT */
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft divide-y divide-border">
              {filteredStudents.map((student, index) => {
                const status = attendanceState[student.studentId] || "present";
                const isPresent = status === "present";

                return (
                  <div
                    key={student.studentId}
                    onClick={() => {
                      if (!isAlreadyMarked || isEditMode) {
                        toggleStudentStatus(student.studentId);
                      }
                    }}
                    className={`p-3.5 sm:p-4 flex items-center justify-between transition-all cursor-pointer select-none active:scale-[0.99] ${
                      isPresent
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                        : "bg-rose-500/15 hover:bg-rose-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-xs font-bold text-muted-foreground">
                        #{index + 1}
                      </span>

                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-white transition-all shadow-xs ${
                          isPresent ? "bg-emerald-500" : "bg-rose-600 scale-105"
                        }`}
                      >
                        {isPresent ? (
                          <Check className="w-5 h-5 stroke-[3]" />
                        ) : (
                          <X className="w-5 h-5 stroke-[3]" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-sm sm:text-base text-foreground">
                            {student.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 font-extrabold text-[10px]">
                            {student.class}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            ({student.studentId})
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                          Parent: {student.parentName} ({student.parentMobile || "N/A"})
                        </p>
                      </div>
                    </div>

                    <div>
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-emerald-500 text-white font-black text-xs shadow-xs">
                          🟢 PRESENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-rose-600 text-white font-black text-xs shadow-xs animate-pulse">
                          🔴 ABSENT
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Sticky Bottom Save Button */}
          {students.length > 0 && (!isAlreadyMarked || isEditMode) && (
            <div className="fixed bottom-14 md:bottom-6 left-0 right-0 z-30 p-4 bg-gradient-to-t from-background via-background/90 to-transparent flex justify-center">
              <button
                onClick={() => setShowConfirmModal(true)}
                className="w-full max-w-lg py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-3xl font-black text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Save className="w-5 h-5" />
                <span>SAVE ATTENDANCE ({selectedBatch} BATCH)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TODAY'S ABSENTEES */}
      {activeTab === "absentees" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-foreground">Today&apos;s Absentees List</h2>
            <span className="px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full text-xs font-black">
              {absenteesList.length} Total Absent
            </span>
          </div>

          {absenteesList.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-card">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-extrabold text-base text-foreground">No absent students today!</p>
              <p className="text-xs text-muted-foreground mt-1">All students are present.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {absenteesList.map((abs, index) => (
                <div
                  key={abs.studentId}
                  className="p-4 rounded-3xl border border-rose-500/30 bg-card shadow-soft space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="px-2.5 py-0.5 rounded-lg bg-rose-500 text-white text-[10px] font-black uppercase">
                        🔴 {abs.batch} BATCH
                      </span>
                      <h3 className="font-black text-base text-foreground mt-1">
                        #{index + 1}. {abs.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {abs.studentId} • {abs.class}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-xs text-muted-foreground font-semibold">
                      Parent: {abs.parentName} ({abs.contactMobile || "No Mobile"})
                    </span>

                    <div className="flex items-center gap-2">
                      {abs.telLink ? (
                        <a
                          href={abs.telLink}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Call</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground font-semibold">No Phone</span>
                      )}

                      {abs.whatsappUrl ? (
                        <a
                          href={abs.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs"
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
      )}

      {/* TAB 3: ATTENDANCE HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-foreground">Attendance Logs History</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter by date..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-muted border border-border rounded-xl"
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-soft">
            <div className="divide-y divide-border">
              {historyRecords.length === 0 ? (
                <p className="text-xs text-muted-foreground p-6 text-center">
                  No attendance history recorded yet.
                </p>
              ) : (
                historyRecords.map((rec) => (
                  <div key={rec._id} className="p-4 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-extrabold text-sm text-foreground">{rec.date}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 font-bold">
                        {rec.batch} Batch
                      </span>
                      <p className="text-muted-foreground mt-0.5">Student ID: {rec.studentId}</p>
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
      )}

      {/* SAVE CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-black text-lg text-foreground">Confirm Attendance Submission</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-muted/60 font-bold">
                <span>Batch: {selectedBatch} Batch</span>
                <span>Date: {selectedDate}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 font-black">
                <div>Total: {totalCount}</div>
                <div className="text-emerald-600 dark:text-emerald-400">Present: {presentCount}</div>
                <div className="text-rose-600 dark:text-rose-400">Absent: {absentCount}</div>
              </div>

              {absentStudentsList.length > 0 ? (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-2">
                  <span className="font-black text-rose-600 dark:text-rose-400 block uppercase">
                    Absent Students ({absentStudentsList.length}):
                  </span>
                  <ul className="space-y-1 pl-2">
                    {absentStudentsList.map((st, i) => (
                      <li key={st.studentId} className="font-bold text-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 inline-block" />
                        <span>#{i + 1}. {st.name} ({st.class} • {st.studentId})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-center">
                  🎉 Everyone is Present!
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-2xl bg-muted text-muted-foreground font-bold text-xs hover:bg-muted/80"
              >
                Go Back
              </button>
              <button
                onClick={handleSaveAttendance}
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md disabled:opacity-50"
              >
                {saving ? "Saving..." : "Confirm Attendance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center font-bold">Loading Attendance Module...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
