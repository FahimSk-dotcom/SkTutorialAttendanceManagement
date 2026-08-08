import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getAuthenticatedAdmin } from "@/lib/auth";
import { attendanceSettingsSchema } from "@/schemas";
import { DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/whatsapp";
import { SettingsDoc } from "@/types";

export const DEFAULT_SETTINGS: SettingsDoc = {
  docType: "settings",
  key: "app_settings",
  instituteName: "SK Tutorials",
  teacherName: "Prof. Fahim Sir",
  batch1Name: "5–7",
  batch1Timing: "5:00 PM – 7:00 PM",
  batch1Classes: [
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
  ],
  batch2Name: "7–9",
  batch2Timing: "7:00 PM – 9:00 PM",
  batch2Classes: ["Class 9", "Class 10"],
  attendanceThreshold: 75,
  consecutiveAbsenceThreshold: 3,
  whatsappTemplate: DEFAULT_WHATSAPP_TEMPLATE,
  updatedAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const settings = await db
      .collection("attendance")
      .findOne({ docType: "settings", key: "app_settings" });

    if (!settings) {
      return NextResponse.json(DEFAULT_SETTINGS);
    }

    return NextResponse.json({
      ...DEFAULT_SETTINGS,
      ...settings,
    });
  } catch (error: any) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = attendanceSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const db = await getDb();
    const now = new Date().toISOString();

    const updateDoc = {
      ...parsed.data,
      docType: "settings",
      key: "app_settings",
      updatedAt: now,
    };

    await db.collection("attendance").updateOne(
      { docType: "settings", key: "app_settings" },
      { $set: updateDoc },
      { upsert: true }
    );

    return NextResponse.json({ success: true, settings: updateDoc });
  } catch (error: any) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
