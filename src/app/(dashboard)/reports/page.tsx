"use client";

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  FileText,
  Phone,
  MessageSquare,
  AlertTriangle,
  Award,
  Users,
  Search,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<
    "student" | "batch" | "monthly" | "low" | "consecutive" | "streak"
  >("monthly");

  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [batchFilter, setBatchFilter] = useState<string>("All");

  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<any>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        type: activeTab,
        month: String(month),
        year: String(year),
        batch: batchFilter,
      });

      const res = await fetch(`/api/reports?${query.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setReportData(json);
      }
    } catch (err) {
      console.error("Fetch report error:", err);
      toast.error("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, month, year, batchFilter]);

  // Export to CSV / Excel
  const exportToExcel = () => {
    if (!reportData) return;

    try {
      if (activeTab === "monthly" && reportData.studentRows) {
        const exportRows = reportData.studentRows.map((row: any) => ({
          "Student ID": row.studentId,
          Name: row.name,
          Class: row.class,
          Batch: row.batch,
          "Classes Conducted": row.conducted,
          Present: row.present,
          Absent: row.absent,
          "Attendance %": `${row.percentage}%`,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Attendance");
        XLSX.writeFile(workbook, `SK_Tutorials_Attendance_${year}_${month}.xlsx`);
        toast.success("Excel report exported successfully");
      } else if (reportData.students) {
        const exportRows = reportData.students.map((st: any) => ({
          "Student ID": st.studentId,
          Name: st.name,
          Class: st.class,
          Batch: st.batch,
          Conducted: st.totalConducted,
          Present: st.presentCount,
          Absent: st.absentCount,
          "Attendance %": `${st.percentage}%`,
          "Consecutive Absences": st.consecutiveAbsences,
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Report");
        XLSX.writeFile(workbook, `SK_Tutorials_${activeTab}_report.xlsx`);
        toast.success("Report exported successfully");
      }
    } catch (err) {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 sm:p-6 rounded-3xl shadow-soft">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Attendance Reports & Analytics Suite</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Monthly matrix, batch comparisons, low attendance alerts & CSV/Excel export
          </p>
        </div>

        <button
          onClick={exportToExcel}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1.5 bg-card p-2 rounded-3xl border border-border shadow-soft overflow-x-auto">
        <button
          onClick={() => setActiveTab("monthly")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === "monthly"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Monthly Matrix
        </button>

        <button
          onClick={() => setActiveTab("student")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === "student"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Student Summary
        </button>

        <button
          onClick={() => setActiveTab("batch")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === "batch"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          Batch Comparison
        </button>

        <button
          onClick={() => setActiveTab("low")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === "low"
              ? "bg-rose-600 text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          ⚠️ Low Attendance (&lt;75%)
        </button>

        <button
          onClick={() => setActiveTab("consecutive")}
          className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === "consecutive"
              ? "bg-amber-600 text-white shadow-md"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          🚨 Consecutive Absence (≥3)
        </button>
      </div>

      {/* Filter Options */}
      <div className="bg-card border border-border rounded-3xl p-4 shadow-soft flex flex-wrap items-center gap-3">
        {activeTab === "monthly" && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Month:</span>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold bg-muted border border-border rounded-xl"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {new Date(2026, m - 1, 1).toLocaleString("en-IN", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">Year:</span>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="px-3 py-1.5 text-xs font-bold bg-muted border border-border rounded-xl"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Batch:</span>
          <select
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-bold bg-muted border border-border rounded-xl"
          >
            <option value="All">All Batches</option>
            <option value="5-7">5–7 Batch</option>
            <option value="7-9">7–9 Batch</option>
          </select>
        </div>
      </div>

      {/* REPORT CONTENT VIEWS */}
      {loading ? (
        <div className="h-64 bg-card border border-border rounded-3xl animate-pulse" />
      ) : activeTab === "monthly" && reportData ? (
        /* MONTHLY MATRIX REPORT */
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft space-y-4 overflow-hidden">
          <h2 className="text-lg font-black text-foreground">
            Monthly Attendance Matrix —{" "}
            {new Date(year, month - 1, 1).toLocaleString("en-IN", { month: "long" })} {year}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-black uppercase text-[10px]">
                  <th className="p-3">Student</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3 text-center">Conducted</th>
                  <th className="p-3 text-center text-emerald-600">Present</th>
                  <th className="p-3 text-center text-rose-600">Absent</th>
                  <th className="p-3 text-center">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportData.studentRows?.map((row: any) => (
                  <tr key={row.studentId} className="hover:bg-muted/30 transition-all font-semibold">
                    <td className="p-3 font-bold text-foreground">
                      {row.name}
                      <span className="block text-[10px] text-muted-foreground font-normal">
                        {row.studentId} • Class {row.class}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 font-bold">
                        {row.batch}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold">{row.conducted}</td>
                    <td className="p-3 text-center font-extrabold text-emerald-600">{row.present}</td>
                    <td className="p-3 text-center font-extrabold text-rose-600">{row.absent}</td>
                    <td className="p-3 text-center font-black">
                      <span
                        className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                          row.percentage >= 75
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {row.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === "batch" && reportData ? (
        /* BATCH COMPARISON REPORT */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
            <h2 className="text-xl font-black text-foreground">{reportData.batch57?.name} Overview</h2>
            <p className="text-xs text-muted-foreground font-medium">{reportData.batch57?.timing}</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-muted/40 text-center">
                <span className="text-xs text-muted-foreground block font-bold">Total Students</span>
                <span className="text-2xl font-black">{reportData.batch57?.totalStudents}</span>
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 text-center">
                <span className="text-xs text-muted-foreground block font-bold">Classes Conducted</span>
                <span className="text-2xl font-black">{reportData.batch57?.classesConducted}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-center">
                <span className="text-xs text-emerald-600 block font-bold">Total Present</span>
                <span className="text-2xl font-black text-emerald-600">{reportData.batch57?.totalPresent}</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-500/10 text-center">
                <span className="text-xs text-indigo-600 block font-bold">Avg Attendance</span>
                <span className="text-2xl font-black text-indigo-600">{reportData.batch57?.avgPercentage}%</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft space-y-4">
            <h2 className="text-xl font-black text-foreground">{reportData.batch79?.name} Overview</h2>
            <p className="text-xs text-muted-foreground font-medium">{reportData.batch79?.timing}</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-muted/40 text-center">
                <span className="text-xs text-muted-foreground block font-bold">Total Students</span>
                <span className="text-2xl font-black">{reportData.batch79?.totalStudents}</span>
              </div>
              <div className="p-4 rounded-2xl bg-muted/40 text-center">
                <span className="text-xs text-muted-foreground block font-bold">Classes Conducted</span>
                <span className="text-2xl font-black">{reportData.batch79?.classesConducted}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-center">
                <span className="text-xs text-emerald-600 block font-bold">Total Present</span>
                <span className="text-2xl font-black text-emerald-600">{reportData.batch79?.totalPresent}</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-500/10 text-center">
                <span className="text-xs text-indigo-600 block font-bold">Avg Attendance</span>
                <span className="text-2xl font-black text-indigo-600">{reportData.batch79?.avgPercentage}%</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STUDENT SUMMARY & ALERTS LIST */
        <div className="bg-card border border-border rounded-3xl p-5 shadow-soft space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-black uppercase text-[10px]">
                  <th className="p-3">Student</th>
                  <th className="p-3">Batch</th>
                  <th className="p-3 text-center">Conducted</th>
                  <th className="p-3 text-center text-emerald-600">Present</th>
                  <th className="p-3 text-center text-rose-600">Absent</th>
                  <th className="p-3 text-center">Attendance %</th>
                  <th className="p-3 text-right">Quick Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reportData?.students
                  ?.filter((st: any) => {
                    if (activeTab === "low") return st.isLowAttendance;
                    if (activeTab === "consecutive") return st.isConsecutiveAbsenceAlert;
                    return true;
                  })
                  .map((st: any) => (
                    <tr key={st.studentId} className="hover:bg-muted/30 transition-all font-semibold">
                      <td className="p-3 font-bold text-foreground">
                        {st.name}
                        <span className="block text-[10px] text-muted-foreground font-normal">
                          {st.studentId} • Class {st.class}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-600 font-bold">
                          {st.batch}
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold">{st.totalConducted}</td>
                      <td className="p-3 text-center font-extrabold text-emerald-600">{st.presentCount}</td>
                      <td className="p-3 text-center font-extrabold text-rose-600">{st.absentCount}</td>
                      <td className="p-3 text-center font-black">
                        <span
                          className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                            st.percentage >= 75
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {st.percentage}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {st.telLink && (
                            <a
                              href={st.telLink}
                              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              title="Call Parent"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {st.whatsappUrl && (
                            <a
                              href={st.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                              title="WhatsApp Parent"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
