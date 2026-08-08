import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { getKolkataToday } from "@/lib/date";
import { ObjectId } from "mongodb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();

    // Query by studentId first, then by ObjectId if valid
    let student = await db.collection("students").findOne({ studentId: id });
    if (!student && ObjectId.isValid(id)) {
      student = await db.collection("students").findOne({ _id: new ObjectId(id) });
    }

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const todayStr = getKolkataToday();
    const currentMonthPrefix = todayStr.substring(0, 7); // "YYYY-MM"

    // Fetch all attendance records for this student
    const attendanceRecords = await db
      .collection("attendance")
      .find({
        docType: "attendance",
        studentId: student.studentId,
        date: { $lte: todayStr },
      })
      .sort({ date: -1 })
      .toArray();

    // Fetch holidays to ensure accurate conducted class math
    const holidays = await db
      .collection("attendance")
      .find({ docType: "holiday" })
      .toArray();

    const holidayDates = new Set(holidays.map((h: any) => h.date));

    // Filter out records on holiday dates
    const validAttendance = attendanceRecords.filter(
      (rec: any) => !holidayDates.has(rec.date)
    );

    const totalConducted = validAttendance.length;
    const presentCount = validAttendance.filter((rec: any) => rec.status === "present").length;
    const absentCount = validAttendance.filter((rec: any) => rec.status === "absent").length;
    const percentage = totalConducted > 0 ? Math.round((presentCount / totalConducted) * 100) : 0;

    // Current Month metrics
    const currentMonthRecords = validAttendance.filter((rec: any) =>
      rec.date.startsWith(currentMonthPrefix)
    );
    const currentMonthConducted = currentMonthRecords.length;
    const currentMonthPresent = currentMonthRecords.filter((rec: any) => rec.status === "present").length;
    const currentMonthAbsent = currentMonthRecords.filter((rec: any) => rec.status === "absent").length;
    const currentMonthPercentage =
      currentMonthConducted > 0 ? Math.round((currentMonthPresent / currentMonthConducted) * 100) : 0;

    // Consecutive calculation (sorted descending by date)
    let consecutiveAbsences = 0;
    let consecutivePresence = 0;

    if (validAttendance.length > 0) {
      const mostRecentStatus = validAttendance[0].status;
      if (mostRecentStatus === "absent") {
        for (const rec of validAttendance) {
          if (rec.status === "absent") consecutiveAbsences++;
          else break;
        }
      } else if (mostRecentStatus === "present") {
        for (const rec of validAttendance) {
          if (rec.status === "present") consecutivePresence++;
          else break;
        }
      }
    }

    return NextResponse.json({
      student,
      summary: {
        totalConducted,
        presentCount,
        absentCount,
        percentage,
        currentMonthConducted,
        currentMonthPresent,
        currentMonthAbsent,
        currentMonthPercentage,
        consecutiveAbsences,
        consecutivePresence,
      },
      attendanceRecords: validAttendance,
    });
  } catch (error: any) {
    console.error("GET student profile error:", error);
    return NextResponse.json({ error: "Failed to fetch student details" }, { status: 500 });
  }
}
