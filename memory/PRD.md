# TruckTrust — Product Requirements Document

## Original Problem Statement
Build "TruckTrust" (from the ReturnLoad Startup Blueprint) — a B2B digital freight marketplace that reduces
empty return kilometers for trucks by connecting shippers (who need to move goods) with verified drivers/fleet
owners who have capacity on their return journeys. Must run on iOS, Android, and web.

## User Choices (locked)
- Roles: Shipper + Driver (mobile focus) + Admin (web dashboard)
- Auth: Email/password (JWT)
- Payments: Mocked for MVP (8% platform commission), real Razorpay later
- Tracking: Status-based (Picked up / In transit / Delivered) via OTP, no live map
- Branding: Brick-red (#C0392B) / warm orange (#E65100), trustworthy logistics look

## Architecture
- Backend: FastAPI + MongoDB (motor), JWT auth (PyJWT + bcrypt), all routes under `/api`
- Frontend: Expo (React Native) + expo-router, @tanstack/react-query, theme tokens in src/theme.ts
- Collections: users, loads, offers, bookings, messages, ratings, disputes
- Role-based access control on every protected endpoint

## User Personas
1. Shipper — posts loads, reviews/negotiates offers, books, pays (mock), shares OTPs, rates drivers.
2. Driver / Fleet owner — browses return loads by truck type, makes/counters offers, runs trips, verifies OTPs, gets payout.
3. Admin — verifies users (KYC), monitors loads/bookings, resolves disputes, sees marketplace stats.

## Implemented (2026-06)
- Auth: register (role select), login, JWT persistence, profile view/edit, idempotent admin seed
- Shipper: My Loads list, Post Load form (pickup/drop/date/weight/material/truck/body/price), load details
- Driver: Available loads feed with truck-type filter chips, make offer
- Offers & negotiation: list, accept (creates booking + OTPs + 8% fee), reject, counter, in-app negotiation chat
- Booking/Trip: vertical status stepper, mock payment with fee breakdown, pickup & delivery OTP verification
  (OTPs held/shared by shipper, entered by driver), payout display
- Ratings after completion (2-way), raise dispute
- Admin dashboard (web + mobile): stats grid + GMV, users (verify), loads, bookings, disputes (resolve)
- Verified end-to-end (25/25 backend tests pass; frontend flows verified)
- Login screen redesign: brand-gradient hero with new truck photo, floating form card, icon inputs with show/hide password, trust badges (2026-06)

## Backlog (prioritized)
### P0
- (none blocking) — MVP complete and verified
### P1
- Real Razorpay payment integration (replace mock /api/bookings/{id}/pay)
- Phone + OTP login (SMS provider)
- Deterministic matching score (route similarity, proximity, capacity) + "best match" sorting for drivers
- Push notifications for new offers / status changes (requires deploy + native build)
### P2
- Live GPS trip tracking + map
- Document/KYC upload with Object Storage
- Masked phone communication / anti-disintermediation controls
- Fleet subscriptions, priority matching, business accounts, corridor analytics

## Next Tasks
- Gather Razorpay keys from user, then integrate real payments via integration playbook
- Add matching score to driver feed ordering
