import React from "react";
import { View, Text } from "react-native";
import { Card, Badge, RouteRow, Icon } from "@/src/components/ui";
import { makeStyles, spacing, fontSize, useTheme } from "@/src/theme";
import { Load } from "@/src/api/client";
import { formatMoney as fmt } from "@/src/constants";

const statusTone: Record<string, any> = {
  open: "brand",
  booked: "warning",
  completed: "success",
  cancelled: "error",
};

function Spec({ icon, label }: { icon: any; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Icon name={icon} size={14} color={colors.muted} />
      <Text style={{ fontSize: fontSize.sm, color: colors.onSurfaceSecondary, fontWeight: "600" }}>
        {label}
      </Text>
    </View>
  );
}

export function LoadCard({
  load,
  onPress,
  showOffers = true,
  rightLabel,
}: {
  load: Load;
  onPress: () => void;
  showOffers?: boolean;
  rightLabel?: string;
}) {
  const s = useStyles();
  return (
    <Card onPress={onPress} testID={`load-card-${load.id}`} style={s.card}>
      <View style={s.topRow}>
        <Badge label={load.status.toUpperCase()} tone={statusTone[load.status]} />
        <Text style={s.price}>{fmt(load.expected_price)}</Text>
      </View>
      <RouteRow from={load.pickup} to={load.drop} big />
      <View style={s.specs}>
        <Spec icon="calendar" label={load.date} />
        <Spec icon="weight" label={load.weight} />
        <Spec icon="truck-outline" label={load.truck_type} />
        <Spec icon="package-variant" label={load.material} />
      </View>
      {(showOffers || rightLabel) && (
        <View style={s.footer}>
          {rightLabel ? (
            <Text style={s.footerNote}>{rightLabel}</Text>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Icon name="gavel" size={14} color={load.offer_count ? undefined : undefined} />
              <Text style={s.offerText}>
                {load.offer_count} {load.offer_count === 1 ? "offer" : "offers"}
              </Text>
            </View>
          )}
          <Icon name="chevron-right" size={20} />
        </View>
      )}
    </Card>
  );
}

const useStyles = makeStyles((c) => ({
  card: { gap: spacing.md },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  price: { fontSize: fontSize.xl, fontWeight: "800", color: c.brandPrimary },
  specs: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md, rowGap: spacing.sm },
  footer: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    borderTopWidth: 1, borderTopColor: c.divider, paddingTop: spacing.md,
  },
  offerText: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurfaceSecondary },
  footerNote: { fontSize: fontSize.base, fontWeight: "700", color: c.brandSecondary },
}));
