import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { Medicine } from "../types/medicine";
import { addDays, dateTimeFrom, todayString } from "../utils/dateUtils";
import { listMedicines, setNotificationIds } from "../database/medicineRepository";
import { logger } from "../utils/logger";

export interface ReminderSettings {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface ScheduleResult {
  ids: string[];
  warning: string | null;
}

export type PermissionState = "granted" | "denied" | "undetermined";

const SETTINGS_KEY = "medirem.reminderSettings";
const DEFAULT_SETTINGS: ReminderSettings = { enabled: true, sound: true, vibration: true };

// Show reminders even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function loadSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch (error) {
    logger.warn("Could not load reminder settings", error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// Android notification channels cannot be changed after they are created,
// so each sound/vibration combination gets its own channel.
function channelIdFor(s: ReminderSettings): string {
  return `medirem-reminders-s${s.sound ? 1 : 0}-v${s.vibration ? 1 : 0}`;
}

async function ensureChannel(s: ReminderSettings): Promise<string | undefined> {
  if (Platform.OS !== "android") return undefined;
  const id = channelIdFor(s);
  try {
    await Notifications.setNotificationChannelAsync(id, {
      name: `Medicine reminders (${s.sound ? "sound" : "silent"}${s.vibration ? ", vibrate" : ""})`,
      importance: AndroidImportance.MAX,
      sound: s.sound ? "default" : null,
      enableVibrate: s.vibration,
      vibrationPattern: s.vibration ? [0, 300, 200, 300] : undefined,
      lightColor: "#2E7D32",
    });
    return id;
  } catch (error) {
    logger.warn("Custom notification channel unavailable; using the Expo fallback channel", error);
    return undefined;
  }
}

export async function getPermissionState(): Promise<PermissionState> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return "granted";
  return current.canAskAgain ? "undetermined" : "denied";
}

async function hasPermission(prompt: boolean): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!prompt || !current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function cancelReminders(ids: string[]): Promise<void> {
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      logger.warn("Could not cancel a reminder", error);
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function scheduleReminders(
  medicine: Medicine,
  options: { prompt?: boolean } = {}
): Promise<ScheduleResult> {
  const settings = await loadSettings();
  if (!settings.enabled) {
    return { ids: [], warning: "Reminders are turned off in Notification settings." };
  }

  let channelId: string | undefined;
  try {
    channelId = await ensureChannel(settings);
    const allowed = await hasPermission(!!options.prompt);
    if (!allowed) {
      return {
        ids: [],
        warning:
          "Notifications are not allowed for MediRem, so no reminder was set. Turn them on in your phone settings.",
      };
    }
  } catch (error) {
    logger.error("Notification setup failed", error);
    return { ids: [], warning: "Notifications could not be set up on this device." };
  }

  const content: Notifications.NotificationContentInput = {
    title: "Time for your medicine",
    body: `${medicine.name} • ${medicine.dosage}`,
    sound: settings.sound,
    data: { medicineId: medicine.id },
  };
  const [hour, minute] = medicine.scheduleTime.split(":").map(Number);
  const ids: string[] = [];

  try {
    const today = todayString();
    if (medicine.durationDays === 0 && medicine.startDate <= today) {
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
            ...(channelId ? { channelId } : {}),
          },
        })
      );
    } else {
      const days = medicine.durationDays === 0 ? 7 : Math.min(medicine.durationDays, 60);
      const now = Date.now();
      for (let i = 0; i < days; i++) {
        const when = dateTimeFrom(addDays(medicine.startDate, i), medicine.scheduleTime);
        if (when.getTime() <= now) continue;
        ids.push(
          await Notifications.scheduleNotificationAsync({
            content,
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: when,
              ...(channelId ? { channelId } : {}),
            },
          })
        );
      }
    }
  } catch (error) {
    logger.error("Scheduling reminders failed", error);
    await cancelReminders(ids);
    return { ids: [], warning: "The reminder could not be scheduled. Please try again." };
  }

  logger.info(`Scheduled ${ids.length} reminder(s)`);
  return { ids, warning: null };
}

/** Rebuilds every reminder for a user. Never shows a permission prompt. */
export async function rescheduleAll(userId: string): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const medicines = await listMedicines(userId);
  for (const medicine of medicines) {
    const result = await scheduleReminders(medicine, { prompt: false });
    await setNotificationIds(medicine.id, result.ids);
  }
  logger.info("All reminders rescheduled");
}

/** Sends a reminder in 5 seconds. Returns false if notifications are not allowed. */
export async function sendTestNotification(): Promise<boolean> {
  const settings = await loadSettings();
  const channelId = await ensureChannel(settings);
  if (!(await hasPermission(true))) return false;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "MediRem test reminder",
      body: "Your reminders are working.",
      sound: settings.sound,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      ...(channelId ? { channelId } : {}),
    },
  });
  return true;
}