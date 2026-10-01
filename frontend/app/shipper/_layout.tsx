import { RoleTabs } from "@/src/components/role-tabs";

export default function ShipperLayout() {
  return (
    <RoleTabs
      tabs={[
        { name: "index", title: "Loads", sf: "shippingbox.fill", icon: "package-variant-closed" },
        { name: "post", title: "Post", sf: "plus.circle.fill", icon: "plus-box" },
        { name: "trips", title: "Trips", sf: "map.fill", icon: "map-marker-path" },
        { name: "profile", title: "Profile", sf: "person.fill", icon: "account" },
      ]}
    />
  );
}
