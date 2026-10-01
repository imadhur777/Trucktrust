export const TRUCK_TYPES = [
  "Container",
  "Open Body",
  "Trailer",
  "Tanker",
  "Refrigerated",
  "Mini Truck",
  "Flatbed",
];

export const BODY_TYPES = ["Open", "Closed", "Half Body", "Full Body"];

export const MATERIALS = [
  "General Goods",
  "Perishables",
  "Machinery",
  "Construction",
  "Chemicals",
  "Textiles",
  "Electronics",
];

export const ONBOARDING_KEY = "tt_onboarding_done";

export const HERO_IMAGE =
  "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?crop=entropy&cs=srgb&fm=jpg&w=1200&q=80";

export const SHIPPER_EMPTY_IMAGE =
  "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwxfHx3YXJlaG91c2UlMjBsb2dpc3RpY3MlMjBzdXBwbHklMjBjaGFpbnxlbnwwfHx8fDE3OTA4NDcyMTR8MA&ixlib=rb-4.1.0&q=85";

export const DRIVER_EMPTY_IMAGE =
  "https://images.unsplash.com/photo-1756888218644-aeb9c044e1df?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzR8MHwxfHNlYXJjaHwyfHxlbXB0eSUyMHRydWNrJTIwdHJhaWxlciUyMGNhcmdvfGVufDB8fHx8MTc5MDg0NzIxNHww&ixlib=rb-4.1.0&q=85";

export function formatMoney(n: number | undefined | null): string {
  if (n == null) return "₹0";
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
