import type {
  User,
  Category,
  Task,
  Reminder,
  Alarm,
  Preference,
  DbData,
} from "@/lib/types";

const STORAGE_KEY = "planix_db";
const DEMO_USER_ID = "user_demo_001";

export function demoUserId() {
  return DEMO_USER_ID;
}

/* ------------------------------------------------------------------ */
/*  Seed data                                                         */
/* ------------------------------------------------------------------ */

const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;

function fmt(d: Date) {
  return d.toISOString();
}

function fmtDay(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export const seed: DbData = {
  user: {
    id: DEMO_USER_ID,
    name: "Usuario",
    email: "usuario@planix.app",
    avatar: null,
    theme: "light",
    createdAt: fmt(new Date(now - 7 * oneDay)),
  },
  preferences: {
    userId: DEMO_USER_ID,
    notifications: true,
    sounds: true,
    timeFormat: 24,
    firstDayOfWeek: 1, // Monday
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  categories: [
    {
      id: "cat_personal",
      userId: DEMO_USER_ID,
      name: "Personal",
      color: "#2e3a59",
      icon: "User",
      createdAt: fmt(new Date(now - 6 * oneDay)),
      updatedAt: fmt(new Date(now - 6 * oneDay)),
    },
    {
      id: "cat_trabajo",
      userId: DEMO_USER_ID,
      name: "Trabajo",
      color: "#2563EB",
      icon: "Briefcase",
      createdAt: fmt(new Date(now - 6 * oneDay)),
      updatedAt: fmt(new Date(now - 6 * oneDay)),
    },
    {
      id: "cat_estudios",
      userId: DEMO_USER_ID,
      name: "Estudios",
      color: "#0EA5E9",
      icon: "BookOpen",
      createdAt: fmt(new Date(now - 5 * oneDay)),
      updatedAt: fmt(new Date(now - 5 * oneDay)),
    },
    {
      id: "cat_salud",
      userId: DEMO_USER_ID,
      name: "Salud",
      color: "#10B981",
      icon: "Heart",
      createdAt: fmt(new Date(now - 5 * oneDay)),
      updatedAt: fmt(new Date(now - 5 * oneDay)),
    },
    {
      id: "cat_finanzas",
      userId: DEMO_USER_ID,
      name: "Finanzas",
      color: "#F59E0B",
      icon: "Coins",
      createdAt: fmt(new Date(now - 4 * oneDay)),
      updatedAt: fmt(new Date(now - 4 * oneDay)),
    },
    {
      id: "cat_compras",
      userId: DEMO_USER_ID,
      name: "Compras",
      color: "#EC4899",
      icon: "ShoppingBag",
      createdAt: fmt(new Date(now - 4 * oneDay)),
      updatedAt: fmt(new Date(now - 4 * oneDay)),
    },
    {
      id: "cat_hogar",
      userId: DEMO_USER_ID,
      name: "Hogar",
      color: "#8B5CF6",
      icon: "Home",
      createdAt: fmt(new Date(now - 3 * oneDay)),
      updatedAt: fmt(new Date(now - 3 * oneDay)),
    },
    {
      id: "cat_proyectos",
      userId: DEMO_USER_ID,
      name: "Proyectos",
      color: "#EF4444",
      icon: "Folder",
      createdAt: fmt(new Date(now - 3 * oneDay)),
      updatedAt: fmt(new Date(now - 3 * oneDay)),
    },
  ],
  tasks: [
    {
      id: "task_1",
      userId: DEMO_USER_ID,
      categoryId: "cat_trabajo",
      title: "Revisar propuesta de diseño",
      description: "Revisar los mockups de la nueva pantalla de alarmas",
      dueDate: fmtDay(new Date(now - oneDay)),
      dueTime: "09:30",
      priority: "alta",
      completed: true,
      completedAt: fmt(new Date(now - 12 * 60 * 60 * 1000)),
      favorite: true,
      tags: ["diseño", "revisión"],
      notes: "Pendiente de feedback del equipo de producto.",
      subtasks: [
        { id: "st_1", taskId: "task_1", title: "Abrir archivo Figma", completed: true },
        { id: "st_2", taskId: "task_1", title: "Comentar ajustes", completed: false },
      ],
      repeat: "none",
      repeatConfig: null,
      createdAt: fmt(new Date(now - 3 * oneDay)),
      updatedAt: fmt(new Date(now - 12 * 60 * 60 * 1000)),
    },
    {
      id: "task_2",
      userId: DEMO_USER_ID,
      categoryId: "cat_personal",
      title: "Comprar víveres para la semana",
      description: "Leche, huevos, pan, frutas y verduras",
      dueDate: fmtDay(new Date(now)),
      dueTime: "18:00",
      priority: "media",
      completed: false,
      completedAt: null,
      favorite: true,
      tags: ["compras", "hogar"],
      notes: "Ir al supermercado de la esquina.",
      subtasks: [],
      repeat: "semanal",
      repeatConfig: { every: 1, weekdays: [1, 2, 3, 4, 5, 6, 0] },
      createdAt: fmt(new Date(now - 2 * oneDay)),
      updatedAt: fmt(new Date(now - 2 * oneDay)),
    },
    {
      id: "task_3",
      userId: DEMO_USER_ID,
      categoryId: "cat_estudios",
      title: "Entregar proyecto final",
      description: "Subir repositorio y presentación",
      dueDate: fmtDay(new Date(now + 2 * oneDay)),
      dueTime: "23:59",
      priority: "urgente",
      completed: false,
      completedAt: null,
      favorite: true,
      tags: ["escuela", "entrega"],
      notes: "No olvidar incluir el README.",
      subtasks: [
        { id: "st_3", taskId: "task_3", title: "Escribir documentación", completed: false },
        { id: "st_4", taskId: "task_3", title: "Grabar video demo", completed: false },
      ],
      repeat: "none",
      repeatConfig: null,
      createdAt: fmt(new Date(now - 5 * oneDay)),
      updatedAt: fmt(new Date(now - 5 * oneDay)),
    },
    {
      id: "task_4",
      userId: DEMO_USER_ID,
      categoryId: "cat_salud",
      title: "Control médico",
      description: "Chequeo anual con el cardiólogo",
      dueDate: fmtDay(new Date(now + 5 * oneDay)),
      dueTime: "10:00",
      priority: "baja",
      completed: false,
      completedAt: null,
      favorite: false,
      tags: ["salud"],
      notes: "",
      subtasks: [],
      repeat: "none",
      repeatConfig: null,
      createdAt: fmt(new Date(now - 1 * oneDay)),
      updatedAt: fmt(new Date(now - 1 * oneDay)),
    },
    {
      id: "task_5",
      userId: DEMO_USER_ID,
      categoryId: "cat_trabajo",
      title: "Actualizar documentación",
      description: "Documentar endpoints de la API",
      dueDate: fmtDay(new Date(now - 2 * oneDay)),
      dueTime: "14:00",
      priority: "media",
      completed: false,
      completedAt: null,
      favorite: false,
      tags: ["documentación"],
      notes: "",
      subtasks: [],
      repeat: "none",
      repeatConfig: null,
      createdAt: fmt(new Date(now - 4 * oneDay)),
      updatedAt: fmt(new Date(now - 4 * oneDay)),
    },
  ],
  reminders: [],
  alarms: [
    {
      id: "alarm_1",
      userId: DEMO_USER_ID,
      time: "07:00",
      days: [1, 2, 3, 4, 5],
      active: true,
      name: "Despertar laboral",
      sound: "classic",
      volume: 0.8,
      vibrate: true,
      duration: 60,
      repeatCount: 3,
      snoozeInterval: 5,
      nextTrigger: null,
      createdAt: fmt(new Date(now - 10 * oneDay)),
      updatedAt: fmt(new Date(now - 10 * oneDay)),
    },
    {
      id: "alarm_2",
      userId: DEMO_USER_ID,
      time: "12:30",
      days: [1, 2, 3, 4, 5],
      active: false,
      name: "Hora del almuerzo",
      sound: "gentle",
      volume: 0.6,
      vibrate: false,
      duration: 30,
      repeatCount: 1,
      snoozeInterval: 10,
      nextTrigger: null,
      createdAt: fmt(new Date(now - 8 * oneDay)),
      updatedAt: fmt(new Date(now - 8 * oneDay)),
    },
    {
      id: "alarm_3",
      userId: DEMO_USER_ID,
      time: "22:00",
      days: [0, 1, 2, 3, 4, 5, 6],
      active: true,
      name: "Hora de dormir",
      sound: "calm",
      volume: 0.5,
      vibrate: true,
      duration: 45,
      repeatCount: 2,
      snoozeInterval: 15,
      nextTrigger: null,
      createdAt: fmt(new Date(now - 6 * oneDay)),
      updatedAt: fmt(new Date(now - 6 * oneDay)),
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Persistence                                                       */
/* ------------------------------------------------------------------ */

function loadDb(): DbData {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as DbData;
    // Merge with seed to guarantee new fields exist after updates
    return mergeDb(seed, parsed);
  } catch {
    return seed;
  }
}

function saveDb(db: DbData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function mergeDb(seed: DbData, db: DbData): DbData {
  const normalizedTasks = (db.tasks?.length ? db.tasks : seed.tasks).map((t) => {
    const base = { ...t, description: t.description ?? "", notes: t.notes ?? "", tags: Array.isArray(t.tags) ? t.tags : [], subtasks: Array.isArray(t.subtasks) ? t.subtasks : [] };
    if (base.dueDate && base.dueDate.includes("T")) {
      const d = new Date(base.dueDate);
      if (!isNaN(d.getTime())) {
        return { ...base, dueDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` };
      }
    }
    return base;
  });
  return {
    user: db.user ?? seed.user,
    preferences: db.preferences ?? seed.preferences,
    categories: db.categories?.length ? db.categories : seed.categories,
    tasks: normalizedTasks,
    reminders: db.reminders ?? [],
    alarms: db.alarms?.length ? db.alarms : seed.alarms,
  };
}

let dbCache: DbData | null = null;

export function getDb(): DbData {
  if (!dbCache) dbCache = loadDb();
  return dbCache;
}

export function setDb(updater: (db: DbData) => DbData | void): DbData {
  const current = getDb();
  const next = updater(current) ?? current;
  dbCache = next;
  saveDb(next);
  return next;
}

export function resetDb() {
  dbCache = seed;
  saveDb(seed);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

export function generateId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function getUserId(db: DbData) {
  return db.user?.id || DEMO_USER_ID;
}
