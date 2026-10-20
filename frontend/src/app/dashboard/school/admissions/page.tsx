"use client";

import ResourceManager from "@/components/school/ResourceManager";
import { usePermissions } from "@/lib/permissions";

export default function AdmissionsPage() {
  const { can } = usePermissions();
  return (
    <ResourceManager
      title="Admissions"
      subtitle="Track enquiries and applications through the admission pipeline."
      endpoint="/api/school/admissions"
      listKey="admissions"
      columns={[
        { key: "applicantName", label: "Applicant" },
        { key: "guardianName", label: "Guardian" },
        { key: "guardianPhone", label: "Phone" },
        { key: "classApplied", label: "Class Applied", render: (r) => {
          const c = r.classApplied as { name?: string; section?: string } | undefined;
          return c ? `${c.name ?? ""}${c.section ? ` - ${c.section}` : ""}` : "—";
        } },
        { key: "status", label: "Status" },
        { key: "source", label: "Source" },
      ]}
      fields={[
        { name: "applicantName", label: "Applicant Name", required: true },
        { name: "gender", label: "Gender", type: "select", options: [
          { value: "MALE", label: "Male" }, { value: "FEMALE", label: "Female" }, { value: "OTHER", label: "Other" },
        ] },
        { name: "guardianName", label: "Guardian Name", required: true },
        { name: "guardianPhone", label: "Guardian Phone", required: true },
        { name: "guardianEmail", label: "Guardian Email" },
        { name: "classAppliedId", label: "Class Applied", type: "select", optionsEndpoint: "/api/school/classes", optionsKey: "classes", optionLabelField: "name", optionLabelExtraField: "section" },
        { name: "status", label: "Status", type: "select", options: [
          { value: "NEW", label: "New" }, { value: "CONTACTED", label: "Contacted" }, { value: "INTERVIEW", label: "Interview" },
          { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }, { value: "ADMITTED", label: "Admitted" },
        ] },
        { name: "source", label: "Source", placeholder: "Walk-in / Website / Referral" },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      allowCreate={can("admissions.create")}
      allowEdit={can("admissions.edit")}
      allowDelete={can("admissions.edit")}
    />
  );
}
