import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

export const studentSchema = z.object({
  name: z.string().min(2, "Student name is required"),
  class: z.string().min(1, "Class is required"),
  batch: z.enum(["5-7", "7-9"]).optional(),
  monthlyFee: z.number().positive("Monthly fee must be positive").optional(),
  parentName: z.string().min(2, "Parent name is required"),
  parentMobile: z
    .string()
    .regex(/^[0-9]{10}$/, "Parent mobile number must be exactly 10 digits"),
  alternateMobile: z
    .string()
    .regex(/^[0-9]{10}$/, "Alternate mobile must be 10 digits")
    .optional()
    .or(z.literal("")),
  admissionDate: z.string().min(1, "Admission date is required"),
  status: z.enum(["Active", "Inactive"]),
  address: z.string().optional(),
  remarks: z.string().optional(),
});

export const attendanceItemSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  status: z.enum(["present", "absent"]),
});

export const attendanceSubmitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  batch: z.enum(["5-7", "7-9"]),
  records: z.array(attendanceItemSchema).min(1, "At least one student record is required"),
});

export const singleAttendanceUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  batch: z.enum(["5-7", "7-9"]),
  studentId: z.string().min(1, "Student ID is required"),
  status: z.enum(["present", "absent"]),
});

export const holidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  batch: z.enum(["ALL", "5-7", "7-9"]).default("ALL"),
  reason: z.enum(["Holiday", "Vacation", "Personal", "Other"]),
  description: z.string().optional(),
});

export const attendanceSettingsSchema = z.object({
  instituteName: z.string().min(2, "Institute name is required"),
  teacherName: z.string().min(2, "Teacher name is required"),
  batch1Name: z.string().min(1, "Batch 1 name is required"),
  batch1Timing: z.string().min(1, "Batch 1 timing is required"),
  batch1Classes: z.array(z.string()).default([]),
  batch2Name: z.string().min(1, "Batch 2 name is required"),
  batch2Timing: z.string().min(1, "Batch 2 timing is required"),
  batch2Classes: z.array(z.string()).default([]),
  attendanceThreshold: z.number().min(0).max(100),
  consecutiveAbsenceThreshold: z.number().min(1).max(30),
  whatsappTemplate: z.string().min(5, "WhatsApp template is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentInput = z.infer<typeof studentSchema>;
export type AttendanceSubmitInput = z.infer<typeof attendanceSubmitSchema>;
export type SingleAttendanceUpdateInput = z.infer<typeof singleAttendanceUpdateSchema>;
export type HolidayInput = z.infer<typeof holidaySchema>;
export type AttendanceSettingsInput = z.infer<typeof attendanceSettingsSchema>;
