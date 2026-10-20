"use client";

import ResourceManager from "@/components/school/ResourceManager";
import { usePermissions } from "@/lib/permissions";

export default function TransportPage() {
  const { can } = usePermissions();
  return (
    <ResourceManager
      title="Transport"
      subtitle="Manage bus routes, vehicles, and drivers."
      endpoint="/api/school/transport/routes"
      listKey="routes"
      columns={[
        { key: "name", label: "Route" },
        { key: "vehicleNo", label: "Vehicle #" },
        { key: "driverName", label: "Driver" },
        { key: "driverPhone", label: "Driver Phone" },
        { key: "capacity", label: "Capacity" },
        { key: "fare", label: "Fare", render: (r) => `PKR ${Number(r.fare || 0).toLocaleString()}` },
        { key: "isActive", label: "Active" },
      ]}
      fields={[
        { name: "name", label: "Route Name", required: true },
        { name: "vehicleNo", label: "Vehicle Number" },
        { name: "driverName", label: "Driver Name" },
        { name: "driverPhone", label: "Driver Phone" },
        { name: "conductorName", label: "Conductor Name" },
        { name: "capacity", label: "Capacity", type: "number" },
        { name: "fare", label: "Monthly Fare (PKR)", type: "number" },
        { name: "isActive", label: "Active", type: "boolean" },
      ]}
      allowCreate={can("transport.create")}
      allowEdit={can("transport.edit")}
      allowDelete={can("transport.edit")}
    />
  );
}
