import { useState } from "react";
import { View, Text, ScrollView, Modal, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { api, Load, Offer } from "@/src/api/client";
import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { ScreenHeader } from "@/src/components/screen-header";
import { AppButton, Field, Icon, Badge, Card, RouteRow, Loading, StarRating } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/auth/auth-context";
import { formatMoney } from "@/src/constants";

export default function LoadDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [modalMode, setModalMode] = useState<null | { type: "offer" | "counter"; offerId?: string; amount?: number }>(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: load, isLoading } = useQuery({
    queryKey: ["load", id],
    queryFn: () => api.get<Load>(`/loads/${id}`),
  });
  const { data: offers } = useQuery({
    queryKey: ["offers", id],
    queryFn: () => api.get<Offer[]>(`/loads/${id}/offers`),
  });

  if (isLoading || !load) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <ScreenHeader title="Load" onBack={() => router.back()} />
        <Loading />
      </View>
    );
  }

  const isOwner = user?.role === "shipper" && load.shipper_id === user.id;
  const isDriver = user?.role === "driver";
  const myOffer = isDriver ? offers?.find((o) => o.driver_id === user?.id) : undefined;
  const visibleOffers = isOwner ? offers ?? [] : myOffer ? [myOffer] : [];
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["offers", id] });
    qc.invalidateQueries({ queryKey: ["load", id] });
  };

  const openOffer = () => {
    setAmount(String(load.expected_price));
    setMessage("");
    setModalMode({ type: "offer" });
  };
  const openCounter = (o: Offer) => {
    setAmount(String(o.amount));
    setMessage("");
    setModalMode({ type: "counter", offerId: o.id });
  };

  const submitModal = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    setBusy(true);
    try {
      if (modalMode?.type === "offer") {
        await api.post(`/loads/${id}/offers`, { amount: amt, message });
        toast("Offer sent", "success");
      } else if (modalMode?.type === "counter" && modalMode.offerId) {
        await api.post(`/offers/${modalMode.offerId}/counter`, { amount: amt, message });
        toast("Counter sent", "success");
      }
      setModalMode(null);
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const acceptOffer = async (o: Offer) => {
    setBusy(true);
    try {
      const booking = await api.post<{ id: string }>(`/offers/${o.id}/accept`);
      qc.invalidateQueries({ queryKey: ["my-bookings"] });
      qc.invalidateQueries({ queryKey: ["my-loads"] });
      toast("Offer accepted — booking created", "success");
      router.replace(`/booking/${booking.id}`);
    } catch (e: any) {
      toast(e.message || "Failed to accept", "error");
    } finally {
      setBusy(false);
    }
  };

  const rejectOffer = async (o: Offer) => {
    try {
      await api.post(`/offers/${o.id}/reject`);
      toast("Offer rejected", "info");
      refresh();
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    }
  };

  const canMakeOffer = isDriver && load.status === "open" && !myOffer;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader title={load.status === "open" ? "Load Details" : "Load (Booked)"} subtitle={`${load.pickup} → ${load.drop}`} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 120, gap: spacing.md }} showsVerticalScrollIndicator={false}>
        <Card style={{ gap: spacing.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Badge label={load.status.toUpperCase()} tone={load.status === "open" ? "brand" : "warning"} />
            <Text style={s.price}>{formatMoney(load.expected_price)}</Text>
          </View>
          <RouteRow from={load.pickup} to={load.drop} big />
          <View style={s.grid}>
            <Detail icon="calendar" label="Date" value={load.date} />
            <Detail icon="weight" label="Weight" value={load.weight} />
            <Detail icon="truck-outline" label="Truck" value={load.truck_type} />
            <Detail icon="package-variant" label="Material" value={load.material} />
            {load.body_type ? <Detail icon="dump-truck" label="Body" value={load.body_type} /> : null}
          </View>
          {load.special_requirements ? (
            <View style={s.special}>
              <Icon name="information-outline" size={16} color={colors.info} />
              <Text style={s.specialText}>{load.special_requirements}</Text>
            </View>
          ) : null}
          {isOwner ? <Text style={s.posted}>Posted by you</Text> : <Text style={s.posted}>Shipper: {load.shipper_name}</Text>}
        </Card>

        <Text style={s.sectionTitle}>
          {isOwner ? `Offers received (${visibleOffers.length})` : "Your offer"}
        </Text>

        {visibleOffers.length === 0 ? (
          <Card>
            <Text style={s.empty}>
              {isOwner ? "No offers yet. Drivers will bid on your load soon." : "You haven't made an offer yet."}
            </Text>
          </Card>
        ) : (
          visibleOffers.map((o) => (
            <Card key={o.id} testID={`offer-${o.id}`} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ gap: 2 }}>
                  <Text style={s.driverName}>{isOwner ? o.driver_name : "You"}</Text>
                  {o.driver_truck_type ? <Text style={s.muted}>{o.driver_truck_type}</Text> : null}
                  {o.driver_rating ? <StarRating value={o.driver_rating} size={13} /> : null}
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={s.offerAmount}>{formatMoney(o.amount)}</Text>
                  <Badge
                    label={o.status === "countered" ? `Countered by ${o.last_by}` : o.status}
                    tone={o.status === "accepted" ? "success" : o.status === "rejected" ? "error" : o.last_by === "shipper" ? "info" : "brand"}
                  />
                </View>
              </View>
              {o.message ? <Text style={s.offerMsg}>“{o.message}”</Text> : null}

              <Pressable style={s.chatRow} onPress={() => router.push(`/negotiate/${id}?driver=${o.driver_id}&driverName=${encodeURIComponent(o.driver_name)}`)} testID={`chat-${o.id}`}>
                <Icon name="chat-outline" size={16} color={colors.brandPrimary} />
                <Text style={s.chatText}>Open negotiation chat</Text>
              </Pressable>

              {isOwner && o.status !== "accepted" && o.status !== "rejected" && load.status === "open" ? (
                <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs }}>
                  <AppButton title="Reject" variant="secondary" onPress={() => rejectOffer(o)} style={{ flex: 1 }} testID={`reject-${o.id}`} />
                  <AppButton title="Counter" variant="outline" onPress={() => openCounter(o)} style={{ flex: 1 }} testID={`counter-${o.id}`} />
                  <AppButton title="Accept" onPress={() => acceptOffer(o)} loading={busy} style={{ flex: 1.2 }} testID={`accept-${o.id}`} />
                </View>
              ) : null}

              {isDriver && o.status === "countered" && o.last_by === "shipper" && load.status === "open" ? (
                <AppButton title="Counter back" variant="outline" onPress={() => openCounter(o)} style={{ marginTop: spacing.xs }} testID={`counter-back-${o.id}`} />
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      {canMakeOffer ? (
        <View style={[s.cta, { paddingBottom: insets.bottom + spacing.md }]}>
          <AppButton title="Make an Offer" icon="gavel" onPress={openOffer} testID="make-offer-button" />
        </View>
      ) : null}

      <Modal visible={!!modalMode} transparent animationType="slide" onRequestClose={() => setModalMode(null)}>
        <Pressable style={s.backdrop} onPress={() => setModalMode(null)} />
        <KeyboardAwareScrollView
          style={s.sheetWrap}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }}
          bottomOffset={20}
        >
          <View style={[s.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>{modalMode?.type === "offer" ? "Make an offer" : "Counter offer"}</Text>
            <Field label="Amount (₹)" keyboardType="numeric" value={amount} onChangeText={setAmount} testID="offer-amount-input" />
            <Field label="Message (optional)" placeholder="Add a note" value={message} onChangeText={setMessage} testID="offer-message-input" />
            <AppButton title="Send" onPress={submitModal} loading={busy} testID="offer-send-button" style={{ marginTop: spacing.sm }} />
          </View>
        </KeyboardAwareScrollView>
      </Modal>
    </View>
  );
}

function Detail({ icon, label, value }: { icon: any; label: string; value: string }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.detail}>
      <Icon name={icon} size={16} color={colors.muted} />
      <View>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={s.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  price: { fontSize: fontSize.xl, fontWeight: "800", color: c.brandPrimary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, rowGap: spacing.md },
  detail: { flexDirection: "row", alignItems: "center", gap: spacing.sm, minWidth: 120 },
  detailLabel: { fontSize: fontSize.sm, color: c.muted },
  detailValue: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurface },
  special: { flexDirection: "row", gap: spacing.sm, backgroundColor: c.surfaceSecondary, padding: spacing.md, borderRadius: radius.md },
  specialText: { flex: 1, fontSize: fontSize.base, color: c.onSurfaceSecondary },
  posted: { fontSize: fontSize.sm, color: c.muted, fontWeight: "600" },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "800", color: c.onSurface, marginTop: spacing.xs },
  empty: { fontSize: fontSize.base, color: c.muted, textAlign: "center" },
  driverName: { fontSize: fontSize.lg, fontWeight: "800", color: c.onSurface },
  muted: { fontSize: fontSize.sm, color: c.muted },
  offerAmount: { fontSize: fontSize.xl, fontWeight: "800", color: c.onSurface },
  offerMsg: { fontSize: fontSize.base, color: c.onSurfaceSecondary, fontStyle: "italic" },
  chatRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: spacing.xs },
  chatText: { fontSize: fontSize.base, fontWeight: "700", color: c.brandPrimary },
  cta: {
    position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: c.surface,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: c.border,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheetWrap: { position: "absolute", left: 0, right: 0, bottom: 0, top: 0 },
  sheet: {
    backgroundColor: c.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    padding: spacing.lg, gap: spacing.md,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: c.borderStrong, marginBottom: spacing.xs },
  sheetTitle: { fontSize: fontSize.xl, fontWeight: "800", color: c.onSurface },
}));
