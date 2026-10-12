"use client";

import ResourceManager from "@/components/school/ResourceManager";

export default function AssignmentsPage() {
  return (
    <ResourceManager
      title="Assignments"
      subtitle="Assign homework and projects to classes."
      endpoint="/api/school/assignments"
      listKey="assignments"
      columns={[
        { key: "title", label: "Title" },
        { key: "class", label: "Class", render: (r) => {
          const c = r.class as { name?: string; section?: string } | undefined;
          return c ? `${c.name ?? ""}${c.section ? ` - ${c.section}` : ""}` : "—";
        } },
        { key: "subject", label: "Subject", render: (r) => {
          const s = r.subject as { name?: string } | undefined;
          return s?.name || "—";
        } },
        { key: "dueDate", label: "Due", render: (r) => (r.dueDate ? new Date(String(r.dueDate)).toLocaleDateString() : "—") },
        { key: "maxMarks", label: "Max Marks" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "classId", label: "Class", type: "select", required: true, optionsEndpoint: "/api/school/classes", optionsKey: "classes", optionLabelField: "name", optionLabelExtraField: "section" },
        { name: "subjectId", label: "Subject", type: "select", optionsEndpoint: "/api/school/subjects", optionsKey: "subjects", optionLabelField: "name" },
        { name: "teacherId", label: "Teacher", type: "select", optionsEndpoint: "/api/school/teachers", optionsKey: "teachers", optionLabelField: "name" },
        { name: "dueDate", label: "Due Date", type: "date" },
        { name: "maxMarks", label: "Max Marks", type: "number" },
        { name: "status", label: "Status", type: "select", options: [
          { value: "OPEN", label: "Open" }, { value: "CLOSED", label: "Closed" },
        ] },
      ]}
    />
  );
}
