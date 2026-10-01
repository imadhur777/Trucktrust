import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { Icon } from "@/src/components/ui";
import { TERMS_SECTIONS, TERMS_LAST_UPDATED } from "@/src/legal";

export default function Terms() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={s.backBtn} testID="terms-back-button">
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={s.headerTitle}>Terms & Conditions</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing["2xl"], gap: spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.intro}>
          <View style={s.introIcon}>
            <Icon name="file-document-outline" size={22} color={colors.brandPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.introTitle}>TruckTrust marketplace terms</Text>
            <Text style={s.introSub}>Last updated {TERMS_LAST_UPDATED}</Text>
          </View>
        </View>

        {TERMS_SECTIONS.map((sec) => (
          <View key={sec.title} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            <Text style={s.sectionBody}>{sec.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: c.divider,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "800", color: c.onSurface },
  intro: {
    flexDirection: "row", alignItems: "center", gap: spacing.md,
    backgroundColor: c.brandTertiary, borderRadius: radius.lg, padding: spacing.lg,
  },
  introIcon: {
    width: 44, height: 44, borderRadius: radius.pill, backgroundColor: c.surface,
    alignItems: "center", justifyContent: "center",
  },
  introTitle: { fontSize: fontSize.lg, fontWeight: "800", color: c.onBrandTertiary },
  introSub: { fontSize: fontSize.sm, color: c.onBrandTertiary, opacity: 0.8, marginTop: 2 },
  section: { gap: spacing.xs },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: "700", color: c.onSurface },
  sectionBody: { fontSize: fontSize.base, lineHeight: 22, color: c.onSurfaceSecondary },
}));
