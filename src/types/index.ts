export type DueStatus = "PAID" | "DUE_TODAY" | "OVERDUE";
export type BatchType = "5-7" | "7-9";
export type AttendanceStatus = "present" | "absent";

export const ALL_CLASSES = [
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
  "Class 9",
  "Class 10",
] as const;

export interface Student {
  _id?: string;
  studentId: string; // Auto generated short code (e.g. SK-1001)
  name: string;
  class: string;
  batch?: BatchType; // "5-7" | "7-9"
  monthlyFee?: number;
  parentName: string;
  parentMobile: string;
  alternateMobile?: string;
  admissionDate: string; // YYYY-MM-DD
  status: "Active" | "Inactive";
  address?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  _id?: string;
  docType: "attendance";
  date: string; // YYYY-MM-DD in Asia/Kolkata
  batch: BatchType; // "5-7" | "7-9"
  studentId: string;
  status: AttendanceStatus; // "present" | "absent"
  markedAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface HolidayDoc {
  _id?: string;
  docType: "holiday";
  date: string; // YYYY-MM-DD
  batch?: "ALL" | BatchType;
  reason: "Holiday" | "Vacation" | "Personal" | "Other";
  description?: string;
  createdAt?: string;
}

export interface SettingsDoc {
  _id?: string;
  docType: "settings";
  key: "app_settings";
  instituteName: string;
  teacherName: string;
  batch1Name: string;
  batch1Timing: string;
  batch1Classes: string[]; // e.g. ["Jr.Kg", "Sr.Kg", "Class 1", ..., "Class 8"]
  batch2Name: string;
  batch2Timing: string;
  batch2Classes: string[]; // e.g. ["Class 9", "Class 10"]
  attendanceThreshold: number; // e.g. 75
  consecutiveAbsenceThreshold: number; // e.g. 3
  whatsappTemplate: string;
  updatedAt?: string;
}

export interface Admin {
  _id?: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt?: string;
}

export interface BatchStats {
  batch: BatchType;
  batchName: string;
  batchTiming: string;
  assignedClasses: string[];
  totalStudents: number;
  present: number;
  absent: number;
  attendancePercentage: number;
  status: "Completed" | "Pending";
  isHoliday?: boolean;
  holidayReason?: string;
}

export interface AbsenteeInfo {
  studentId: string;
  name: string;
  class: string;
  batch: BatchType;
  parentName: string;
  parentMobile: string;
  alternateMobile?: string;
  contactMobile: string;
  whatsappUrl: string;
  telLink: string;
  consecutiveAbsences: number;
}

export interface StudentAttendanceSummary {
  student: Student;
  totalConducted: number;
  presentCount: number;
  absentCount: number;
  percentage: number;
  currentMonthConducted: number;
  currentMonthPresent: number;
  currentMonthAbsent: number;
  currentMonthPercentage: number;
  consecutiveAbsences: number;
  consecutivePresence: number;
}
