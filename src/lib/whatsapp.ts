export const DEFAULT_WHATSAPP_TEMPLATE = `Assalamualaikum,

{studentName} was absent from today's class. Kindly let me know the reason.

Regards,
Prof. Fahim Sir
SK Tutorials`;

/**
 * Normalizes Indian phone numbers into pure digits with 91 country code prefix for wa.me URLs.
 * Example: "9004740981" -> "919004740981"
 * Example: "+91 90047-40981" -> "919004740981"
 */
export function normalizeWhatsAppNumber(phoneStr: string): string {
  if (!phoneStr) return "";
  // Strip all non-digits
  const digits = phoneStr.replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }
  if (digits.length > 10 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  return digits;
}

/**
 * Helper to clean class display string (e.g. "Class 9" -> "9")
 */
export function cleanClassDisplay(className: string): string {
  if (!className) return "";
  return className.replace(/^Class\s+/i, "");
}

/**
 * Generates an official WhatsApp wa.me click-to-chat URL.
 * Works seamlessly on iPhone, Android, WhatsApp Web, and Desktop.
 */
export function generateWhatsAppLink(
  phoneStr: string,
  studentName: string,
  templateStr: string = DEFAULT_WHATSAPP_TEMPLATE
): string {
  const cleanNumber = normalizeWhatsAppNumber(phoneStr);
  if (!cleanNumber) return "";

  const finalMessage = (templateStr || DEFAULT_WHATSAPP_TEMPLATE).replace(
    /\{studentName\}/g,
    studentName
  );

  const encodedMsg = encodeURIComponent(finalMessage);
  return `https://wa.me/${cleanNumber}?text=${encodedMsg}`;
}
