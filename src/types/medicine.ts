export type MedicineStatus = "upcoming" | "taken" | "missed";

export type MedicineType = "Tablet" | "Capsule" | "Syrup" | "Injection" | "Drops" | "Other";

export const MEDICINE_TYPES: MedicineType[] = [
  "Tablet", "Capsule", "Syrup", "Injection", "Drops", "Other",
];

export interface Medicine {
  id: number;
  userId: string;
  name: string;
  dosage: string;
  type: MedicineType;
  scheduleTime: string; // "HH:mm" (24h)
  startDate: string;    // "YYYY-MM-DD"
  durationDays: number; // 0 = every day (ongoing)
  notes: string;
  photoUri: string | null;
  notificationIds: string[];
  createdAt: string;
}

export interface MedicineInput {
  name: string;
  dosage: string;
  type: MedicineType;
  scheduleTime: string;
  startDate: string;
  durationDays: number;
  notes: string;
  photoUri: string | null;
}

export function describeDuration(durationDays: number): string {
  if (durationDays === 0) return "Every day";
  return durationDays === 1 ? "1 day" : `${durationDays} days`;
}
export interface DoseItem {
  medicine: Medicine;
  date: string;
  status: MedicineStatus;
}