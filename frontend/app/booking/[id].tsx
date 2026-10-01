import { useState } from "react";
import { View, Text, ScrollView, Modal, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";

import { api, Booking } from "@/src/api/client";
import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { ScreenHeader } from "@/src/components/screen-header";
import { AppButton, Field, Icon, Badge, Card, RouteRow, Loading, StarRating } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/auth/auth-context";
import { formatMoney } from "@/src/constants";

const STEPS = [
  { key: "assigned", label: "Assigned", icon: "clipboard-check" },
  { key: "in_transit", label: "In transit", icon: "truck-fast" },
  { key: "delivered", label: "Delivered", icon: "check-decagram" },
];

export default function BookingDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [rateOpen, setRateOpen] = useState(false);
  const [stars, setStars] = useState(5);
  const [review, setReview] = useState("");
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [dSubject, setDSubject] = useState("");
  const [dDesc, setDDesc] = useState("");

  const { data: b, isLoading } = useQuery({
    queryKey: ["booking", id],
    queryFn: () => api.get<Booking>(`/bookings/${id}`),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["booking", id] });
    qc.invalidateQueries({ queryKey: ["my-bookings"] });
  };

  if (isLoading || !b) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <ScreenHeader title="Trip" onBack={() => router.back()} />
        <Loading />
      </View>
    );
  }

  const isShipper = user?.role === "shipper";
  const isDriver = user?.role === "driver";
  const currentStepIndex = STEPS.findIndex((st) => st.key === b.trip_status);

  const pay = async () => {
    setBusy(true);
    try {
      await api.post(`/bookings/${id}/pay`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast("Payment successful (mock)", "success");
      refresh();
    } catch (e: any) {
      toast(e.message || "Payment failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const verify = async (stage: "pickup" | "delivery") => {
    if (otp.length < 6) {
      toast("Enter the 6-digit OTP", "error");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/bookings/${id}/verify-${stage}`, { otp });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      toast(stage === "pickup" ? "Pickup verified — trip started" : "Delivery verified — trip complete", "success");
      setOtp("");
      refresh();
    } catch (e: any) {
      toast(e.message || "Incorrect OTP", "error");
    } finally {
      setBusy(false);
    }
  };

  const submitRating = async () => {
    setBusy(true);
    try {
      await api.post(`/bookings/${id}/rate`, { stars, review });
      toast("Thanks for your rating", "success");
      setRateOpen(false);
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const submitDispute = async () => {
    if (!dSubject || !dDesc) {
      toast("Add a subject and description", "error");
      return;
    }
    setBusy(true);
    try {
      await api.post(`/disputes`, { booking_id: id, subject: dSubject, description: dDesc });
      toast("Dispute raised — our team will review", "success");
      setDisputeOpen(false);
      setDSubject("");
      setDDesc("");
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const alreadyRated = isShipper ? b.rated_by_shipper : b.rated_by_driver;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader title={b.booking_ref} subtitle={`${b.pickup} → ${b.drop}`} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }} showsVerticalScrollIndicator={false}>
        {/* Status stepper */}
        <Card>
          <Text style={s.cardTitle}>Trip status</Text>
          <View style={{ marginTop: spacing.md }}>
            {STEPS.map((st, i) => {
              const done = i < currentStepIndex;
              const active = i === currentStepIndex;
              const reached = done || active;
              return (
                <View key={st.key} style={s.stepRow}>
                  <View style={{ alignItems: "center" }}>
                    <View style={[s.stepDot, reached ? { backgroundColor: colors.brandPrimary } : { backgroundColor: colors.surfaceTertiary }]}>
                      <Icon name={st.icon as any} size={18} color={reached ? colors.onBrandPrimary : colors.muted} />
                    </View>
                    {i < STEPS.length - 1 ? (
                      <View style={[s.stepLine, done ? { backgroundColor: colors.brandPrimary } : { backgroundColor: colors.border }]} />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, paddingBottom: i < STEPS.length - 1 ? spacing.lg : 0 }}>
                    <Text style={[s.stepLabel, reached && { color: colors.onSurface }]}>{st.label}</Text>
                    {active ? <Badge label="Current" tone="brand" /> : null}
                  </View>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Parties + amount */}
        <Card style={{ gap: spacing.sm }}>
          <RouteRow from={b.pickup} to={b.drop} />
          <Row label="Date" value={b.date} />
          <Row label="Weight" value={b.weight} />
          <Row label="Truck" value={b.truck_type} />
          <Row label={isShipper ? "Driver" : "Shipper"} value={isShipper ? b.driver_name : b.shipper_name} />
          <View style={s.divider} />
          <Row label="Freight amount" value={formatMoney(b.amount)} strong />
          <Row label="Platform fee (8%)" value={`- ${formatMoney(b.platform_fee)}`} />
          {isDriver ? <Row label="Your payout" value={formatMoney(b.driver_payout)} strong /> : null}
          <Badge
            label={b.payment_status === "paid" ? "Payment received" : "Payment pending"}
            tone={b.payment_status === "paid" ? "success" : "warning"}
            icon={b.payment_status === "paid" ? "check-circle" : "clock-outline"}
          />
        </Card>

        {/* Payment (shipper) */}
        {isShipper && b.payment_status === "unpaid" ? (
          <AppButton title={`Pay ${formatMoney(b.amount)} now`} icon="credit-card-outline" onPress={pay} loading={busy} testID="pay-button" />
        ) : null}

        {/* OTP section */}
        {b.trip_status !== "delivered" ? (
          <Card style={{ gap: spacing.sm }}>
            <Text style={s.cardTitle}>Verification</Text>
            {isShipper ? (
              <>
                <Text style={s.muted}>Share these codes with the driver at each stage.</Text>
                <View style={s.otpRow}>
                  <OtpChip label="Pickup OTP" code={b.pickup_otp} done={b.pickup_verified} />
                  <OtpChip label="Delivery OTP" code={b.delivery_otp} done={b.delivery_verified} />
                </View>
              </>
            ) : (
              <>
                {!b.pickup_verified ? (
                  <>
                    <Text style={s.muted}>Enter the pickup OTP from the shipper to start the trip.</Text>
                    <Field label="Pickup OTP" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} testID="pickup-otp-input" />
                    <AppButton title="Verify pickup" icon="check" onPress={() => verify("pickup")} loading={busy} testID="verify-pickup-button" />
                  </>
                ) : (
                  <>
                    <Text style={s.muted}>Enter the delivery OTP from the shipper to complete the trip.</Text>
                    <Field label="Delivery OTP" keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} testID="delivery-otp-input" />
                    <AppButton title="Verify delivery" icon="check-all" onPress={() => verify("delivery")} loading={busy} testID="verify-delivery-button" />
                  </>
                )}
              </>
            )}
          </Card>
        ) : null}

        {/* Rating */}
        {b.status === "completed" ? (
          alreadyRated ? (
            <Card>
              <Text style={s.cardTitle}>Rating submitted</Text>
              <Text style={s.muted}>Thanks for rating this trip.</Text>
            </Card>
          ) : (
            <AppButton title={`Rate ${isShipper ? "driver" : "shipper"}`} icon="star" onPress={() => setRateOpen(true)} testID="open-rate-button" />
          )
        ) : null}

        {/* Dispute */}
        <AppButton title="Report an issue" variant="outline" icon="alert-circle-outline" onPress={() => setDisputeOpen(true)} testID="open-dispute-button" />
      </ScrollView>

      {/* Rating modal */}
      <Modal visible={rateOpen} transparent animationType="slide" onRequestClose={() => setRateOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setRateOpen(false)} />
        <KeyboardAwareScrollView style={s.sheetWrap} contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} bottomOffset={20}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Rate this trip</Text>
            <View style={{ alignItems: "center", paddingVertical: spacing.sm }}>
              <StarRating value={stars} size={36} onChange={setStars} />
            </View>
            <Field label="Review (optional)" placeholder="How was it?" value={review} onChangeText={setReview} testID="review-input" />
            <AppButton title="Submit rating" onPress={submitRating} loading={busy} testID="submit-rating-button" />
          </View>
        </KeyboardAwareScrollView>
      </Modal>

      {/* Dispute modal */}
      <Modal visible={disputeOpen} transparent animationType="slide" onRequestClose={() => setDisputeOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setDisputeOpen(false)} />
        <KeyboardAwareScrollView style={s.sheetWrap} contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} bottomOffset={20}>
          <View style={[s.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Report an issue</Text>
            <Field label="Subject" placeholder="e.g. Delay at pickup" value={dSubject} onChangeText={setDSubject} testID="dispute-subject-input" />
            <Field label="Description" placeholder="Describe the issue" value={dDesc} onChangeText={setDDesc} multiline testID="dispute-desc-input" />
            <AppButton title="Submit report" onPress={submitDispute} loading={busy} testID="submit-dispute-button" />
          </View>
        </KeyboardAwareScrollView>
      </Modal>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  const s = useStyles();
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, strong && s.rowStrong]}>{value}</Text>
    </View>
  );
}

function OtpChip({ label, code, done }: { label: string; code: string | null; done: boolean }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[s.otpChip, done && { borderColor: colors.success }]}>
      <Text style={s.otpLabel}>{label}</Text>
      <Text style={s.otpCode}>{done ? "✓ Verified" : code ?? "----"}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  cardTitle: { fontSize: fontSize.lg, fontWeight: "800", color: c.onSurface },
  stepRow: { flexDirection: "row", gap: spacing.md },
  stepDot: { width: 40, height: 40, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  stepLine: { width: 2, flex: 1, marginVertical: 2 },
  stepLabel: { fontSize: fontSize.lg, fontWeight: "700", color: c.muted, marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 2 },
  rowLabel: { fontSize: fontSize.base, color: c.muted },
  rowValue: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurface },
  rowStrong: { fontSize: fontSize.lg, color: c.brandPrimary },
  divider: { height: 1, backgroundColor: c.divider, marginVertical: spacing.xs },
  muted: { fontSize: fontSize.base, color: c.muted },
  otpRow: { flexDirection: "row", gap: spacing.md },
  otpChip: {
    flex: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, borderWidth: 1.5,
    borderColor: c.border, padding: spacing.md, alignItems: "center", gap: 4,
  },
  otpLabel: { fontSize: fontSize.sm, color: c.muted, fontWeight: "600" },
  otpCode: { fontSize: fontSize["2xl"], fontWeight: "800", color: c.brandPrimary, letterSpacing: 4 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheetWrap: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0 },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.borderStrong, marginBottom: spacing.xs },
  sheetTitle: { fontSize: fontSize.xl, fontWeight: "800", color: c.onSurface },
}));
