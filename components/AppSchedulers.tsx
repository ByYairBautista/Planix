"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/providers";
import { nextReminderOccurrence, nowIso } from "@/lib/date-utils";
import { playAlarmSound, stopAllSounds } from "@/lib/sounds";
import { notifyToast } from "@/components/Toast";
import { Button } from "@/components/ui";
import type { Alarm, Reminder } from "@/lib/types";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const REMINDER_NOTICE_KEY = "planix_notified_reminders";

function nextAlarmTrigger(alarm: Alarm, after: number) {
  const [hours, minutes] = alarm.time.split(":").map(Number);
  for (let offset = 0; offset < 8; offset += 1) {
    const date = new Date(after);
    date.setDate(date.getDate() + offset);
    date.setHours(hours, minutes, 0, 0);
    if (alarm.days.includes(date.getDay()) && date.getTime() > after) {
      return date.toISOString();
    }
  }
  return null;
}

function occurrenceKey(reminder: Reminder, kind: "anticipation" | "due") {
  return `${reminder.id}:${reminder.datetime}:${kind}`;
}

function readNotifiedOccurrences() {
  try {
    const saved = localStorage.getItem(REMINDER_NOTICE_KEY);
    return new Set<string>(saved ? JSON.parse(saved) as string[] : []);
  } catch (error) {
    console.error("No se pudieron leer los avisos ya enviados.", error);
    return new Set<string>();
  }
}

function sendReminderNotice(title: string, body: string, notificationsEnabled: boolean) {
  if (!notificationsEnabled) return;
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: `${basePath}/icons/icon-192.png` });
      return;
    } catch (error) {
      console.error("No se pudo mostrar la notificación del navegador.", error);
    }
  }
  notifyToast(`${title}: ${body}`, "info");
}

function advanceReminder(
  datetime: string,
  repeat: Exclude<Reminder["repeat"], "none">,
  now: number,
  monthlyDay?: number,
): string {
  for (let count = 0; count < 1200 && new Date(datetime).getTime() <= now; count += 1) {
    datetime = nextReminderOccurrence(datetime, repeat, monthlyDay);
  }
  return datetime;
}

export default function AppSchedulers() {
  const { db, saveDb, preferences } = useApp();
  const [activeAlarm, setActiveAlarm] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState("--:--:--");
  const activeAlarmRef = useRef<Alarm | null>(null);
  const notifiedRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const now = Date.now();
      setCurrentTime(new Date(now).toLocaleTimeString("es", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }));

      if (activeAlarmRef.current) return;
      for (const alarm of db.alarms) {
        if (!alarm.active) continue;
        if (!alarm.nextTrigger) {
          const nextTrigger = nextAlarmTrigger(alarm, now);
          if (nextTrigger) {
            saveDb((current) => ({
              ...current,
              alarms: current.alarms.map((item) =>
                item.id === alarm.id ? { ...item, nextTrigger, updatedAt: nowIso() } : item,
              ),
            }));
            break;
          }
          continue;
        }
        if (new Date(alarm.nextTrigger).getTime() > now) continue;

        const nextTrigger = nextAlarmTrigger(alarm, now);
        const triggeredAlarm = { ...alarm, nextTrigger };
        activeAlarmRef.current = triggeredAlarm;
        setActiveAlarm(triggeredAlarm);
        saveDb((current) => ({
          ...current,
          alarms: current.alarms.map((item) =>
            item.id === alarm.id
              ? { ...item, nextTrigger, updatedAt: nowIso() }
              : item,
          ),
        }));
        try {
          playAlarmSound(alarm.sound, alarm.volume, alarm.duration, alarm.repeatCount);
        } catch (error) {
          console.error("No se pudo reproducir el sonido de la alarma.", error);
          notifyToast("No se pudo reproducir el sonido de la alarma.", "error");
        }
        if (alarm.vibrate && "vibrate" in navigator) {
          navigator.vibrate([500, 250, 500]);
        }
        break;
      }
    }, 1000);
    return () => window.clearInterval(interval);
  }, [db.alarms, saveDb]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (notifiedRef.current === null) notifiedRef.current = readNotifiedOccurrences();
      const notified = notifiedRef.current;
      const now = Date.now();
      let updatedReminders: Reminder[] | null = null;

      for (const reminder of db.reminders) {
        if (reminder.attended) continue;
        const reminderTime = new Date(reminder.datetime).getTime();
        if (!Number.isFinite(reminderTime)) continue;

        const due = reminderTime <= now;
        const anticipationTime = reminderTime - reminder.anticipation * 60_000;
        const anticipationKey = occurrenceKey(reminder, "anticipation");
        const dueKey = occurrenceKey(reminder, "due");

        if (reminder.anticipation > 0 && anticipationTime <= now && !notified.has(anticipationKey)) {
          sendReminderNotice(
            "Recordatorio próximo",
            `${reminder.title} (${reminder.anticipation} min antes)`,
            preferences.notifications,
          );
          notified.add(anticipationKey);
        }

        if (due && !notified.has(dueKey)) {
          sendReminderNotice("Recordatorio", reminder.title, preferences.notifications);
          notified.add(dueKey);
        }

        if (due && reminder.repeat !== "none") {
          const nextDatetime = advanceReminder(
            reminder.datetime,
            reminder.repeat,
            now,
            reminder.repeatConfig?.dayOfMonth,
          );
          const nextReminder = { ...reminder, datetime: nextDatetime, attended: false, attendedAt: null };
          if (!updatedReminders) updatedReminders = db.reminders.slice();
          const index = updatedReminders.findIndex((item) => item.id === reminder.id);
          updatedReminders[index] = nextReminder;
        }
      }

      try {
        localStorage.setItem(REMINDER_NOTICE_KEY, JSON.stringify([...notified].slice(-500)));
      } catch (error) {
        console.error("No se pudieron guardar los avisos enviados.", error);
      }
      if (updatedReminders) {
        saveDb((current) => ({
          ...current,
          reminders: current.reminders.map((reminder) =>
            updatedReminders?.find((item) => item.id === reminder.id) ?? reminder,
          ),
        }));
      }
    }, 10_000);
    return () => window.clearInterval(interval);
  }, [db.reminders, preferences.notifications, saveDb]);

  useEffect(() => {
    if (!activeAlarm?.vibrate || !("vibrate" in navigator)) return;
    const interval = window.setInterval(() => navigator.vibrate([500, 250, 500]), 1800);
    return () => window.clearInterval(interval);
  }, [activeAlarm]);

  const dismissAlarm = () => {
    stopAllSounds();
    if ("vibrate" in navigator) navigator.vibrate(0);
    activeAlarmRef.current = null;
    setActiveAlarm(null);
  };

  const snoozeAlarm = () => {
    if (!activeAlarm) return;
    const nextTrigger = new Date(Date.now() + activeAlarm.snoozeInterval * 60_000).toISOString();
    saveDb((current) => ({
      ...current,
      alarms: current.alarms.map((alarm) =>
        alarm.id === activeAlarm.id
          ? { ...alarm, nextTrigger, active: true, updatedAt: nowIso() }
          : alarm,
      ),
    }));
    dismissAlarm();
  };

  return activeAlarm ? (
    <div className="fixed inset-0 z-[100] bg-black/[0.85] flex flex-col items-center justify-center p-6 text-white fade-in">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-[var(--color-alert)] pulse-dot" />
          <span className="text-sm font-medium text-white/70 uppercase tracking-wider">Alarma activada</span>
        </div>
        <h2 className="text-5xl font-bold mt-2 mb-2">{activeAlarm.name}</h2>
        <div className="text-4xl font-mono font-bold mb-6">{currentTime}</div>
        <p className="text-white/70 mb-8">Es hora de atender tu compromiso.</p>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={dismissAlarm} className="flex-1">Detener</Button>
          <Button variant="primary" onClick={snoozeAlarm} className="flex-1">
            Posponer {activeAlarm.snoozeInterval} min
          </Button>
        </div>
      </div>
    </div>
  ) : null;
}
