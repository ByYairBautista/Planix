# Planix — Tu vida, en orden

Aplicación de productividad y organización personal desarrollada con **Next.js 16, React 19, TypeScript y Tailwind CSS**. Almacenamiento persistente en `localStorage` (intercambiable con Supabase).

## Módulos funcionales

| Módulo | Ruta | Funcionalidades clave |
|--------|------|----------------------|
| Dashboard | `/dashboard` | Saludo por hora, fecha, reloj en vivo, resumen de tareas, progreso diario, "Mi día" cronológico, próximas alarmas y recordatorios |
| Tareas | `/tasks` | CRUD completo, subtareas, notas, etiquetas, prioridad, categorías, repetición, vistas (Todas/Hoy/Próximamente/Completadas/Atrasadas/Favoritas), búsqueda y filtros |
| Recordatorios | `/reminders` | Crear, editar, eliminar, anticipación del aviso, asociación a tareas, marcar como atendidos, posponer, historial |
| Alarmas | `/alarmas` | Interruptores on/off, hora + días de repetición, nombre, sonido, volumen, vibración, duración, repetición de sonido, snooze (5/10/15 min), cuenta regresiva, pantalla de alarma activada con detener/posponer, sonido nativo Web Audio |
| Calendario | `/calendar` | Vista mensual con indicadores de actividad, crear tarea/recordatorio desde una fecha |
| Estadísticas | `/stats` | Tareas completadas, % productividad, pendientes, atrasadas, racha, actividad por categoría |
| Búsqueda | `/search` | Búsqueda global en tareas, recordatorios, alarmas y categorías |
| Configuración | `/settings` | Perfil, tema claro/oscuro, notificaciones, sonidos, formato 12/24h, primer día de semana, zona horaria, exportar/resetear datos, cerrar sesión |

## Tecnología

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript (estricto)
- Tailwind CSS (diseño claro/oscuro)
- Persistencia: `localStorage` (capa de datos en `lib/storage.ts`, reemplazable por Supabase)
- Sonidos de alarma: Web Audio API (sin archivos externos)

## Diseño

- Paleta: fondo `#F8F9FB`, superficie `#FFFFFF`, texto `#191B20`, acento `#7775E8`, éxito `#43A581`, alerta `#E56C75`
- Modo oscuro equilibrado con excelente contraste
- Bordes redondeados, sombras sutiles, animaciones suaves, tipografía legible
- Barra de navegación inferior (móvil) y barra lateral (escritorio), FAB flotante

## Cómo ejecutar

```bash
cd C:\Users\Admin\Desktop\Auren\auren\planix
npm install
npm run dev      # http://localhost:3001 (o 3000 si está libre)
npm run build    # build de producción
```

Al entrar se accede directamente al dashboard (sin pantalla de login). Los datos se guardan localmente en el navegador.

Para instalar Planix, abre **Configuración → Instalar aplicación** desde un navegador compatible y sigue la solicitud o las instrucciones que aparezcan. La instalación web requiere HTTPS en producción; en iPhone/iPad se realiza desde **Compartir → Añadir a pantalla de inicio** en Safari.

## Publicar en GitHub Pages

El proyecto exporta un sitio estático en `out/` y se publica con el workflow `.github/workflows/deploy.yml`. El workflow usa automáticamente el nombre del repositorio como subruta (por ejemplo, `/Planix`) y despliega al hacer push a `main` o `master`.

1. En GitHub, abre **Settings → Pages** y selecciona **GitHub Actions** como fuente de publicación.
2. Sube los cambios a `main` o `master`, o ejecuta manualmente el workflow **Deploy to GitHub Pages** en la pestaña **Actions**.
3. La URL del proyecto será `https://<usuario>.github.io/Planix/`.

Para comprobar la exportación localmente, ejecuta `npm run build`; el sitio generado queda en `out/`. Las alarmas y recordatorios siguen requiriendo que la app esté abierta.

## Notas importantes sobre alarmas y recordatorios web

Esta es una aplicación web. Las alarmas y los recordatorios se supervisan mientras Planix está abierta. Las alarmas usan Web Audio API y los recordatorios usan notificaciones del navegador cuando tienen permiso; si no, muestran un aviso dentro de Planix. **No se garantiza que suenen o notifiquen con la aplicación cerrada o el dispositivo bloqueado** (limitación del navegador). En una versión móvil (React Native/Expo) se usarían notificaciones locales y APIs nativas de alarmas.
