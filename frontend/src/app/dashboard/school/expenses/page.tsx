"use client";

import ResourceManager from "@/components/school/ResourceManager";
import { usePermissions } from "@/lib/permissions";

export default function ExpensesPage() {
  const { can } = usePermissions();
  return (
    <ResourceManager
      title="Expenses"
      subtitle="Record and track school operating expenses."
      endpoint="/api/school/expenses"
      listKey="expenses"
      columns={[
        { key: "category", label: "Category" },
        { key: "description", label: "Description" },
        { key: "amount", label: "Amount", render: (r) => `PKR ${Number(r.amount || 0).toLocaleString()}` },
        { key: "date", label: "Date", render: (r) => (r.date ? new Date(String(r.date)).toLocaleDateString() : "—") },
        { key: "paymentMethod", label: "Method" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "category", label: "Category", type: "select", required: true, options: [
          { value: "RENT", label: "Rent" }, { value: "UTILITIES", label: "Utilities" }, { value: "SALARY", label: "Salary" },
          { value: "MAINTENANCE", label: "Maintenance" }, { value: "SUPPLIES", label: "Supplies" }, { value: "TRANSPORT", label: "Transport" },
          { value: "LIBRARY", label: "Library" }, { value: "EVENTS", label: "Events" }, { value: "MARKETING", label: "Marketing" },
          { value: "EQUIPMENT", label: "Equipment" }, { value: "OTHER", label: "Other" },
        ] },
        { name: "description", label: "Description", required: true },
        { name: "amount", label: "Amount (PKR)", type: "number", required: true },
        { name: "date", label: "Date", type: "date" },
        { name: "paymentMethod", label: "Payment Method", type: "select", options: [
          { value: "CASH", label: "Cash" }, { value: "BANK_TRANSFER", label: "Bank Transfer" }, { value: "CARD", label: "Card" },
          { value: "ONLINE", label: "Online" }, { value: "JAZZCASH", label: "JazzCash" }, { value: "EASYPAISA", label: "EasyPaisa" },
        ] },
        { name: "reference", label: "Reference" },
        { name: "status", label: "Status", type: "select", options: [
          { value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" },
          { value: "REJECTED", label: "Rejected" }, { value: "PAID", label: "Paid" },
        ] },
        { name: "notes", label: "Notes", type: "textarea" },
      ]}
      allowCreate={can("expenses.create")}
      allowEdit={can("expenses.edit")}
      allowDelete={can("expenses.edit")}
    />
  );
}
