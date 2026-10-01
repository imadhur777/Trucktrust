import { RoleTabs } from "@/src/components/role-tabs";

export default function DriverLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Loads", sf: "shippingbox.fill", icon: "clipboard-list" },
        { name: "trips", title: "Trips", sf: "map.fill", icon: "map-marker-path" },
        { name: "profile", title: "Profile", sf: "person.fill", icon: "account" },
      ]}
    />
  );
}
