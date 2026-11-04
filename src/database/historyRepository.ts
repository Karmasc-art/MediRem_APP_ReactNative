import { getDb } from "./database";
import { isActiveOn, listMedicines } from "./medicineRepository";
import { DoseItem, Medicine, MedicineStatus } from "../types/medicine";
import { dateTimeFrom } from "../utils/dateUtils";

interface LogRow {
  medicineId: number;
  status: string;
}

/** A saved "taken" log wins. Otherwise a dose is missed once its time has passed. */
function computeStatus(
  logged: MedicineStatus | undefined,
  date: string,
  time: string
): MedicineStatus {
  if (logged) return logged;
  return dateTimeFrom(date, time).getTime() < Date.now() ? "missed" : "upcoming";
}

export async function getDosesForDate(
  userId: string,
  date: string,
  query = ""
): Promise<DoseItem[]> {
  const db = await getDb();
  const medicines = await listMedicines(userId, query);
  const logs = await db.getAllAsync<LogRow>(
    "SELECT medicineId, status FROM dose_logs WHERE date = ?",
    [date]
  );
  const logMap = new Map<number, MedicineStatus>();
  logs.forEach((l) => logMap.set(l.medicineId, l.status as MedicineStatus));

  return medicines
    .filter((m) => isActiveOn(m, date))
    .map((m) => ({
      medicine: m,
      date,
      status: computeStatus(logMap.get(m.id), date, m.scheduleTime),
    }))
    .sort(
      (a, b) =>
        a.medicine.scheduleTime.localeCompare(b.medicine.scheduleTime) ||
        a.medicine.name.localeCompare(b.medicine.name)
    );
}

/** Status of one medicine on one date, or null if it isn't scheduled that day. */
export async function getDoseStatus(
  medicine: Medicine,
  date: string
): Promise<MedicineStatus | null> {
  if (!isActiveOn(medicine, date)) return null;
  const db = await getDb();
  const row = await db.getFirstAsync<LogRow>(
    "SELECT medicineId, status FROM dose_logs WHERE medicineId = ? AND date = ?",
    [medicine.id, date]
  );
  return computeStatus(row?.status as MedicineStatus | undefined, date, medicine.scheduleTime);
}

export async function markTaken(medicineId: number, date: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO dose_logs (medicineId, date, status, loggedAt)
     VALUES (?, ?, 'taken', ?)
     ON CONFLICT(medicineId, date)
     DO UPDATE SET status = excluded.status, loggedAt = excluded.loggedAt`,
    [medicineId, date, new Date().toISOString()]
  );
}

/** Removes the "taken" log so the dose goes back to upcoming or missed. */
export async function clearDose(medicineId: number, date: string): Promise<void> {
  const db = await getDb();
  await db.runAsync("DELETE FROM dose_logs WHERE medicineId = ? AND date = ?", [
    medicineId,
    date,
  ]);
}