"use client";

import ResourceManager from "@/components/school/ResourceManager";

export default function HostelPage() {
  return (
    <ResourceManager
      title="Hostels"
      subtitle="Manage hostel buildings and wardens."
      endpoint="/api/school/hostels"
      listKey="hostels"
      columns={[
        { key: "name", label: "Hostel" },
        { key: "type", label: "Type" },
        { key: "wardenName", label: "Warden" },
        { key: "wardenPhone", label: "Warden Phone" },
        { key: "capacity", label: "Capacity" },
        { key: "isActive", label: "Active" },
      ]}
      fields={[
        { name: "name", label: "Hostel Name", required: true },
        { name: "type", label: "Type", type: "select", options: [
          { value: "BOYS", label: "Boys" }, { value: "GIRLS", label: "Girls" }, { value: "MIXED", label: "Mixed" },
        ] },
        { name: "wardenName", label: "Warden Name" },
        { name: "wardenPhone", label: "Warden Phone" },
        { name: "address", label: "Address" },
        { name: "capacity", label: "Capacity", type: "number" },
        { name: "isActive", label: "Active", type: "boolean" },
      ]}
    />
  );
}
