"""TruckTrust end-to-end backend tests (pytest).

Covers:
- Auth: register shipper/driver, login, /auth/me, update profile
- Admin: login, stats, users list, verify-user, loads/bookings/disputes
- Shipper: post load, my loads
- Driver: available loads with truck_type filter, make offer
- Offers: list, counter, reject, accept (creates booking)
- Messages: thread exchange
- Booking: pay (mock), pickup OTP, delivery OTP, status stepper fields
- Ratings & disputes
- RBAC: driver cannot hit admin endpoints
"""
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/") + "/api"
TIMEOUT = 20

ADMIN_EMAIL = "admin@trucktrust.com"
ADMIN_PASSWORD = "Admin@TruckTrust2026"

run_id = uuid.uuid4().hex[:8]
SHIPPER_EMAIL = f"test_shipper_{run_id}@example.com"
DRIVER_EMAIL = f"test_driver_{run_id}@example.com"
PASSWORD = "pass123"

state: dict = {}


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------- Health ----------
def test_root_ok():
    r = requests.get(BASE_URL + "/", timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Auth ----------
def test_register_shipper():
    r = requests.post(BASE_URL + "/auth/register", json={
        "email": SHIPPER_EMAIL, "password": PASSWORD, "name": "Test Shipper",
        "phone": "9999999999", "role": "shipper", "company": "TestCo",
    }, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data and data["user"]["role"] == "shipper"
    state["shipper_token"] = data["access_token"]
    state["shipper_id"] = data["user"]["id"]


def test_register_driver():
    r = requests.post(BASE_URL + "/auth/register", json={
        "email": DRIVER_EMAIL, "password": PASSWORD, "name": "Test Driver",
        "phone": "8888888888", "role": "driver", "truck_type": "Open Truck",
        "capacity": "10T",
    }, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["user"]["role"] == "driver"
    state["driver_token"] = data["access_token"]
    state["driver_id"] = data["user"]["id"]


def test_duplicate_registration_409():
    r = requests.post(BASE_URL + "/auth/register", json={
        "email": SHIPPER_EMAIL, "password": PASSWORD, "name": "X", "role": "shipper",
    }, timeout=TIMEOUT)
    assert r.status_code == 409


def test_login_shipper():
    r = requests.post(BASE_URL + "/auth/login",
                      json={"email": SHIPPER_EMAIL, "password": PASSWORD}, timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json()["user"]["email"] == SHIPPER_EMAIL


def test_login_wrong_password():
    r = requests.post(BASE_URL + "/auth/login",
                      json={"email": SHIPPER_EMAIL, "password": "wrong"}, timeout=TIMEOUT)
    assert r.status_code == 401


def test_auth_me():
    r = requests.get(BASE_URL + "/auth/me", headers=_auth(state["shipper_token"]), timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json()["email"] == SHIPPER_EMAIL


def test_update_profile():
    r = requests.put(BASE_URL + "/auth/me", headers=_auth(state["driver_token"]),
                     json={"capacity": "15T"}, timeout=TIMEOUT)
    assert r.status_code == 200 and r.json()["capacity"] == "15T"


# ---------- Admin ----------
def test_admin_login_and_stats():
    r = requests.post(BASE_URL + "/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    assert r.json()["user"]["role"] == "admin"
    state["admin_token"] = r.json()["access_token"]

    s = requests.get(BASE_URL + "/admin/stats", headers=_auth(state["admin_token"]), timeout=TIMEOUT)
    assert s.status_code == 200
    for k in ("users", "shippers", "drivers", "loads", "bookings", "gmv"):
        assert k in s.json()


def test_admin_list_endpoints():
    for p in ("/admin/users", "/admin/loads", "/admin/bookings", "/admin/disputes"):
        r = requests.get(BASE_URL + p, headers=_auth(state["admin_token"]), timeout=TIMEOUT)
        assert r.status_code == 200, f"{p} {r.text}"
        assert isinstance(r.json(), list)


def test_admin_verify_user():
    r = requests.post(BASE_URL + f"/admin/users/{state['driver_id']}/verify",
                      headers=_auth(state["admin_token"]), timeout=TIMEOUT)
    assert r.status_code == 200
    # Check persistence
    me = requests.get(BASE_URL + "/auth/me", headers=_auth(state["driver_token"]), timeout=TIMEOUT).json()
    assert me["verified"] is True and me["kyc_status"] == "verified"


# ---------- RBAC ----------
def test_driver_cannot_hit_admin():
    r = requests.get(BASE_URL + "/admin/stats", headers=_auth(state["driver_token"]), timeout=TIMEOUT)
    assert r.status_code == 403


def test_driver_cannot_post_load():
    r = requests.post(BASE_URL + "/loads", headers=_auth(state["driver_token"]), json={
        "pickup": "A", "drop": "B", "date": "2026-02-01", "weight": "5T",
        "material": "Cement", "truck_type": "Open Truck", "expected_price": 10000,
    }, timeout=TIMEOUT)
    assert r.status_code == 403


def test_shipper_cannot_list_available_loads():
    # /api/loads requires driver role
    r = requests.get(BASE_URL + "/loads", headers=_auth(state["shipper_token"]), timeout=TIMEOUT)
    assert r.status_code == 403


# ---------- Loads ----------
def test_post_load_and_mine():
    payload = {
        "pickup": "Mumbai", "drop": "Pune", "date": "2026-02-10", "weight": "8T",
        "material": "Steel", "truck_type": "Open Truck", "body_type": "Flatbed",
        "special_requirements": "Tarpaulin", "expected_price": 15000,
    }
    r = requests.post(BASE_URL + "/loads", headers=_auth(state["shipper_token"]),
                      json=payload, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    load = r.json()
    assert load["pickup"] == "Mumbai" and load["status"] == "open"
    state["load_id"] = load["id"]

    mine = requests.get(BASE_URL + "/loads/mine", headers=_auth(state["shipper_token"]),
                        timeout=TIMEOUT).json()
    assert any(ld["id"] == state["load_id"] for ld in mine)


def test_driver_feed_and_filter():
    all_loads = requests.get(BASE_URL + "/loads", headers=_auth(state["driver_token"]),
                             timeout=TIMEOUT).json()
    assert any(ld["id"] == state["load_id"] for ld in all_loads)

    filt = requests.get(BASE_URL + "/loads?truck_type=Open Truck",
                        headers=_auth(state["driver_token"]), timeout=TIMEOUT).json()
    assert any(ld["id"] == state["load_id"] for ld in filt)

    none_match = requests.get(BASE_URL + "/loads?truck_type=Container",
                              headers=_auth(state["driver_token"]), timeout=TIMEOUT).json()
    assert not any(ld["id"] == state["load_id"] for ld in none_match)


# ---------- Offers ----------
def test_make_counter_and_accept_offer():
    # Driver makes offer
    r = requests.post(BASE_URL + f"/loads/{state['load_id']}/offers",
                      headers=_auth(state["driver_token"]),
                      json={"amount": 14000, "message": "Can do"}, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    offer = r.json()
    assert offer["status"] == "pending"
    state["offer_id"] = offer["id"]

    # Shipper lists offers
    offers = requests.get(BASE_URL + f"/loads/{state['load_id']}/offers",
                          headers=_auth(state["shipper_token"]), timeout=TIMEOUT).json()
    assert len(offers) >= 1

    # Shipper counters
    c = requests.post(BASE_URL + f"/offers/{state['offer_id']}/counter",
                      headers=_auth(state["shipper_token"]),
                      json={"amount": 13500, "message": "Final"}, timeout=TIMEOUT)
    assert c.status_code == 200 and c.json()["amount"] == 13500
    assert c.json()["status"] == "countered"

    # Negotiation message
    m = requests.post(BASE_URL + f"/loads/{state['load_id']}/messages?with_user={state['driver_id']}",
                      headers=_auth(state["shipper_token"]),
                      json={"text": "Please confirm"}, timeout=TIMEOUT)
    assert m.status_code == 200
    msgs = requests.get(BASE_URL + f"/loads/{state['load_id']}/messages",
                        headers=_auth(state["driver_token"]), timeout=TIMEOUT).json()
    assert any(x.get("text") == "Please confirm" for x in msgs)

    # Shipper accepts -> booking
    a = requests.post(BASE_URL + f"/offers/{state['offer_id']}/accept",
                      headers=_auth(state["shipper_token"]), timeout=TIMEOUT)
    assert a.status_code == 200, a.text
    booking = a.json()
    assert booking["status"] == "confirmed"
    assert booking["trip_status"] == "assigned"
    assert booking["payment_status"] == "unpaid"
    assert "pickup_otp" in booking and "delivery_otp" in booking
    # 8% platform fee math
    assert round(booking["platform_fee"], 2) == round(booking["amount"] * 0.08, 2)
    state["booking_id"] = booking["id"]
    state["pickup_otp"] = booking["pickup_otp"]
    state["delivery_otp"] = booking["delivery_otp"]

    # Load marked booked
    ld = requests.get(BASE_URL + f"/loads/{state['load_id']}",
                      headers=_auth(state["shipper_token"]), timeout=TIMEOUT).json()
    assert ld["status"] == "booked"


# ---------- Booking / OTP ----------
def test_otp_masked_for_driver_before_verify():
    r = requests.get(BASE_URL + f"/bookings/{state['booking_id']}",
                     headers=_auth(state["driver_token"]), timeout=TIMEOUT)
    assert r.status_code == 200
    b = r.json()
    assert b["pickup_otp"] is None
    assert b["delivery_otp"] is None


def test_shipper_sees_otps():
    r = requests.get(BASE_URL + f"/bookings/{state['booking_id']}",
                     headers=_auth(state["shipper_token"]), timeout=TIMEOUT).json()
    assert r["pickup_otp"] == state["pickup_otp"]
    assert r["delivery_otp"] == state["delivery_otp"]


def test_pay_booking_mock():
    r = requests.post(BASE_URL + f"/bookings/{state['booking_id']}/pay",
                      headers=_auth(state["shipper_token"]), timeout=TIMEOUT)
    assert r.status_code == 200
    assert r.json()["payment_status"] == "paid"


def test_wrong_pickup_otp_rejected():
    r = requests.post(BASE_URL + f"/bookings/{state['booking_id']}/verify-pickup",
                      headers=_auth(state["driver_token"]),
                      json={"otp": "0000"}, timeout=TIMEOUT)
    assert r.status_code == 400


def test_cannot_verify_delivery_before_pickup():
    r = requests.post(BASE_URL + f"/bookings/{state['booking_id']}/verify-delivery",
                      headers=_auth(state["driver_token"]),
                      json={"otp": state["delivery_otp"]}, timeout=TIMEOUT)
    assert r.status_code == 400


def test_verify_pickup_then_delivery():
    p = requests.post(BASE_URL + f"/bookings/{state['booking_id']}/verify-pickup",
                      headers=_auth(state["driver_token"]),
                      json={"otp": state["pickup_otp"]}, timeout=TIMEOUT)
    assert p.status_code == 200
    assert p.json()["trip_status"] == "in_transit"

    d = requests.post(BASE_URL + f"/bookings/{state['booking_id']}/verify-delivery",
                      headers=_auth(state["driver_token"]),
                      json={"otp": state["delivery_otp"]}, timeout=TIMEOUT)
    assert d.status_code == 200
    assert d.json()["trip_status"] == "delivered"
    assert d.json()["status"] == "completed"


# ---------- Ratings & Disputes ----------
def test_rate_booking():
    r = requests.post(BASE_URL + f"/bookings/{state['booking_id']}/rate",
                      headers=_auth(state["shipper_token"]),
                      json={"stars": 5, "review": "Great"}, timeout=TIMEOUT)
    assert r.status_code == 200
    # double rate -> 400
    r2 = requests.post(BASE_URL + f"/bookings/{state['booking_id']}/rate",
                       headers=_auth(state["shipper_token"]),
                       json={"stars": 4}, timeout=TIMEOUT)
    assert r2.status_code == 400


def test_dispute_create_and_resolve():
    r = requests.post(BASE_URL + "/disputes", headers=_auth(state["shipper_token"]), json={
        "booking_id": state["booking_id"], "subject": "Late delivery",
        "description": "Driver arrived late",
    }, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    dispute_id = r.json()["id"]

    mine = requests.get(BASE_URL + "/disputes/mine",
                        headers=_auth(state["shipper_token"]), timeout=TIMEOUT).json()
    assert any(d["id"] == dispute_id for d in mine)

    res = requests.post(BASE_URL + f"/admin/disputes/{dispute_id}/resolve",
                        headers=_auth(state["admin_token"]), timeout=TIMEOUT)
    assert res.status_code == 200

    disputes = requests.get(BASE_URL + "/admin/disputes",
                            headers=_auth(state["admin_token"]), timeout=TIMEOUT).json()
    assert any(d["id"] == dispute_id and d["status"] == "resolved" for d in disputes)
