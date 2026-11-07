"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TaskFormModal } from "@/components/TaskFormModal";

export default function EditTaskClient({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const goBack = () => {
    setOpen(false);
    router.push("/tasks");
  };

  return (
    <TaskFormModal open={open} onClose={goBack} mode="edit" taskId={taskId} onSuccess={goBack} />
  );
}
