import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS } from "@/app/api/settings/route";

export async function GET(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const batch = searchParams.get("batch") || "All";
    const status = searchParams.get("status") || "Active"; // Default Active

    const db = await getDb();

    // Fetch settings for class-to-batch mapping
    const settingsDoc = await db
      .collection("attendance")
      .findOne({ docType: "settings", key: "app_settings" });

    const batch1Classes: string[] = settingsDoc?.batch1Classes || DEFAULT_SETTINGS.batch1Classes;
    const batch2Classes: string[] = settingsDoc?.batch2Classes || DEFAULT_SETTINGS.batch2Classes;

    const baseQuery: any = {};
    if (status !== "All") {
      baseQuery.status = status;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      baseQuery.$or = [
        { name: regex },
        { studentId: regex },
        { parentName: regex },
        { parentMobile: regex },
        { alternateMobile: regex },
        { class: regex },
        { batch: regex },
      ];
    }

    const allStudents = await db
      .collection("students")
      .find(baseQuery)
      .sort({ studentId: 1 })
      .toArray();

    // Map each student's effective batch based on explicit student.batch or class mapping
    const mappedStudents = allStudents.map((st: any) => {
      let effectiveBatch = st.batch;
      if (!effectiveBatch) {
        if (batch1Classes.includes(st.class)) {
          effectiveBatch = "5-7";
        } else if (batch2Classes.includes(st.class)) {
          effectiveBatch = "7-9";
        }
      }
      return {
        ...st,
        batch: effectiveBatch || "",
      };
    });

    // Filter by batch if requested
    let filtered = mappedStudents;
    if (batch !== "All") {
      if (batch === "Unassigned") {
        filtered = mappedStudents.filter((st: any) => !st.batch);
      } else {
        filtered = mappedStudents.filter((st: any) => st.batch === batch);
      }
    }

    return NextResponse.json(filtered);
  } catch (error: any) {
    console.error("GET students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, batch } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    if (batch && !["5-7", "7-9"].includes(batch)) {
      return NextResponse.json({ error: "Invalid batch. Must be '5-7' or '7-9'" }, { status: 400 });
    }

    const db = await getDb();
    const now = new Date().toISOString();

    const updateRes = await db.collection("students").updateOne(
      { studentId },
      {
        $set: {
          batch: batch || "",
          updatedAt: now,
        },
      }
    );

    if (updateRes.matchedCount === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, studentId, batch });
  } catch (error: any) {
    console.error("PUT student batch error:", error);
    return NextResponse.json({ error: "Failed to update student batch" }, { status: 500 });
  }
}
