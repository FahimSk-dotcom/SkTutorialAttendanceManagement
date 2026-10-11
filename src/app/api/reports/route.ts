import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getDaysInMonth, getKolkataToday } from "@/lib/date";
import { getContactMobile, generateTelLink } from "@/lib/phone";
import { generateWhatsAppLink, DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/whatsapp";
import { DEFAULT_SETTINGS } from "@/app/api/settings/route";
import { getEffectiveBatch, formatClassDisplay, getClassSortRank } from "@/lib/classUtils";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "summary";
    const batchFilter = searchParams.get("batch") || "All";
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);

    const db = await getDb();
    const todayStr = getKolkataToday();

    // Fetch settings for thresholds, templates & class-to-batch mappings
    const settingsDoc = await db
      .collection("attendance")
      .findOne({ docType: "settings", key: "app_settings" });
    const lowThreshold = settingsDoc?.attendanceThreshold || 75;
    const consThreshold = settingsDoc?.consecutiveAbsenceThreshold || 3;
    const waTemplate = settingsDoc?.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE;

    const batch1Classes: string[] = settingsDoc?.batch1Classes || DEFAULT_SETTINGS.batch1Classes;
    const batch2Classes: string[] = settingsDoc?.batch2Classes || DEFAULT_SETTINGS.batch2Classes;

    // Fetch all students and map effective batch based on class-to-batch settings
    const rawStudents = await db
      .collection("students")
      .find({})
      .sort({ studentId: 1 })
      .toArray();

    const allMappedStudents = rawStudents.map((st: any) => {
      const effectiveBatch = getEffectiveBatch(st, batch1Classes, batch2Classes);
      return {
        ...st,
        batch: effectiveBatch,
        formattedClass: formatClassDisplay(st.class),
      };
    });

    // Sort students systematically: Class level (Jr.Kg -> 10) then name alphabetically
    allMappedStudents.sort((a: any, b: any) => {
      const rankDiff = getClassSortRank(a.class) - getClassSortRank(b.class);
      if (rankDiff !== 0) return rankDiff;
      return a.name.localeCompare(b.name);
    });

    // Apply batch filter if specified
    const filteredStudents =
      batchFilter === "All"
        ? allMappedStudents
        : allMappedStudents.filter((st: any) => st.batch === batchFilter);

    // Fetch holidays
    const holidays = await db
      .collection("attendance")
      .find({ docType: "holiday" })
      .toArray();
    const holidayDateSet = new Set(holidays.map((h: any) => h.date));

    // Fetch all attendance records up to today
    const attendanceRecords = await db
      .collection("attendance")
      .find({ docType: "attendance", date: { $lte: todayStr } })
      .toArray();

    // Filter valid attendance excluding holidays
    const validRecords = attendanceRecords.filter((r: any) => !holidayDateSet.has(r.date));

    // Map records by studentId
    const studentRecordsMap = new Map<string, any[]>();
    for (const rec of validRecords) {
      if (!studentRecordsMap.has(rec.studentId)) {
        studentRecordsMap.set(rec.studentId, []);
      }
      studentRecordsMap.get(rec.studentId)!.push(rec);
    }

    if (reportType === "monthly") {
      // Monthly matrix report
      const mStr = String(month).padStart(2, "0");
      const monthPrefix = `${year}-${mStr}`;

      // Unique dates conducted in this month for specified batch
      const monthlyRecords = validRecords.filter((r: any) => {
        if (!r.date.startsWith(monthPrefix)) return false;
        if (batchFilter !== "All" && r.batch !== batchFilter) return false;
        return true;
      });

      const conductedDates = Array.from(new Set(monthlyRecords.map((r: any) => r.date))).sort();

      const studentRows = filteredStudents.map((st: any) => {
        const stRecs = monthlyRecords.filter((r: any) => r.studentId === st.studentId);
        const cond = stRecs.length;
        const pres = stRecs.filter((r: any) => r.status === "present").length;
        const abs = stRecs.filter((r: any) => r.status === "absent").length;
        const pct = cond > 0 ? Math.round((pres / cond) * 100) : 0;

        // Daily matrix mapping { "2026-08-01": "present", ... }
        const dailyMap: Record<string, string> = {};
        stRecs.forEach((r: any) => {
          dailyMap[r.date] = r.status;
        });

        return {
          studentId: st.studentId,
          name: st.name,
          class: st.formattedClass,
          batch: st.batch,
          conducted: cond,
          present: pres,
          absent: abs,
          percentage: pct,
          dailyMap,
        };
      });

      return NextResponse.json({
        year,
        month,
        batchFilter,
        conductedDates,
        studentRows,
      });
    }

    if (reportType === "batch") {
      // Batch comparison report
      const batch57Students = allMappedStudents.filter((s: any) => s.batch === "5-7");
      const batch79Students = allMappedStudents.filter((s: any) => s.batch === "7-9");

      const recs57 = validRecords.filter((r: any) => r.batch === "5-7");
      const recs79 = validRecords.filter((r: any) => r.batch === "7-9");

      const dates57 = new Set(recs57.map((r: any) => r.date)).size;
      const dates79 = new Set(recs79.map((r: any) => r.date)).size;

      const p57 = recs57.filter((r: any) => r.status === "present").length;
      const p79 = recs79.filter((r: any) => r.status === "present").length;

      const pct57 = recs57.length > 0 ? Math.round((p57 / recs57.length) * 100) : 0;
      const pct79 = recs79.length > 0 ? Math.round((p79 / recs79.length) * 100) : 0;

      return NextResponse.json({
        batch57: {
          name: settingsDoc?.batch1Name || "5–7",
          timing: settingsDoc?.batch1Timing || "5:00 PM – 7:00 PM",
          totalStudents: batch57Students.length,
          classesConducted: dates57,
          totalPresent: p57,
          totalAbsent: recs57.length - p57,
          avgPercentage: pct57,
        },
        batch79: {
          name: settingsDoc?.batch2Name || "7–9",
          timing: settingsDoc?.batch2Timing || "7:00 PM – 9:00 PM",
          totalStudents: batch79Students.length,
          classesConducted: dates79,
          totalPresent: p79,
          totalAbsent: recs79.length - p79,
          avgPercentage: pct79,
        },
      });
    }

    // Default summary student report with alerts
    const studentReportList = filteredStudents.map((student: any) => {
      const stRecs = (studentRecordsMap.get(student.studentId) || []).sort(
        (a, b) => b.date.localeCompare(a.date)
      );

      const totalConducted = stRecs.length;
      const presentCount = stRecs.filter((r: any) => r.status === "present").length;
      const absentCount = stRecs.filter((r: any) => r.status === "absent").length;
      const percentage = totalConducted > 0 ? Math.round((presentCount / totalConducted) * 100) : 0;

      // Consecutive absence calculation
      let consecutiveAbsences = 0;
      let consecutivePresence = 0;

      if (stRecs.length > 0) {
        if (stRecs[0].status === "absent") {
          for (const rec of stRecs) {
            if (rec.status === "absent") consecutiveAbsences++;
            else break;
          }
        } else if (stRecs[0].status === "present") {
          for (const rec of stRecs) {
            if (rec.status === "present") consecutivePresence++;
            else break;
          }
        }
      }

      const contactMobile = getContactMobile(student);

      return {
        studentId: student.studentId,
        name: student.name,
        class: student.formattedClass,
        batch: student.batch,
        status: student.status,
        parentName: student.parentName,
        contactMobile,
        telLink: generateTelLink(contactMobile),
        whatsappUrl: generateWhatsAppLink(contactMobile, student.name, waTemplate),
        totalConducted,
        presentCount,
        absentCount,
        percentage,
        consecutiveAbsences,
        consecutivePresence,
        isLowAttendance: totalConducted >= 3 && percentage < lowThreshold,
        isConsecutiveAbsenceAlert: consecutiveAbsences >= consThreshold,
      };
    });

    return NextResponse.json({
      students: studentReportList,
      lowThreshold,
      consThreshold,
    });
  } catch (error: any) {
    console.error("GET reports error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
