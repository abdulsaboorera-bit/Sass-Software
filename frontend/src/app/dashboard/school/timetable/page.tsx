"use client";

import ResourceManager, { type Row } from "@/components/school/ResourceManager";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function parsePeriods(payload: Row): Row {
  const raw = payload.periods;
  delete payload.periods;
  let periods: unknown[] = [];
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) periods = parsed;
    } catch {
      periods = [];
    }
  }
  return { ...payload, periods };
}

export default function TimetablePage() {
  return (
    <ResourceManager
      title="Timetable"
      subtitle="Class schedules by day of the week."
      endpoint="/api/school/timetable"
      listKey="timetable"
      columns={[
        { key: "class", label: "Class", render: (r) => {
          const c = r.class as { name?: string; section?: string } | undefined;
          return c ? `${c.name ?? ""}${c.section ? ` - ${c.section}` : ""}` : "—";
        } },
        { key: "dayOfWeek", label: "Day", render: (r) => DAYS[Number(r.dayOfWeek)] ?? "—" },
        { key: "periods", label: "Periods", render: (r) => (Array.isArray(r.periods) ? String(r.periods.length) : "0") },
      ]}
      fields={[
        { name: "classId", label: "Class", type: "select", required: true, optionsEndpoint: "/api/school/classes", optionsKey: "classes", optionLabelField: "name", optionLabelExtraField: "section" },
        { name: "dayOfWeek", label: "Day", type: "select", required: true, options: DAYS.map((d, i) => ({ value: String(i), label: d })) },
        { name: "periods", label: "Periods (JSON)", type: "textarea", placeholder: '[{"period":1,"startTime":"08:00","endTime":"08:45","room":"A1"}]', help: "Optional. Paste a JSON array of periods." },
      ]}
      transformCreate={parsePeriods}
      transformUpdate={parsePeriods}
    />
  );
}
