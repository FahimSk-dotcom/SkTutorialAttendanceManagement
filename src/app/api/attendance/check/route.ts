import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const batch = searchParams.get("batch");

    if (!date || !batch) {
      return NextResponse.json({ error: "date and batch required" }, { status: 400 });
    }

    const db = await getDb();

    // Check for holiday on this date & batch
    const holiday = await db.collection("attendance").findOne({
      docType: "holiday",
      date,
      $or: [{ batch: "ALL" }, { batch }],
    });

    if (holiday) {
      return NextResponse.json({
        isMarked: false,
        isHoliday: true,
        holidayReason: holiday.reason,
        description: holiday.description,
      });
    }

    const records = await db
      .collection("attendance")
      .find({ docType: "attendance", date, batch })
      .toArray();

    const isMarked = records.length > 0;
    const presentCount = records.filter((r: any) => r.status === "present").length;
    const absentCount = records.filter((r: any) => r.status === "absent").length;

    return NextResponse.json({
      isMarked,
      isHoliday: false,
      totalMarked: records.length,
      presentCount,
      absentCount,
      records,
    });
  } catch (error: any) {
    console.error("GET check attendance error:", error);
    return NextResponse.json({ error: "Failed to check attendance status" }, { status: 500 });
  }
}
