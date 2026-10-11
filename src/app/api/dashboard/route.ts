import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getKolkataToday, formatKolkataFullDate, getKolkataGreeting } from "@/lib/date";
import { getContactMobile, generateTelLink } from "@/lib/phone";
import { generateWhatsAppLink, DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/whatsapp";
import { AbsenteeInfo, BatchStats } from "@/types";
import { DEFAULT_SETTINGS } from "@/app/api/settings/route";
import { getEffectiveBatch, formatClassDisplay, getClassSortRank } from "@/lib/classUtils";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const todayStr = getKolkataToday();
    const formattedDate = formatKolkataFullDate(todayStr);
    const greeting = getKolkataGreeting();

    // 1. Fetch App Settings & Class-to-Batch Mappings
    const settingsDoc = await db
      .collection("attendance")
      .findOne({ docType: "settings", key: "app_settings" });

    const teacherName = settingsDoc?.teacherName || "Prof. Fahim Sir";
    const instituteName = settingsDoc?.instituteName || "SK Tutorials";
    const lowThreshold = settingsDoc?.attendanceThreshold || 75;
    const alertConsecutiveThreshold = settingsDoc?.consecutiveAbsenceThreshold || 3;
    const waTemplate = settingsDoc?.whatsappTemplate || DEFAULT_WHATSAPP_TEMPLATE;

    const batch1Classes: string[] = settingsDoc?.batch1Classes || DEFAULT_SETTINGS.batch1Classes;
    const batch2Classes: string[] = settingsDoc?.batch2Classes || DEFAULT_SETTINGS.batch2Classes;

    // 2. Fetch Active Students & Calculate Effective Batch by Class Mapping
    const rawActiveStudents = await db
      .collection("students")
      .find({ status: "Active" })
      .toArray();

    const activeStudents = rawActiveStudents.map((st: any) => {
      const effectiveBatch = getEffectiveBatch(st, batch1Classes, batch2Classes);
      return {
        ...st,
        class: formatClassDisplay(st.class),
        batch: effectiveBatch === "Unassigned" ? "" : effectiveBatch,
      };
    });

    const batch57Students = activeStudents.filter((s: any) => s.batch === "5-7");
    const batch79Students = activeStudents.filter((s: any) => s.batch === "7-9");

    // 3. Fetch Holidays for today
    const todaysHolidays = await db
      .collection("attendance")
      .find({ docType: "holiday", date: todayStr })
      .toArray();

    const isHoliday57 = todaysHolidays.some(
      (h: any) => h.batch === "ALL" || h.batch === "5-7"
    );
    const isHoliday79 = todaysHolidays.some(
      (h: any) => h.batch === "ALL" || h.batch === "7-9"
    );

    // 4. Fetch Today's Attendance Records
    const todaysAttendance = await db
      .collection("attendance")
      .find({ docType: "attendance", date: todayStr })
      .toArray();

    const records57 = todaysAttendance.filter((r: any) => r.batch === "5-7");
    const records79 = todaysAttendance.filter((r: any) => r.batch === "7-9");

    // Batch 5-7 Stats
    const p57 = records57.filter((r: any) => r.status === "present").length;
    const a57 = records57.filter((r: any) => r.status === "absent").length;
    const total57 = batch57Students.length;
    const pct57 = records57.length > 0 ? Math.round((p57 / records57.length) * 100) : 0;

    const stats57: BatchStats = {
      batch: "5-7",
      batchName: settingsDoc?.batch1Name || "5–7",
      batchTiming: settingsDoc?.batch1Timing || "5:00 PM – 7:00 PM",
      assignedClasses: batch1Classes,
      totalStudents: total57,
      present: p57,
      absent: a57,
      attendancePercentage: pct57,
      status: records57.length > 0 ? "Completed" : "Pending",
      isHoliday: isHoliday57,
      holidayReason: isHoliday57 ? todaysHolidays[0]?.reason : undefined,
    };

    // Batch 7-9 Stats
    const p79 = records79.filter((r: any) => r.status === "present").length;
    const a79 = records79.filter((r: any) => r.status === "absent").length;
    const total79 = batch79Students.length;
    const pct79 = records79.length > 0 ? Math.round((p79 / records79.length) * 100) : 0;

    const stats79: BatchStats = {
      batch: "7-9",
      batchName: settingsDoc?.batch2Name || "7–9",
      batchTiming: settingsDoc?.batch2Timing || "7:00 PM – 9:00 PM",
      assignedClasses: batch2Classes,
      totalStudents: total79,
      present: p79,
      absent: a79,
      attendancePercentage: pct79,
      status: records79.length > 0 ? "Completed" : "Pending",
      isHoliday: isHoliday79,
      holidayReason: isHoliday79 ? todaysHolidays[0]?.reason : undefined,
    };

    // 5. Today's Absentees list
    const absentStudentIds = todaysAttendance
      .filter((r: any) => r.status === "absent")
      .map((r: any) => r.studentId);

    const allStudentsMap = new Map<string, any>(
      activeStudents.map((s: any) => [s.studentId, s])
    );

    // Fetch past attendance for consecutive absence calculations
    const allPastAttendance = await db
      .collection("attendance")
      .find({ docType: "attendance", date: { $lte: todayStr } })
      .sort({ date: -1 })
      .toArray();

    const studentPastRecordsMap = new Map<string, any[]>();
    for (const rec of allPastAttendance) {
      if (!studentPastRecordsMap.has(rec.studentId)) {
        studentPastRecordsMap.set(rec.studentId, []);
      }
      studentPastRecordsMap.get(rec.studentId)!.push(rec);
    }

    const todaysAbsentees: AbsenteeInfo[] = [];

    for (const studentId of absentStudentIds) {
      const student = allStudentsMap.get(studentId);
      if (!student) continue;

      const contactMobile = getContactMobile(student);
      const telLink = generateTelLink(contactMobile);
      const whatsappUrl = generateWhatsAppLink(contactMobile, student.name, waTemplate);

      // Compute consecutive absences
      let consecutive = 0;
      const past = studentPastRecordsMap.get(studentId) || [];
      for (const rec of past) {
        if (rec.status === "absent") consecutive++;
        else break;
      }

      todaysAbsentees.push({
        studentId: student.studentId,
        name: student.name,
        class: student.class,
        batch: student.batch || "5-7",
        parentName: student.parentName,
        parentMobile: student.parentMobile,
        alternateMobile: student.alternateMobile,
        contactMobile,
        whatsappUrl,
        telLink,
        consecutiveAbsences: consecutive,
      });
    }

    // 6. Consecutive Absence & Low Attendance Alerts
    const consecutiveAbsenceAlerts: any[] = [];
    const lowAttendanceAlerts: any[] = [];

    for (const student of activeStudents) {
      const past = studentPastRecordsMap.get(student.studentId) || [];
      if (past.length === 0) continue;

      let cons = 0;
      for (const rec of past) {
        if (rec.status === "absent") cons++;
        else break;
      }

      if (cons >= alertConsecutiveThreshold) {
        const contactMobile = getContactMobile(student);
        consecutiveAbsenceAlerts.push({
          student,
          consecutiveAbsences: cons,
          contactMobile,
          telLink: generateTelLink(contactMobile),
          whatsappUrl: generateWhatsAppLink(contactMobile, student.name, waTemplate),
        });
      }

      const totalCond = past.length;
      const presCount = past.filter((r) => r.status === "present").length;
      const pct = totalCond > 0 ? Math.round((presCount / totalCond) * 100) : 100;

      if (totalCond >= 3 && pct < lowThreshold) {
        const contactMobile = getContactMobile(student);
        lowAttendanceAlerts.push({
          student,
          percentage: pct,
          totalConducted: totalCond,
          presentCount: presCount,
          contactMobile,
          telLink: generateTelLink(contactMobile),
          whatsappUrl: generateWhatsAppLink(contactMobile, student.name, waTemplate),
        });
      }
    }

    return NextResponse.json({
      todayStr,
      formattedDate,
      greeting,
      teacherName,
      instituteName,
      stats57,
      stats79,
      todaysAbsentees,
      consecutiveAbsenceAlerts,
      lowAttendanceAlerts,
      totalActiveStudents: activeStudents.length,
    });
  } catch (error: any) {
    console.error("GET dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard data" }, { status: 500 });
  }
}
