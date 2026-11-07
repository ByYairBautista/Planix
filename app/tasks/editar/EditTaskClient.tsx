"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TaskFormModal } from "@/components/TaskFormModal";

export default function EditTaskClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("id");
  const [open, setOpen] = useState(true);

  const goBack = () => {
    setOpen(false);
    router.push("/tasks");
  };

  if (!taskId) {
    return (
      <div className="p-6 text-center">
        <p className="mb-4">No se especificó la tarea que quieres editar.</p>
        <button type="button" onClick={goBack} className="text-[var(--color-accent)] underline">
          Volver a tareas
        </button>
      </div>
    );
  }

  return (
    <TaskFormModal
      open={open}
      onClose={goBack}
      mode="edit"
      taskId={taskId}
      onSuccess={goBack}
    />
  );
}
