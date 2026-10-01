import { useRef, useState } from "react";
import { View, Text, Pressable, FlatList, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { AppButton, Icon } from "@/src/components/ui";
import { storage } from "@/src/utils/storage";
import { ONBOARDING_KEY } from "@/src/constants";

const SLIDES = [
  {
    key: "post",
    icon: "package-variant-closed" as const,
    accent: ["#C0392B", "#E65100"] as const,
    title: "Post a load in seconds",
    body: "Shippers add pickup, drop, date, weight and truck type. Verified drivers heading that way see it instantly.",
    bullets: ["Any truck type or body", "Set your expected price", "Track every load status"],
  },
  {
    key: "offer",
    icon: "handshake-outline" as const,
    accent: ["#E65100", "#F59E0B"] as const,
    title: "Fill empty return trips",
    body: "Drivers browse loads on their return route, make an offer, and negotiate in-app until both sides agree.",
    bullets: ["Offer, counter or accept", "In-app chat per load", "Only 8% platform fee"],
  },
  {
    key: "otp",
    icon: "shield-check-outline" as const,
    accent: ["#B23A22", "#C0392B"] as const,
    title: "OTP-secured deliveries",
    body: "Pickup and delivery are confirmed with one-time codes shared by the shipper, so payouts are released only on proof of handover.",
    bullets: ["6-digit pickup & delivery codes", "Two-way ratings after each trip", "Dispute support when needed"],
  },
];

export default function Onboarding() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await storage.setItem(ONBOARDING_KEY, true);
    router.replace("/(auth)/login");
  };

  const next = () => {
    if (index >= SLIDES.length - 1) {
      finish();
      return;
    }
    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const last = index === SLIDES.length - 1;

  return (
    <View style={s.root}>
      <View style={[s.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <View style={s.brandRow}>
          <View style={s.logoBadge}>
            <Icon name="truck-fast" size={18} color={colors.onBrandPrimary} />
          </View>
          <Text style={s.brandName}>TruckTrust</Text>
        </View>
        {!last ? (
          <Pressable onPress={finish} hitSlop={10} style={s.skipBtn} testID="onboarding-skip-button">
            <Text style={s.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View style={s.skipBtn} />
        )}
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(x) => x.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={[s.slide, { width }]}>
            <LinearGradient colors={[...item.accent]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.illus}>
              <View style={s.illusRing}>
                <Icon name={item.icon} size={64} color="#FFFFFF" />
              </View>
            </LinearGradient>
            <Text style={s.title}>{item.title}</Text>
            <Text style={s.body}>{item.body}</Text>
            <View style={s.bullets}>
              {item.bullets.map((b) => (
                <View key={b} style={s.bulletRow}>
                  <Icon name="check-circle" size={18} color={colors.brandPrimary} />
                  <Text style={s.bulletText}>{b}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      />

      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={s.dots}>
          {SLIDES.map((x, i) => (
            <View key={x.key} style={[s.dot, i === index && { backgroundColor: colors.brandPrimary, width: 24 }]} />
          ))}
        </View>
        <AppButton
          title={last ? "Get started" : "Next"}
          icon={last ? "arrow-right" : undefined}
          onPress={next}
          testID="onboarding-next-button"
        />
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoBadge: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: fontSize.lg, fontWeight: "800", color: c.onSurface },
  skipBtn: { minWidth: 44, minHeight: 44, alignItems: "flex-end", justifyContent: "center" },
  skipText: { color: c.muted, fontWeight: "700", fontSize: fontSize.base },
  slide: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  illus: {
    height: 220, borderRadius: radius.lg, alignItems: "center", justifyContent: "center",
    marginBottom: spacing.xl,
  },
  illusRing: {
    width: 128, height: 128, borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: fontSize["3xl"], lineHeight: 36, fontWeight: "800", color: c.onSurface },
  body: { fontSize: fontSize.lg, lineHeight: 24, color: c.muted, marginTop: spacing.md },
  bullets: { gap: spacing.md, marginTop: spacing.xl },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  bulletText: { fontSize: fontSize.base, fontWeight: "600", color: c.onSurfaceSecondary },
  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.lg },
  dots: { flexDirection: "row", gap: 6, justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary },
}));
