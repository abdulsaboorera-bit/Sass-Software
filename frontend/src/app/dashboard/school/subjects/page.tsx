"use client";

import ResourceManager from "@/components/school/ResourceManager";
import { usePermissions } from "@/lib/permissions";

export default function SubjectsPage() {
  const { can } = usePermissions();
  return (
    <ResourceManager
      title="Subjects"
      subtitle="Subjects taught per class, with assigned teachers."
      endpoint="/api/school/subjects"
      listKey="subjects"
      columns={[
        { key: "name", label: "Subject" },
        { key: "code", label: "Code" },
        { key: "class", label: "Class", render: (r) => {
          const c = r.class as { name?: string; section?: string } | undefined;
          return c ? `${c.name ?? ""}${c.section ? ` - ${c.section}` : ""}` : "—";
        } },
        { key: "teacher", label: "Teacher", render: (r) => {
          const t = r.teacher as { name?: string } | undefined;
          return t?.name || "—";
        } },
        { key: "totalMarks", label: "Total Marks" },
        { key: "passingMarks", label: "Passing" },
      ]}
      fields={[
        { name: "name", label: "Subject Name", required: true },
        { name: "code", label: "Code" },
        { name: "classId", label: "Class", type: "select", required: true, optionsEndpoint: "/api/school/classes", optionsKey: "classes", optionLabelField: "name", optionLabelExtraField: "section" },
        { name: "teacherId", label: "Teacher", type: "select", optionsEndpoint: "/api/school/teachers", optionsKey: "teachers", optionLabelField: "name" },
        { name: "totalMarks", label: "Total Marks", type: "number" },
        { name: "passingMarks", label: "Passing Marks", type: "number" },
      ]}
      allowCreate={can("subjects.create")}
      allowEdit={can("subjects.edit")}
      allowDelete={can("subjects.edit")}
    />
  );
}
