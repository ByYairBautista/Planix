export type Theme = "light" | "dark";
export type Priority = "baja" | "media" | "alta" | "urgente";
export type TaskRepeat = "none" | "diaria" | "semanal" | "mensual" | "personalizada";
export type ReminderRepeat = "none" | "diaria" | "semanal" | "mensual";
export type AlarmSound = "classic" | "gentle" | "calm" | "beep";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  theme: Theme;
  createdAt: string;
}

export interface Preference {
  userId: string;
  notifications: boolean;
  sounds: boolean;
  timeFormat: 12 | 24;
  firstDayOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  timezone: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string;
  description: string;
  dueDate: string | null; // ISO date only (YYYY-MM-DD)
  dueTime: string | null; // HH:mm
  priority: Priority;
  completed: boolean;
  completedAt: string | null;
  favorite: boolean;
  tags: string[];
  notes: string;
  subtasks: Subtask[];
  repeat: TaskRepeat;
  repeatConfig: {
    every: number;
    weekdays?: number[]; // 0-6
    monthDay?: number;   // 1-31
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  taskId: string | null;
  title: string;
  description: string;
  datetime: string; // ISO
  anticipation: number; // minutes before
  repeat: ReminderRepeat;
  repeatConfig?: { dayOfMonth?: number } | null;
  attended: boolean;
  attendedAt: string | null;
  createdAt: string;
}

export interface Alarm {
  id: string;
  userId: string;
  time: string; // HH:mm
  days: number[]; // 0-6
  active: boolean;
  name: string;
  sound: AlarmSound;
  volume: number; // 0-1
  vibrate: boolean;
  duration: number; // seconds
  repeatCount: number; // how many times to repeat the sound
  snoozeInterval: 5 | 10 | 15;
  nextTrigger: string | null; // ISO
  createdAt: string;
  updatedAt: string;
}

export interface DbData {
  user: User;
  preferences: Preference;
  categories: Category[];
  tasks: Task[];
  reminders: Reminder[];
  alarms: Alarm[];
}

export type View = "todas" | "hoy" | "proximamente" | "completadas" | "atrasadas" | "favoritas";
