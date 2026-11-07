import { Suspense } from "react";
import EditTaskClient from "./EditTaskClient";

export default function EditTaskPage() {
  return (
    <Suspense fallback={null}>
      <EditTaskClient />
    </Suspense>
  );
}
