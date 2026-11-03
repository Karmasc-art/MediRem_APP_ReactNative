import { MedicineInput } from "../types/medicine";

/** Returns an error message, or null when the input is valid. */
export function validateMedicine(input: MedicineInput): string | null {
  if (!input.name.trim()) return "Please enter the medicine name.";
  if (input.name.trim().length > 60) return "Medicine name is too long (max 60 characters).";
  if (!input.dosage.trim()) return "Please enter the dosage, for example 500 mg or 1 tablet.";
  if (input.dosage.trim().length > 40) return "Dosage is too long (max 40 characters).";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.scheduleTime)) return "Please choose a valid time.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) return "Please choose a valid start date.";
  if (input.notes.length > 200) return "Note is too long (max 200 characters).";
  return null;
}