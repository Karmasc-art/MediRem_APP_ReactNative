import { getDb } from "./database";
import { Medicine, MedicineInput, MedicineType } from "../types/medicine";
import { addDays } from "../utils/dateUtils";

interface MedicineRow {
  id: number;
  userId: string;
  name: string;
  dosage: string;
  type: string;
  scheduleTime: string;
  startDate: string;
  durationDays: number;
  notes: string;
  photoUri: string | null;
  notificationIds: string;
  createdAt: string;
}

function fromRow(row: MedicineRow): Medicine {
  let ids: string[] = [];
  try {
    ids = JSON.parse(row.notificationIds || "[]");
  } catch {
    ids = [];
  }
  return { ...row, type: row.type as MedicineType, notificationIds: ids };
}

/** Is this medicine scheduled on the given YYYY-MM-DD date? */
export function isActiveOn(medicine: Medicine, date: string): boolean {
  if (date < medicine.startDate) return false;
  if (medicine.durationDays === 0) return true;
  return date <= addDays(medicine.startDate, medicine.durationDays - 1);
}

export async function addMedicine(userId: string, input: MedicineInput): Promise<number> {
  const db = await getDb();
  const result = await db.runAsync(
    `INSERT INTO medicines
      (userId, name, dosage, type, scheduleTime, startDate, durationDays, notes, photoUri, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId, input.name, input.dosage, input.type, input.scheduleTime,
      input.startDate, input.durationDays, input.notes, input.photoUri,
      new Date().toISOString(),
    ]
  );
  return result.lastInsertRowId;
}

export async function updateMedicine(
  userId: string,
  id: number,
  input: MedicineInput
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `UPDATE medicines
     SET name = ?, dosage = ?, type = ?, scheduleTime = ?, startDate = ?,
         durationDays = ?, notes = ?, photoUri = ?
     WHERE id = ? AND userId = ?`,
    [
      input.name, input.dosage, input.type, input.scheduleTime, input.startDate,
      input.durationDays, input.notes, input.photoUri, id, userId,
    ]
  );
}

export async function deleteMedicine(userId: string, id: number): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM dose_logs WHERE medicineId = ?", [id]);
  await db.runAsync("DELETE FROM medicines WHERE id = ? AND userId = ?", [id, userId]);
}

export async function getMedicine(userId: string, id: number): Promise<Medicine | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<MedicineRow>(
    "SELECT * FROM medicines WHERE id = ? AND userId = ?",
    [id, userId]
  );
  return row ? fromRow(row) : null;
}

export async function listMedicines(userId: string, query = ""): Promise<Medicine[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<MedicineRow>(
    `SELECT * FROM medicines
     WHERE userId = ? AND name LIKE ?
     ORDER BY name COLLATE NOCASE ASC`,
    [userId, `%${query.trim()}%`]
  );
  return rows.map(fromRow);
}

export async function listMedicinesForDate(userId: string, date: string): Promise<Medicine[]> {
  const all = await listMedicines(userId);
  return all
    .filter((m) => isActiveOn(m, date))
    .sort(
      (a, b) =>
        a.scheduleTime.localeCompare(b.scheduleTime) || a.name.localeCompare(b.name)
    );
}