import { Suspense } from "react";
import EditTaskClient from "./EditTaskClient";

export default function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      {params.then(({ id }) => (
        <EditTaskClient taskId={id} />
      ))}
    </Suspense>
  );
}
