"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Phone,
  MessageSquare,
  Edit,
  ArrowUpRight,
  UserPlus,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Student, BatchType } from "@/types";
import { getContactMobile, generateTelLink } from "@/lib/phone";
import { generateWhatsAppLink } from "@/lib/whatsapp";

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("Active");

  // Batch assignment modal
  const [assignStudent, setAssignStudent] = useState<Student | null>(null);
  const [targetBatch, setTargetBatch] = useState<BatchType>("5-7");
  const [updating, setUpdating] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        batch: selectedBatch,
        status: selectedStatus,
      });

      const res = await fetch(`/api/students?${query.toString()}`);
      const json = await res.json();
      if (res.ok) {
        setStudents(json);
      }
    } catch (err) {
      console.error("Fetch students error:", err);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, selectedBatch, selectedStatus]);

  // Handle batch assignment submit
  const handleAssignBatch = async () => {
    if (!assignStudent) return;

    try {
      setUpdating(true);
      const res = await fetch("/api/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: assignStudent.studentId,
          batch: targetBatch,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update batch");

      toast.success(`${assignStudent.name} assigned to Batch ${targetBatch}`);
      setAssignStudent(null);
      fetchStudents();
    } catch (err: any) {
      toast.error(err.message || "Failed to assign batch");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-3xl shadow-soft">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Student Management & Batch Assignment</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium">
            Read from existing database `sk_tutorials.students` • Assign tuition batches
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black self-start sm:self-auto border border-indigo-500/20">
          {students.length} Students Listed
        </span>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border rounded-3xl p-4 shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search student, parent, mobile, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-muted/60 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Batch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Batch:</span>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-muted/60 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="All">All Batches</option>
              <option value="5-7">5–7 Batch</option>
              <option value="7-9">7–9 Batch</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold bg-muted/60 border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
              <option value="All">All Statuses</option>
            </select>
          </div>
        </div>
      </div>

      {/* Student Grid Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-card border border-border rounded-3xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-3xl bg-card">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="font-extrabold text-base text-foreground">No students match search filter</p>
          <p className="text-xs text-muted-foreground mt-1">Try clearing search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {students.map((student) => {
            const contactMobile = getContactMobile(student);
            const telLink = generateTelLink(contactMobile);
            const waUrl = generateWhatsAppLink(contactMobile, student.name);

            return (
              <div
                key={student.studentId}
                className="bg-card border border-border rounded-3xl p-5 shadow-soft hover:border-indigo-500/50 transition-all space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-muted-foreground">
                        {student.studentId} • {student.class}
                      </span>
                      <h3 className="text-lg font-black text-foreground leading-tight">
                        {student.name}
                      </h3>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {student.status === "Active" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold">
                          Inactive
                        </span>
                      )}

                      {student.batch ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-black">
                          Batch {student.batch}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                          No Batch
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 mt-2">
                    <p>
                      <strong>Parent:</strong> {student.parentName} ({student.parentMobile || "N/A"})
                    </p>
                    {student.admissionDate && (
                      <p className="text-[11px]">
                        <strong>Admitted:</strong> {student.admissionDate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/60">
                  <button
                    onClick={() => {
                      setAssignStudent(student);
                      setTargetBatch((student.batch as BatchType) || "5-7");
                    }}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Assign Batch</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {telLink && (
                      <a
                        href={telLink}
                        className="p-2 bg-blue-600/10 text-blue-600 rounded-xl hover:bg-blue-600/20"
                        title="Call Parent"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-600/10 text-emerald-600 rounded-xl hover:bg-emerald-600/20"
                        title="WhatsApp Parent"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    )}
                    <Link
                      href={`/students/${student.studentId}`}
                      className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xs"
                      title="View Student Profile"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BATCH ASSIGNMENT MODAL */}
      {assignStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-black text-lg text-foreground">Assign Tuition Batch</h3>
              <button
                onClick={() => setAssignStudent(null)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-bold text-sm text-foreground">{assignStudent.name}</p>
              <p className="text-muted-foreground">
                Student ID: {assignStudent.studentId} • {assignStudent.class}
              </p>

              <div className="pt-2 space-y-2">
                <label className="font-extrabold text-foreground block">Select Tuition Batch:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setTargetBatch("5-7")}
                    className={`p-3 rounded-2xl border text-xs font-black transition-all ${
                      targetBatch === "5-7"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    5–7 Batch
                  </button>

                  <button
                    onClick={() => setTargetBatch("7-9")}
                    className={`p-3 rounded-2xl border text-xs font-black transition-all ${
                      targetBatch === "7-9"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    7–9 Batch
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAssignStudent(null)}
                className="px-4 py-2 rounded-2xl bg-muted text-muted-foreground font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignBatch}
                disabled={updating}
                className="px-5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md disabled:opacity-50"
              >
                {updating ? "Updating..." : "Save Batch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
