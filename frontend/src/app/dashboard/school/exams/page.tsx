"use client";

import ResourceManager from "@/components/school/ResourceManager";
import { usePermissions } from "@/lib/permissions";

export default function ExamsPage() {
  const { can } = usePermissions();
  return (
    <ResourceManager
      title="Exams"
      subtitle="Schedule exams per class and publish results."
      endpoint="/api/school/exams"
      listKey="exams"
      columns={[
        { key: "name", label: "Exam" },
        { key: "term", label: "Term" },
        { key: "class", label: "Class", render: (r) => {
          const c = r.class as { name?: string; section?: string } | undefined;
          return c ? `${c.name ?? ""}${c.section ? ` - ${c.section}` : ""}` : "—";
        } },
        { key: "startDate", label: "Start", render: (r) => (r.startDate ? new Date(String(r.startDate)).toLocaleDateString() : "—") },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "name", label: "Exam Name", required: true },
        { name: "term", label: "Term", type: "select", options: [
          { value: "TERM_1", label: "Term 1" }, { value: "TERM_2", label: "Term 2" }, { value: "TERM_3", label: "Term 3" },
          { value: "MIDTERM", label: "Midterm" }, { value: "FINAL", label: "Final" }, { value: "OTHER", label: "Other" },
        ] },
        { name: "classId", label: "Class", type: "select", required: true, optionsEndpoint: "/api/school/classes", optionsKey: "classes", optionLabelField: "name", optionLabelExtraField: "section" },
        { name: "startDate", label: "Start Date", type: "date" },
        { name: "endDate", label: "End Date", type: "date" },
        { name: "status", label: "Status", type: "select", options: [
          { value: "SCHEDULED", label: "Scheduled" }, { value: "ONGOING", label: "Ongoing" },
          { value: "COMPLETED", label: "Completed" }, { value: "CANCELLED", label: "Cancelled" },
        ] },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      allowCreate={can("exams.create")}
      allowEdit={can("exams.edit")}
      allowDelete={can("exams.edit")}
    />
  );
}
