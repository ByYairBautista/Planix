"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TaskFormModal } from "@/components/TaskFormModal";

export default function NewTaskClient() {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const goBack = () => {
    setOpen(false);
    router.push("/tasks");
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <TaskFormModal open={open} onClose={goBack} mode="create" onSuccess={goBack} />
    </div>
  );
}
