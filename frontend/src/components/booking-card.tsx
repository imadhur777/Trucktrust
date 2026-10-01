import React from "react";
import { View, Text } from "react-native";
import { Card, Badge, RouteRow, Icon } from "@/src/components/ui";
import { makeStyles, spacing, fontSize, useTheme } from "@/src/theme";
import { Booking } from "@/src/api/client";
import { formatMoney } from "@/src/constants";

const tripTone: Record<string, any> = {
  assigned: "warning",
  in_transit: "info",
  delivered: "success",
};
const tripLabel: Record<string, string> = {
  assigned: "Assigned",
  in_transit: "In transit",
  delivered: "Delivered",
};

export function BookingCard({
  booking,
  role,
  onPress,
}: {
  booking: Booking;
  role: "shipper" | "driver";
  onPress: () => void;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const other = role === "shipper" ? booking.driver_name : booking.shipper_name;
  return (
    <Card onPress={onPress} testID={`booking-card-${booking.id}`} style={s.card}>
      <View style={s.topRow}>
        <Text style={s.ref}>{booking.booking_ref}</Text>
        <Badge label={tripLabel[booking.trip_status]} tone={tripTone[booking.trip_status]} />
      </View>
      <RouteRow from={booking.pickup} to={booking.drop} />
      <View style={s.metaRow}>
        <View style={s.meta}>
          <Icon name={role === "shipper" ? "truck" : "account"} size={14} color={colors.muted} />
          <Text style={s.metaText}>{other || "—"}</Text>
        </View>
        <Text style={s.amount}>{formatMoney(booking.amount)}</Text>
      </View>
      <View style={s.footer}>
        <Badge
          label={booking.payment_status === "paid" ? "Paid" : "Payment due"}
          tone={booking.payment_status === "paid" ? "success" : "warning"}
          icon={booking.payment_status === "paid" ? "check" : "clock-outline"}
        />
        <Icon name="chevron-right" size={20} />
      </View>
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  card: { gap: spacing.md },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  ref: { fontSize: fontSize.base, fontWeight: "800", color: c.onSurface },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: fontSize.base, color: c.onSurfaceSecondary, fontWeight: "600" },
  amount: { fontSize: fontSize.lg, fontWeight: "800", color: c.brandPrimary },
  footer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: c.divider, paddingTop: spacing.md,
  },
}));
