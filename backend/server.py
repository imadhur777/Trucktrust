from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import random
import uuid
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

import jwt
import bcrypt
from pydantic import BaseModel, EmailStr, Field

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---------------------------------------------------------------------------
# Config & DB
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
TOKEN_DAYS = 30
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
PLATFORM_FEE_PCT = 0.08  # 8% commission

app = FastAPI(title="TruckTrust API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trucktrust")

Role = Literal["shipper", "driver", "admin"]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


def gen_otp() -> str:
    return f"{random.randint(100000, 999999)}"


MAX_OTP_ATTEMPTS = 5


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def make_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def public_user(u: dict) -> dict:
    return {
        "id": u["id"],
        "email": u["email"],
        "name": u.get("name", ""),
        "phone": u.get("phone", ""),
        "role": u["role"],
        "company": u.get("company", ""),
        "truck_type": u.get("truck_type", ""),
        "capacity": u.get("capacity", ""),
        "verified": u.get("verified", False),
        "kyc_status": u.get("kyc_status", "pending"),
        "rating_avg": u.get("rating_avg", 0),
        "rating_count": u.get("rating_count", 0),
        "created_at": u.get("created_at", ""),
    }


async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        uid = claims["sub"]
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    u = await db.users.find_one({"id": uid}, {"_id": 0})
    if not u or u.get("disabled"):
        raise HTTPException(401, "Account unavailable")
    return u


def require_role(*roles: str):
    async def dep(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(403, "Insufficient permissions")
        return user

    return dep


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str
    phone: str = ""
    role: Literal["shipper", "driver"] = "shipper"
    company: str = ""
    truck_type: str = ""
    capacity: str = ""


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    truck_type: Optional[str] = None
    capacity: Optional[str] = None


class LoadIn(BaseModel):
    pickup: str
    drop: str
    date: str
    weight: str
    material: str
    truck_type: str
    body_type: str = ""
    special_requirements: str = ""
    expected_price: float


class OfferIn(BaseModel):
    amount: float
    message: str = ""


class CounterIn(BaseModel):
    amount: float
    message: str = ""


class MessageIn(BaseModel):
    text: str


class OtpIn(BaseModel):
    otp: str


class RatingIn(BaseModel):
    stars: int = Field(ge=1, le=5)
    review: str = ""


class DisputeIn(BaseModel):
    booking_id: str
    subject: str
    description: str


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api.post("/auth/register")
async def register(body: RegisterIn):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(409, "Email already registered")
    doc = {
        "id": new_id(),
        "email": email,
        "password_hash": hash_pw(body.password),
        "name": body.name,
        "phone": body.phone,
        "role": body.role,
        "company": body.company,
        "truck_type": body.truck_type,
        "capacity": body.capacity,
        "verified": False,
        "kyc_status": "pending",
        "rating_avg": 0,
        "rating_count": 0,
        "disabled": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    token = make_token(doc["id"])
    return {"access_token": token, "user": public_user(doc)}


@api.post("/auth/login")
async def login(body: LoginIn):
    u = await db.users.find_one({"email": body.email.lower()})
    if not u or not verify_pw(body.password, u["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = make_token(u["id"])
    return {"access_token": token, "user": public_user(u)}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return public_user(user)


@api.put("/auth/me")
async def update_me(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    updates = {k: v for k, v in body.dict().items() if v is not None}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    u = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return public_user(u)


# ---------------------------------------------------------------------------
# Loads
# ---------------------------------------------------------------------------
async def _load_with_offer_count(load: dict) -> dict:
    load["offer_count"] = await db.offers.count_documents(
        {"load_id": load["id"], "status": {"$ne": "rejected"}}
    )
    return load


@api.post("/loads")
async def create_load(body: LoadIn, user: dict = Depends(require_role("shipper"))):
    doc = {
        "id": new_id(),
        "shipper_id": user["id"],
        "shipper_name": user.get("name", ""),
        **body.dict(),
        "status": "open",
        "created_at": now_iso(),
    }
    await db.loads.insert_one(doc)
    doc.pop("_id", None)
    return await _load_with_offer_count(doc)


@api.get("/loads/mine")
async def my_loads(user: dict = Depends(require_role("shipper"))):
    loads = await db.loads.find({"shipper_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [await _load_with_offer_count(l) for l in loads]


@api.get("/loads")
async def available_loads(truck_type: Optional[str] = None, user: dict = Depends(require_role("driver"))):
    q: dict = {"status": "open"}
    if truck_type and truck_type != "All":
        q["truck_type"] = truck_type
    loads = await db.loads.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    out = []
    for l in loads:
        l = await _load_with_offer_count(l)
        existing = await db.offers.find_one(
            {"load_id": l["id"], "driver_id": user["id"]}, {"_id": 0}
        )
        l["my_offer"] = existing
        out.append(l)
    return out


@api.get("/loads/{load_id}")
async def get_load(load_id: str, user: dict = Depends(get_current_user)):
    load = await db.loads.find_one({"id": load_id}, {"_id": 0})
    if not load:
        raise HTTPException(404, "Load not found")
    return await _load_with_offer_count(load)


# ---------------------------------------------------------------------------
# Offers & Negotiation
# ---------------------------------------------------------------------------
@api.post("/loads/{load_id}/offers")
async def make_offer(load_id: str, body: OfferIn, user: dict = Depends(require_role("driver"))):
    load = await db.loads.find_one({"id": load_id})
    if not load:
        raise HTTPException(404, "Load not found")
    if load["status"] != "open":
        raise HTTPException(400, "Load is no longer open")
    doc = {
        "id": new_id(),
        "load_id": load_id,
        "driver_id": user["id"],
        "driver_name": user.get("name", ""),
        "driver_rating": user.get("rating_avg", 0),
        "driver_truck_type": user.get("truck_type", ""),
        "amount": body.amount,
        "message": body.message,
        "status": "pending",
        "last_by": "driver",
        "created_at": now_iso(),
    }
    await db.offers.insert_one(doc)
    doc.pop("_id", None)
    await db.messages.insert_one({
        "id": new_id(), "load_id": load_id, "thread_with": user["id"],
        "sender_id": user["id"], "sender_role": "driver", "type": "offer",
        "text": f"Offered Rs {int(body.amount)}", "created_at": now_iso(),
    })
    return doc


@api.get("/loads/{load_id}/offers")
async def list_offers(load_id: str, user: dict = Depends(get_current_user)):
    load = await db.loads.find_one({"id": load_id})
    if not load:
        raise HTTPException(404, "Load not found")
    if user["role"] == "admin" or user["id"] == load["shipper_id"]:
        offers = await db.offers.find({"load_id": load_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    elif user["role"] == "driver":
        # A driver may only see their own offer on a load.
        offers = await db.offers.find(
            {"load_id": load_id, "driver_id": user["id"]}, {"_id": 0}
        ).sort("created_at", -1).to_list(200)
    else:
        raise HTTPException(403, "Not allowed")
    return offers


@api.post("/offers/{offer_id}/counter")
async def counter_offer(offer_id: str, body: CounterIn, user: dict = Depends(get_current_user)):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(404, "Offer not found")
    load = await db.loads.find_one({"id": offer["load_id"]})
    if not load:
        raise HTTPException(404, "Load not found")
    # Only the load's shipper or the offer's own driver can negotiate.
    if user["id"] not in (load["shipper_id"], offer["driver_id"]):
        raise HTTPException(403, "Not a party to this offer")
    role = "shipper" if user["id"] == load["shipper_id"] else "driver"
    await db.offers.update_one(
        {"id": offer_id},
        {"$set": {"amount": body.amount, "status": "countered", "last_by": role,
                  "message": body.message, "updated_at": now_iso()}},
    )
    await db.messages.insert_one({
        "id": new_id(), "load_id": offer["load_id"], "thread_with": offer["driver_id"],
        "sender_id": user["id"], "sender_role": role, "type": "offer",
        "text": f"Countered at Rs {int(body.amount)}", "created_at": now_iso(),
    })
    return await db.offers.find_one({"id": offer_id}, {"_id": 0})


@api.post("/offers/{offer_id}/reject")
async def reject_offer(offer_id: str, user: dict = Depends(require_role("shipper"))):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(404, "Offer not found")
    load = await db.loads.find_one({"id": offer["load_id"]})
    if not load or load["shipper_id"] != user["id"]:
        raise HTTPException(403, "Not your load")
    await db.offers.update_one({"id": offer_id}, {"$set": {"status": "rejected"}})
    return {"ok": True}


@api.post("/offers/{offer_id}/accept")
async def accept_offer(offer_id: str, user: dict = Depends(require_role("shipper"))):
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(404, "Offer not found")
    load = await db.loads.find_one({"id": offer["load_id"]})
    if load["shipper_id"] != user["id"]:
        raise HTTPException(403, "Not your load")
    if load["status"] != "open":
        raise HTTPException(400, "Load already booked")

    amount = offer["amount"]
    fee = round(amount * PLATFORM_FEE_PCT, 2)
    booking = {
        "id": new_id(),
        "booking_ref": "TT" + new_id().split("-")[0].upper(),
        "load_id": load["id"],
        "offer_id": offer_id,
        "shipper_id": load["shipper_id"],
        "shipper_name": load.get("shipper_name", ""),
        "driver_id": offer["driver_id"],
        "driver_name": offer.get("driver_name", ""),
        "pickup": load["pickup"],
        "drop": load["drop"],
        "date": load["date"],
        "weight": load["weight"],
        "truck_type": load["truck_type"],
        "amount": amount,
        "platform_fee": fee,
        "driver_payout": round(amount - fee, 2),
        "status": "confirmed",
        "payment_status": "unpaid",
        "trip_status": "assigned",
        "pickup_otp": gen_otp(),
        "delivery_otp": gen_otp(),
        "pickup_verified": False,
        "delivery_verified": False,
        "rated_by_shipper": False,
        "rated_by_driver": False,
        "created_at": now_iso(),
    }
    await db.bookings.insert_one(booking)
    await db.offers.update_one({"id": offer_id}, {"$set": {"status": "accepted"}})
    await db.offers.update_many(
        {"load_id": load["id"], "id": {"$ne": offer_id}}, {"$set": {"status": "rejected"}}
    )
    await db.loads.update_one({"id": load["id"]}, {"$set": {"status": "booked"}})
    booking.pop("_id", None)
    return booking


# ---------------------------------------------------------------------------
# Negotiation messages
# ---------------------------------------------------------------------------
async def _authorized_thread(load_id: str, with_user: Optional[str], user: dict) -> tuple:
    load = await db.loads.find_one({"id": load_id})
    if not load:
        raise HTTPException(404, "Load not found")
    if user["role"] == "admin":
        return load, (with_user or load["shipper_id"])
    if user["id"] == load["shipper_id"]:
        # Shipper must point at a driver who actually has an offer on this load.
        if not with_user:
            raise HTTPException(400, "with_user required")
        has_offer = await db.offers.find_one({"load_id": load_id, "driver_id": with_user})
        if not has_offer:
            raise HTTPException(403, "No such negotiation")
        return load, with_user
    if user["role"] == "driver":
        # A driver may only ever access their own thread.
        return load, user["id"]
    raise HTTPException(403, "Not a party to this load")


@api.get("/loads/{load_id}/messages")
async def get_messages(load_id: str, with_user: Optional[str] = None, user: dict = Depends(get_current_user)):
    _, thread = await _authorized_thread(load_id, with_user, user)
    msgs = await db.messages.find(
        {"load_id": load_id, "thread_with": thread}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return msgs


@api.post("/loads/{load_id}/messages")
async def post_message(load_id: str, body: MessageIn, with_user: Optional[str] = None,
                       user: dict = Depends(get_current_user)):
    _, thread_with = await _authorized_thread(load_id, with_user, user)
    doc = {
        "id": new_id(), "load_id": load_id, "thread_with": thread_with,
        "sender_id": user["id"], "sender_role": user["role"], "type": "text",
        "text": body.text, "created_at": now_iso(),
    }
    await db.messages.insert_one(doc)
    doc.pop("_id", None)
    return doc


# ---------------------------------------------------------------------------
# Bookings / Trips
# ---------------------------------------------------------------------------
def _mask_otps(b: dict, user: dict):
    if user["role"] == "driver":
        b["pickup_otp"] = b.get("pickup_otp") if b.get("pickup_verified") else None
        b["delivery_otp"] = b.get("delivery_otp") if b.get("delivery_verified") else None


@api.get("/bookings/mine")
async def my_bookings(user: dict = Depends(get_current_user)):
    key = "shipper_id" if user["role"] == "shipper" else "driver_id"
    bookings = await db.bookings.find({key: user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for b in bookings:
        _mask_otps(b, user)
    return bookings


@api.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not b:
        raise HTTPException(404, "Booking not found")
    if user["id"] not in (b["shipper_id"], b["driver_id"]) and user["role"] != "admin":
        raise HTTPException(403, "Not allowed")
    _mask_otps(b, user)
    return b


@api.post("/bookings/{booking_id}/pay")
async def pay_booking(booking_id: str, user: dict = Depends(require_role("shipper"))):
    b = await db.bookings.find_one({"id": booking_id})
    if not b or b["shipper_id"] != user["id"]:
        raise HTTPException(404, "Booking not found")
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"payment_status": "paid", "paid_at": now_iso(), "payout_status": "pending"}},
    )
    out = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    _mask_otps(out, user)
    return out


@api.post("/bookings/{booking_id}/verify-pickup")
async def verify_pickup(booking_id: str, body: OtpIn, user: dict = Depends(require_role("driver"))):
    b = await db.bookings.find_one({"id": booking_id})
    if not b or b["driver_id"] != user["id"]:
        raise HTTPException(404, "Booking not found")
    if b.get("pickup_attempts", 0) >= MAX_OTP_ATTEMPTS:
        raise HTTPException(429, "Too many incorrect attempts. Contact support.")
    if body.otp != b["pickup_otp"]:
        await db.bookings.update_one({"id": booking_id}, {"$inc": {"pickup_attempts": 1}})
        raise HTTPException(400, "Incorrect pickup OTP")
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"pickup_verified": True, "trip_status": "in_transit",
                  "status": "in_progress", "picked_up_at": now_iso()}},
    )
    out = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    _mask_otps(out, user)
    return out


@api.post("/bookings/{booking_id}/verify-delivery")
async def verify_delivery(booking_id: str, body: OtpIn, user: dict = Depends(require_role("driver"))):
    b = await db.bookings.find_one({"id": booking_id})
    if not b or b["driver_id"] != user["id"]:
        raise HTTPException(404, "Booking not found")
    if not b.get("pickup_verified"):
        raise HTTPException(400, "Verify pickup first")
    if b.get("delivery_attempts", 0) >= MAX_OTP_ATTEMPTS:
        raise HTTPException(429, "Too many incorrect attempts. Contact support.")
    if body.otp != b["delivery_otp"]:
        await db.bookings.update_one({"id": booking_id}, {"$inc": {"delivery_attempts": 1}})
        raise HTTPException(400, "Incorrect delivery OTP")
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"delivery_verified": True, "trip_status": "delivered",
                  "status": "completed", "delivered_at": now_iso()}},
    )
    await db.loads.update_one({"id": b["load_id"]}, {"$set": {"status": "completed"}})
    out = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    _mask_otps(out, user)
    return out


@api.post("/bookings/{booking_id}/rate")
async def rate_booking(booking_id: str, body: RatingIn, user: dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": booking_id})
    if not b:
        raise HTTPException(404, "Booking not found")
    if b["status"] != "completed":
        raise HTTPException(400, "Trip not completed yet")
    is_shipper = user["id"] == b["shipper_id"]
    is_driver = user["id"] == b["driver_id"]
    if not (is_shipper or is_driver):
        raise HTTPException(403, "Not allowed")
    target_id = b["driver_id"] if is_shipper else b["shipper_id"]
    flag = "rated_by_shipper" if is_shipper else "rated_by_driver"
    if b.get(flag):
        raise HTTPException(400, "Already rated")
    await db.ratings.insert_one({
        "id": new_id(), "booking_id": booking_id, "from_id": user["id"],
        "to_id": target_id, "stars": body.stars, "review": body.review,
        "created_at": now_iso(),
    })
    await db.bookings.update_one({"id": booking_id}, {"$set": {flag: True}})
    agg = await db.ratings.find({"to_id": target_id}, {"_id": 0}).to_list(1000)
    avg = round(sum(r["stars"] for r in agg) / len(agg), 1)
    await db.users.update_one({"id": target_id}, {"$set": {"rating_avg": avg, "rating_count": len(agg)}})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Disputes
# ---------------------------------------------------------------------------
@api.post("/disputes")
async def create_dispute(body: DisputeIn, user: dict = Depends(get_current_user)):
    b = await db.bookings.find_one({"id": body.booking_id})
    if not b:
        raise HTTPException(404, "Booking not found")
    if user["id"] not in (b["shipper_id"], b["driver_id"]) and user["role"] != "admin":
        raise HTTPException(403, "Not a party to this booking")
    doc = {
        "id": new_id(), "booking_id": body.booking_id, "booking_ref": b.get("booking_ref", ""),
        "raised_by": user["id"], "raised_by_name": user.get("name", ""),
        "subject": body.subject, "description": body.description,
        "status": "open", "created_at": now_iso(),
    }
    await db.disputes.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/disputes/mine")
async def my_disputes(user: dict = Depends(get_current_user)):
    return await db.disputes.find({"raised_by": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)


# ---------------------------------------------------------------------------
# Admin
# ---------------------------------------------------------------------------
@api.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_role("admin"))):
    gmv = 0.0
    async for b in db.bookings.find({"payment_status": "paid"}):
        gmv += b.get("amount", 0)
    return {
        "users": await db.users.count_documents({}),
        "shippers": await db.users.count_documents({"role": "shipper"}),
        "drivers": await db.users.count_documents({"role": "driver"}),
        "loads": await db.loads.count_documents({}),
        "open_loads": await db.loads.count_documents({"status": "open"}),
        "bookings": await db.bookings.count_documents({}),
        "active_trips": await db.bookings.count_documents({"status": "in_progress"}),
        "completed_trips": await db.bookings.count_documents({"status": "completed"}),
        "open_disputes": await db.disputes.count_documents({"status": "open"}),
        "gmv": round(gmv, 2),
    }


@api.get("/admin/users")
async def admin_users(user: dict = Depends(require_role("admin"))):
    return await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(1000)


@api.post("/admin/users/{user_id}/verify")
async def admin_verify_user(user_id: str, user: dict = Depends(require_role("admin"))):
    await db.users.update_one({"id": user_id}, {"$set": {"verified": True, "kyc_status": "verified"}})
    return {"ok": True}


@api.get("/admin/loads")
async def admin_loads(user: dict = Depends(require_role("admin"))):
    return await db.loads.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.get("/admin/bookings")
async def admin_bookings(user: dict = Depends(require_role("admin"))):
    return await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.get("/admin/disputes")
async def admin_disputes(user: dict = Depends(require_role("admin"))):
    return await db.disputes.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)


@api.post("/admin/disputes/{dispute_id}/resolve")
async def admin_resolve_dispute(dispute_id: str, user: dict = Depends(require_role("admin"))):
    await db.disputes.update_one(
        {"id": dispute_id}, {"$set": {"status": "resolved", "resolved_at": now_iso()}}
    )
    return {"ok": True}


@api.get("/")
async def root():
    return {"message": "TruckTrust API", "status": "ok"}


# ---------------------------------------------------------------------------
# Startup: indexes + idempotent admin seed
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.loads.create_index("status")
    await db.offers.create_index("load_id")
    email = ADMIN_EMAIL.lower()
    existing = await db.users.find_one({"email": email})
    if not existing:
        await db.users.insert_one({
            "id": new_id(), "email": email, "password_hash": hash_pw(ADMIN_PASSWORD),
            "name": "TruckTrust Admin", "phone": "", "role": "admin",
            "verified": True, "kyc_status": "verified", "rating_avg": 0,
            "rating_count": 0, "disabled": False, "created_at": now_iso(),
        })
        logger.info("Seeded admin account")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
