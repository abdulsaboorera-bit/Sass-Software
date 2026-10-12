"use client";

import ResourceManager from "@/components/school/ResourceManager";

export default function FeeStructuresPage() {
  return (
    <ResourceManager
      title="Fee Structures"
      subtitle="Define the fee plan for each class."
      endpoint="/api/school/fee-structures"
      listKey="feeStructures"
      columns={[
        { key: "name", label: "Name" },
        { key: "class", label: "Class", render: (r) => {
          const c = r.class as { name?: string; section?: string } | undefined;
          return c ? `${c.name ?? ""}${c.section ? ` - ${c.section}` : ""}` : "—";
        } },
        { key: "frequency", label: "Frequency" },
        { key: "amount", label: "Amount", render: (r) => `PKR ${Number(r.amount || 0).toLocaleString()}` },
        { key: "isActive", label: "Active" },
      ]}
      fields={[
        { name: "name", label: "Name", required: true, placeholder: "Monthly Fee" },
        { name: "classId", label: "Class", type: "select", required: true, optionsEndpoint: "/api/school/classes", optionsKey: "classes", optionLabelField: "name", optionLabelExtraField: "section" },
        { name: "frequency", label: "Frequency", type: "select", options: [
          { value: "MONTHLY", label: "Monthly" }, { value: "TERM", label: "Term" },
          { value: "ANNUAL", label: "Annual" }, { value: "ONE_TIME", label: "One Time" },
        ] },
        { name: "amount", label: "Amount (PKR)", type: "number", required: true },
        { name: "isActive", label: "Active", type: "boolean" },
      ]}
    />
  );
}
