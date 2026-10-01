import { storage } from "@/src/utils/storage";

const BASE = (process.env.EXPO_PUBLIC_BACKEND_URL as string) + "/api";
export const TOKEN_KEY = "tt_access_token";

async function request<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof detail === "string" ? detail : "Request failed");
  }
  return data as T;
}

export const api = {
  get: <T = any>(p: string) => request<T>(p),
  post: <T = any>(p: string, body?: any) =>
    request<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T = any>(p: string, body?: any) =>
    request<T>(p, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
};

// ---- Types ----
export type Role = "shipper" | "driver" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  company: string;
  truck_type: string;
  capacity: string;
  verified: boolean;
  kyc_status: string;
  rating_avg: number;
  rating_count: number;
  created_at: string;
}

export interface Load {
  id: string;
  shipper_id: string;
  shipper_name: string;
  pickup: string;
  drop: string;
  date: string;
  weight: string;
  material: string;
  truck_type: string;
  body_type: string;
  special_requirements: string;
  expected_price: number;
  status: "open" | "booked" | "completed" | "cancelled";
  created_at: string;
  offer_count: number;
  my_offer?: Offer | null;
}

export interface Offer {
  id: string;
  load_id: string;
  driver_id: string;
  driver_name: string;
  driver_rating: number;
  driver_truck_type: string;
  amount: number;
  message: string;
  status: "pending" | "countered" | "accepted" | "rejected";
  last_by: "driver" | "shipper";
  created_at: string;
}

export interface Booking {
  id: string;
  booking_ref: string;
  load_id: string;
  shipper_id: string;
  shipper_name: string;
  driver_id: string;
  driver_name: string;
  pickup: string;
  drop: string;
  date: string;
  weight: string;
  truck_type: string;
  amount: number;
  platform_fee: number;
  driver_payout: number;
  status: "confirmed" | "in_progress" | "completed" | "cancelled";
  payment_status: "unpaid" | "paid";
  trip_status: "assigned" | "in_transit" | "delivered";
  pickup_otp: string | null;
  delivery_otp: string | null;
  pickup_verified: boolean;
  delivery_verified: boolean;
  rated_by_shipper: boolean;
  rated_by_driver: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  load_id: string;
  thread_with: string;
  sender_id: string;
  sender_role: Role;
  type: "text" | "offer";
  text: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  booking_id: string;
  booking_ref: string;
  raised_by: string;
  raised_by_name: string;
  subject: string;
  description: string;
  status: "open" | "resolved";
  created_at: string;
}
