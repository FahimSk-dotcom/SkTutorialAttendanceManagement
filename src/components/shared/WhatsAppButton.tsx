"use client";

import React from "react";
import { MessageSquare } from "lucide-react";
import { generateWhatsAppLink } from "@/lib/whatsapp";

interface WhatsAppButtonProps {
  parentMobile: string;
  studentName?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function WhatsAppButton({
  parentMobile,
  studentName = "Student",
  label = "WhatsApp",
  size = "md",
  className = "",
}: WhatsAppButtonProps) {
  const url = generateWhatsAppLink(parentMobile, studentName);

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-sm gap-2 font-medium",
    lg: "px-4 py-2 text-base gap-2 font-semibold",
  }[size];

  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 shadow-sm active:scale-95 ${sizeClasses} ${className}`}
      title="Open WhatsApp Reminder"
    >
      <MessageSquare className="w-4 h-4 fill-current" />
      <span>{label}</span>
    </a>
  );
}
