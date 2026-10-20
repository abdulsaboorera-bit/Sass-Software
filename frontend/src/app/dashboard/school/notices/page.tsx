"use client";

import ResourceManager from "@/components/school/ResourceManager";
import { usePermissions } from "@/lib/permissions";

export default function NoticesPage() {
  const { can } = usePermissions();
  return (
    <ResourceManager
      title="Notices"
      subtitle="Publish notices and announcements to the school."
      endpoint="/api/school/notices"
      listKey="notices"
      columns={[
        { key: "title", label: "Title" },
        { key: "audience", label: "Audience" },
        { key: "isPinned", label: "Pinned" },
        { key: "publishedAt", label: "Published", render: (r) => (r.publishedAt ? new Date(String(r.publishedAt)).toLocaleDateString() : "—") },
        { key: "expiresAt", label: "Expires", render: (r) => (r.expiresAt ? new Date(String(r.expiresAt)).toLocaleDateString() : "—") },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "body", label: "Body", type: "textarea", required: true },
        { name: "audience", label: "Audience", type: "select", options: [
          { value: "ALL", label: "Everyone" }, { value: "STUDENTS", label: "Students" },
          { value: "TEACHERS", label: "Teachers" }, { value: "CLASS", label: "Specific Class" },
        ] },
        { name: "classId", label: "Class (if audience = Class)", type: "select", optionsEndpoint: "/api/school/classes", optionsKey: "classes", optionLabelField: "name", optionLabelExtraField: "section" },
        { name: "expiresAt", label: "Expires At", type: "date" },
        { name: "isPinned", label: "Pinned", type: "boolean" },
      ]}
      allowCreate={can("notices.create")}
      allowEdit={can("notices.edit")}
      allowDelete={can("notices.edit")}
    />
  );
}
