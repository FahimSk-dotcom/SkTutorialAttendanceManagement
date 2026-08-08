import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { holidaySchema } from "@/schemas";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const holidays = await db
      .collection("attendance")
      .find({ docType: "holiday" })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(holidays);
  } catch (error: any) {
    console.error("GET holidays error:", error);
    return NextResponse.json({ error: "Failed to fetch holidays" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = holidaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();

    const holidayDoc = {
      ...parsed.data,
      docType: "holiday",
      createdAt: now,
    };

    // Upsert by date & batch to prevent duplicate holiday entries
    await db.collection("attendance").updateOne(
      { docType: "holiday", date: parsed.data.date, batch: parsed.data.batch || "ALL" },
      { $set: holidayDoc },
      { upsert: true }
    );

    return NextResponse.json({ success: true, holiday: holidayDoc });
  } catch (error: any) {
    console.error("POST holiday error:", error);
    return NextResponse.json({ error: "Failed to save holiday" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const id = searchParams.get("id");

    const db = await getDb();

    if (id) {
      await db.collection("attendance").deleteOne({
        docType: "holiday",
        _id: new ObjectId(id),
      });
    } else if (date) {
      await db.collection("attendance").deleteMany({
        docType: "holiday",
        date: date,
      });
    } else {
      return NextResponse.json({ error: "Date or ID required" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE holiday error:", error);
    return NextResponse.json({ error: "Failed to delete holiday" }, { status: 500 });
  }
}
