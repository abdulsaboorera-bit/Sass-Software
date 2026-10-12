"use client";

import ResourceManager from "@/components/school/ResourceManager";

export default function EventsPage() {
  return (
    <ResourceManager
      title="Events"
      subtitle="Plan academic events, holidays, and activities."
      endpoint="/api/school/events"
      listKey="events"
      columns={[
        { key: "title", label: "Title" },
        { key: "type", label: "Type" },
        { key: "location", label: "Location" },
        { key: "startDate", label: "Start", render: (r) => (r.startDate ? new Date(String(r.startDate)).toLocaleDateString() : "—") },
        { key: "endDate", label: "End", render: (r) => (r.endDate ? new Date(String(r.endDate)).toLocaleDateString() : "—") },
        { key: "isHoliday", label: "Holiday" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "type", label: "Type", type: "select", options: [
          { value: "ACADEMIC", label: "Academic" }, { value: "SPORTS", label: "Sports" }, { value: "CULTURAL", label: "Cultural" },
          { value: "HOLIDAY", label: "Holiday" }, { value: "EXAM", label: "Exam" }, { value: "MEETING", label: "Meeting" }, { value: "OTHER", label: "Other" },
        ] },
        { name: "location", label: "Location" },
        { name: "startDate", label: "Start Date", type: "date", required: true },
        { name: "endDate", label: "End Date", type: "date" },
        { name: "isHoliday", label: "Holiday", type: "boolean" },
      ]}
    />
  );
}
