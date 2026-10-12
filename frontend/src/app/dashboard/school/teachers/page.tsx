"use client";

import ResourceManager from "@/components/school/ResourceManager";

export default function TeachersPage() {
  return (
    <ResourceManager
      title="Teachers"
      subtitle="Manage your teaching and administrative staff."
      endpoint="/api/school/teachers"
      listKey="teachers"
      columns={[
        { key: "name", label: "Name" },
        { key: "employeeNo", label: "Employee #" },
        { key: "designation", label: "Designation" },
        { key: "specialization", label: "Specialization" },
        { key: "phone", label: "Phone" },
        { key: "salary", label: "Salary", render: (r) => `PKR ${Number(r.salary || 0).toLocaleString()}` },
        { key: "isActive", label: "Active" },
      ]}
      fields={[
        { name: "name", label: "Full Name", required: true },
        { name: "employeeNo", label: "Employee #", help: "Leave blank to auto-generate" },
        { name: "designation", label: "Designation", placeholder: "Teacher" },
        { name: "specialization", label: "Specialization" },
        { name: "qualification", label: "Qualification" },
        { name: "gender", label: "Gender", type: "select", options: [
          { value: "MALE", label: "Male" }, { value: "FEMALE", label: "Female" }, { value: "OTHER", label: "Other" },
        ] },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email" },
        { name: "salary", label: "Monthly Salary (PKR)", type: "number" },
        { name: "joinDate", label: "Join Date", type: "date" },
        { name: "isActive", label: "Active", type: "boolean" },
      ]}
    />
  );
}
