export type MedicineStatus = "upcoming" | "taken" | "missed";

export type MedicineType = "Tablet" | "Capsule" | "Syrup" | "Injection" | "Drops" | "Other";

export interface Medicine {
  id: number;
  name: string;
  dosage: string;
  type: MedicineType;
  scheduleTime: string; // "HH:mm" (24h)
  startDate: string;    // "YYYY-MM-DD"
  notes: string;
  photoUri: string | null;
  status: MedicineStatus;
  notificationId: string | null;
  createdAt: string;
}