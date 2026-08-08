"use client";

import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Save,
  Calendar,
  Trash2,
  Plus,
  Building,
  Layers,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/whatsapp";
import { HolidayDoc, ALL_CLASSES } from "@/types";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Settings State
  const [instituteName, setInstituteName] = useState("SK Tutorials");
  const [teacherName, setTeacherName] = useState("Prof. Fahim Sir");

  const [batch1Name, setBatch1Name] = useState("5–7");
  const [batch1Timing, setBatch1Timing] = useState("5:00 PM – 7:00 PM");
  const [batch1Classes, setBatch1Classes] = useState<string[]>([
    "Jr.Kg",
    "Sr.Kg",
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
  ]);

  const [batch2Name, setBatch2Name] = useState("7–9");
  const [batch2Timing, setBatch2Timing] = useState("7:00 PM – 9:00 PM");
  const [batch2Classes, setBatch2Classes] = useState<string[]>(["Class 9", "Class 10"]);

  const [attendanceThreshold, setAttendanceThreshold] = useState(75);
  const [consecutiveAbsenceThreshold, setConsecutiveAbsenceThreshold] = useState(3);
  const [whatsappTemplate, setWhatsappTemplate] = useState(DEFAULT_WHATSAPP_TEMPLATE);

  // Holidays State
  const [holidays, setHolidays] = useState<HolidayDoc[]>([]);
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [newHolidayBatch, setNewHolidayBatch] = useState<"ALL" | "5-7" | "7-9">("ALL");
  const [newHolidayReason, setNewHolidayReason] = useState<"Holiday" | "Vacation" | "Personal" | "Other">("Holiday");
  const [newHolidayDesc, setNewHolidayDesc] = useState("");
  const [addingHoliday, setAddingHoliday] = useState(false);

  // Fetch current settings & holidays
  const fetchSettingsAndHolidays = async () => {
    try {
      setLoading(true);
      const [setRes, holRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/holidays"),
      ]);

      const setData = await setRes.json();
      const holData = await holRes.json();

      if (setRes.ok) {
        setInstituteName(setData.instituteName || "SK Tutorials");
        setTeacherName(setData.teacherName || "Prof. Fahim Sir");

        setBatch1Name(setData.batch1Name || "5–7");
        setBatch1Timing(setData.batch1Timing || "5:00 PM – 7:00 PM");
        setBatch1Classes(
          setData.batch1Classes || [
            "Jr.Kg",
            "Sr.Kg",
            "Class 1",
            "Class 2",
            "Class 3",
            "Class 4",
            "Class 5",
            "Class 6",
            "Class 7",
            "Class 8",
          ]
        );

        setBatch2Name(setData.batch2Name || "7–9");
        setBatch2Timing(setData.batch2Timing || "7:00 PM – 9:00 PM");
        setBatch2Classes(setData.batch2Classes || ["Class 9", "Class 10"]);

        setAttendanceThreshold(setData.attendanceThreshold || 75);
        setConsecutiveAbsenceThreshold(setData.consecutiveAbsenceThreshold || 3);
        setWhatsappTemplate(setData.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE);
      }

      if (holRes.ok) {
        setHolidays(holData);
      }
    } catch (err) {
      console.error("Fetch settings error:", err);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndHolidays();
  }, []);

  // Toggle class assignment between Batch 1 (5-7) and Batch 2 (7-9)
  const toggleClassBatch = (className: string, targetBatch: "5-7" | "7-9") => {
    if (targetBatch === "5-7") {
      if (batch1Classes.includes(className)) {
        setBatch1Classes(batch1Classes.filter((c) => c !== className));
      } else {
        setBatch1Classes([...batch1Classes, className]);
        setBatch2Classes(batch2Classes.filter((c) => c !== className));
      }
    } else {
      if (batch2Classes.includes(className)) {
        setBatch2Classes(batch2Classes.filter((c) => c !== className));
      } else {
        setBatch2Classes([...batch2Classes, className]);
        setBatch1Classes(batch1Classes.filter((c) => c !== className));
      }
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instituteName,
          teacherName,
          batch1Name,
          batch1Timing,
          batch1Classes,
          batch2Name,
          batch2Timing,
          batch2Classes,
          attendanceThreshold: Number(attendanceThreshold),
          consecutiveAbsenceThreshold: Number(consecutiveAbsenceThreshold),
          whatsappTemplate,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save settings");

      toast.success("System preferences and Class-to-Batch mapping updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSavingSettings(false);
    }
  };

  // Add Holiday
  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolidayDate) {
      toast.error("Please select a date for the holiday");
      return;
    }

    try {
      setAddingHoliday(true);
      const res = await fetch("/api/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: newHolidayDate,
          batch: newHolidayBatch,
          reason: newHolidayReason,
          description: newHolidayDesc,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add holiday");

      toast.success(`Holiday added for ${newHolidayDate}`);
      setNewHolidayDate("");
      setNewHolidayDesc("");
      fetchSettingsAndHolidays();
    } catch (err: any) {
      toast.error(err.message || "Failed to add holiday");
    } finally {
      setAddingHoliday(false);
    }
  };

  // Delete Holiday
  const handleDeleteHoliday = async (id?: string, date?: string) => {
    try {
      const url = id ? `/api/holidays?id=${id}` : `/api/holidays?date=${date}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete holiday");

      toast.success("Holiday removed");
      fetchSettingsAndHolidays();
    } catch (err: any) {
      toast.error("Failed to remove holiday");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-64 bg-card border border-border rounded-3xl" />
        <div className="h-64 bg-card border border-border rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-card border border-border p-5 rounded-3xl shadow-soft">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Settings & Class Batch Mapping</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Assign classes to batches (Jr.Kg to Class 10) • Configure thresholds & WhatsApp templates
          </p>
        </div>
      </div>

      {/* CLASS-TO-BATCH MAPPING MANAGER */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-lg font-black text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Automatic Class to Batch Assignment</span>
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
              Students in these classes will automatically appear in their assigned tuition batch
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {ALL_CLASSES.map((cls) => {
            const isBatch1 = batch1Classes.includes(cls);
            const isBatch2 = batch2Classes.includes(cls);

            return (
              <div
                key={cls}
                className="p-3.5 rounded-2xl border border-border bg-muted/30 flex flex-col justify-between gap-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-foreground">{cls}</span>
                  {isBatch1 ? (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-black">
                      5–7 Batch
                    </span>
                  ) : isBatch2 ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-black">
                      7–9 Batch
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 text-[10px] font-bold">
                      Unassigned
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleClassBatch(cls, "5-7")}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                      isBatch1
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    5–7 Batch
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleClassBatch(cls, "7-9")}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                      isBatch2
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    7–9 Batch
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SYSTEM CONFIGURATION FORM */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-6">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Building className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>General System Preferences</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
          {/* Institute Name */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-bold uppercase text-[10px]">Institute Name</label>
            <input
              type="text"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/60 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Teacher Name */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-bold uppercase text-[10px]">Teacher Name</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-muted/60 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Batch 1 Config */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-bold uppercase text-[10px]">Batch 1 Name & Timing</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={batch1Name}
                onChange={(e) => setBatch1Name(e.target.value)}
                placeholder="5–7"
                className="w-1/3 px-3.5 py-2.5 bg-muted/60 border border-border rounded-2xl"
              />
              <input
                type="text"
                value={batch1Timing}
                onChange={(e) => setBatch1Timing(e.target.value)}
                placeholder="5:00 PM – 7:00 PM"
                className="w-2/3 px-3.5 py-2.5 bg-muted/60 border border-border rounded-2xl"
              />
            </div>
          </div>

          {/* Batch 2 Config */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-bold uppercase text-[10px]">Batch 2 Name & Timing</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={batch2Name}
                onChange={(e) => setBatch2Name(e.target.value)}
                placeholder="7–9"
                className="w-1/3 px-3.5 py-2.5 bg-muted/60 border border-border rounded-2xl"
              />
              <input
                type="text"
                value={batch2Timing}
                onChange={(e) => setBatch2Timing(e.target.value)}
                placeholder="7:00 PM – 9:00 PM"
                className="w-2/3 px-3.5 py-2.5 bg-muted/60 border border-border rounded-2xl"
              />
            </div>
          </div>

          {/* Low Attendance Threshold */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-bold uppercase text-[10px]">Low Attendance Threshold (%)</label>
            <input
              type="number"
              value={attendanceThreshold}
              onChange={(e) => setAttendanceThreshold(Number(e.target.value))}
              min="1"
              max="100"
              className="w-full px-3.5 py-2.5 bg-muted/60 border border-border rounded-2xl"
            />
          </div>

          {/* Consecutive Absence Threshold */}
          <div className="space-y-1.5">
            <label className="text-muted-foreground font-bold uppercase text-[10px]">Consecutive Absence Alert Threshold</label>
            <input
              type="number"
              value={consecutiveAbsenceThreshold}
              onChange={(e) => setConsecutiveAbsenceThreshold(Number(e.target.value))}
              min="1"
              max="20"
              className="w-full px-3.5 py-2.5 bg-muted/60 border border-border rounded-2xl"
            />
          </div>
        </div>

        {/* WHATSAPP MESSAGE TEMPLATE EDITOR */}
        <div className="space-y-2 pt-2 text-xs font-semibold">
          <label className="text-muted-foreground font-bold uppercase text-[10px] flex items-center justify-between">
            <span>WhatsApp Reminder Message Template</span>
            <span className="text-indigo-600 lowercase font-normal">Use {"{studentName}"} placeholder</span>
          </label>
          <textarea
            rows={5}
            value={whatsappTemplate}
            onChange={(e) => setWhatsappTemplate(e.target.value)}
            className="w-full p-4 bg-muted/60 border border-border rounded-2xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={savingSettings}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{savingSettings ? "Saving Settings..." : "Save Preferences"}</span>
        </button>
      </div>

      {/* HOLIDAY / NO-CLASS MANAGER SECTION */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-6">
        <h2 className="text-lg font-black text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Calendar className="w-5 h-5 text-amber-500" />
          <span>Holiday & No-Class Manager</span>
        </h2>

        {/* Add Holiday Form */}
        <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-bold">
          <div>
            <label className="text-muted-foreground uppercase text-[10px] block mb-1">Select Date</label>
            <input
              type="date"
              value={newHolidayDate}
              onChange={(e) => setNewHolidayDate(e.target.value)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl"
            />
          </div>

          <div>
            <label className="text-muted-foreground uppercase text-[10px] block mb-1">Batch Affected</label>
            <select
              value={newHolidayBatch}
              onChange={(e) => setNewHolidayBatch(e.target.value as any)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl"
            >
              <option value="ALL">All Batches</option>
              <option value="5-7">5–7 Batch Only</option>
              <option value="7-9">7–9 Batch Only</option>
            </select>
          </div>

          <div>
            <label className="text-muted-foreground uppercase text-[10px] block mb-1">Reason Category</label>
            <select
              value={newHolidayReason}
              onChange={(e) => setNewHolidayReason(e.target.value as any)}
              className="w-full px-3 py-2 bg-muted border border-border rounded-xl"
            >
              <option value="Holiday">Holiday</option>
              <option value="Vacation">Vacation</option>
              <option value="Personal">Personal</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={addingHoliday}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-extrabold flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Mark No-Class</span>
            </button>
          </div>
        </form>

        {/* List of Marked Holidays */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-black uppercase text-muted-foreground">Marked No-Class Dates</h3>
          {holidays.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-2xl">
              No holidays or No-Class dates registered.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {holidays.map((hol) => (
                <div
                  key={hol._id || hol.date}
                  className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-extrabold text-foreground">{hol.date}</span>
                    <span className="ml-2 text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-500 text-white uppercase">
                      {hol.reason} ({hol.batch || "ALL"})
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteHoliday(hol._id, hol.date)}
                    className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Delete Holiday"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
