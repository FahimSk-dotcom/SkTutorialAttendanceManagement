/**
 * Phone contact utilities for one-tap calling on iPhone and Android devices.
 */

/**
 * Returns primary parentMobile if present, otherwise alternateMobile, otherwise "".
 */
export function getContactMobile(student: {
  parentMobile?: string;
  alternateMobile?: string;
}): string {
  if (student.parentMobile && student.parentMobile.trim().length > 0) {
    return student.parentMobile.trim();
  }
  if (student.alternateMobile && student.alternateMobile.trim().length > 0) {
    return student.alternateMobile.trim();
  }
  return "";
}

/**
 * Formats a phone number for HTML tel: link.
 * Example: "9004740981" -> "tel:+919004740981"
 */
export function generateTelLink(phoneStr: string): string {
  if (!phoneStr) return "";
  const digits = phoneStr.replace(/\D/g, "");

  if (digits.length === 10) {
    return `tel:+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `tel:+${digits}`;
  }

  return `tel:${digits}`;
}
