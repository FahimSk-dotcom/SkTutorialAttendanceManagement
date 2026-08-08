import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { attendanceSubmitSchema, singleAttendanceUpdateSchema } from "@/schemas";
import { isFutureDate } from "@/lib/date";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const batch = searchParams.get("batch");
    const studentId = searchParams.get("studentId");
    const month = searchParams.get("month"); // YYYY-MM

    const db = await getDb();
    const query: any = { docType: "attendance" };

    if (date) query.date = date;
    if (batch && batch !== "All") query.batch = batch;
    if (studentId) query.studentId = studentId;
    if (month) query.date = new RegExp(`^${month}`);

    const records = await db
      .collection("attendance")
      .find(query)
      .sort({ date: -1, batch: 1 })
      .toArray();

    return NextResponse.json(records);
  } catch (error: any) {
    console.error("GET attendance error:", error);
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = attendanceSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { date, batch, records } = parsed.data;

    // Disallow future date attendance marking
    if (isFutureDate(date)) {
      return NextResponse.json(
        { error: "Attendance cannot be marked for future dates" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();

    // Prepare atomic bulkWrite operations to enforce date + batch + studentId uniqueness
    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: {
          docType: "attendance",
          date,
          batch,
          studentId: rec.studentId,
        },
        update: {
          $set: {
            docType: "attendance",
            date,
            batch,
            studentId: rec.studentId,
            status: rec.status,
            updatedAt: now,
          },
          $setOnInsert: {
            markedAt: now,
          },
        },
        upsert: true,
      },
    }));

    const result = await db.collection("attendance").bulkWrite(bulkOps);

    return NextResponse.json({
      success: true,
      date,
      batch,
      modifiedCount: result.modifiedCount || 0,
      upsertedCount: result.upsertedCount || 0,
      totalStudents: records.length,
      presentCount: records.filter((r) => r.status === "present").length,
      absentCount: records.filter((r) => r.status === "absent").length,
    });
  } catch (error: any) {
    console.error("POST attendance error:", error);
    return NextResponse.json({ error: "Failed to save attendance" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = singleAttendanceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { date, batch, studentId, status } = parsed.data;
    const db = await getDb();
    const now = new Date().toISOString();

    await db.collection("attendance").updateOne(
      {
        docType: "attendance",
        date,
        batch,
        studentId,
      },
      {
        $set: {
          status,
          updatedAt: now,
        },
        $setOnInsert: {
          docType: "attendance",
          date,
          batch,
          studentId,
          markedAt: now,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, date, batch, studentId, status });
  } catch (error: any) {
    console.error("PUT attendance error:", error);
    return NextResponse.json({ error: "Failed to update attendance status" }, { status: 500 });
  }
}
