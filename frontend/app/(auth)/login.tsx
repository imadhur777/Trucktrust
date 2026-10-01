import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { AppButton, Field, Icon } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/auth/auth-context";
import { HERO_IMAGE } from "@/src/constants";

export default function Login() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { signIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      toast("Enter email and password", "error");
      return;
    }
    setLoading(true);
    try {
      const user = await signIn(email.trim(), password);
      toast(`Welcome back, ${user.name.split(" ")[0]}`, "success");
      if (user.role === "shipper") router.replace("/shipper");
      else if (user.role === "driver") router.replace("/driver");
      else router.replace("/admin");
    } catch (e: any) {
      toast(e.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <KeyboardAwareScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero */}
        <View style={s.hero}>
          <Image source={{ uri: HERO_IMAGE }} style={s.heroImg} contentFit="cover" transition={300} />
          <LinearGradient
            colors={["rgba(120,30,20,0.45)", "rgba(192,57,43,0.25)", "rgba(230,81,0,0.6)"]}
            locations={[0, 0.5, 1]}
            style={s.scrim}
          />
          <View style={[s.brandRow, { top: insets.top + spacing.lg }]}>
            <View style={s.logoBadge}>
              <Icon name="truck-fast" size={22} color={colors.brandPrimary} />
            </View>
            <View>
              <Text style={s.brandName}>TruckTrust</Text>
              <Text style={s.brandTag}>Return-load marketplace</Text>
            </View>
          </View>
          <View style={s.heroCopy}>
            <View style={s.heroPill}>
              <Icon name="shield-check" size={14} color="#FFFFFF" />
              <Text style={s.heroPillText}>Verified shippers & drivers</Text>
            </View>
            <Text style={s.heroTitle}>Fill every{"\n"}return trip.</Text>
          </View>
        </View>

        {/* Form card */}
        <View style={s.card}>
          <Text style={s.title}>Welcome back</Text>
          <Text style={s.subtitle}>Sign in to manage your loads and trips.</Text>

          <View style={s.fields}>
            <Field
              label="Email"
              leftIcon="email-outline"
              placeholder="you@company.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              testID="login-email-input"
            />
            <Field
              label="Password"
              leftIcon="lock-outline"
              placeholder="Your password"
              secureTextEntry={!showPw}
              autoComplete="password"
              returnKeyType="done"
              onSubmitEditing={onLogin}
              value={password}
              onChangeText={setPassword}
              testID="login-password-input"
              right={
                <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10} testID="login-toggle-password">
                  <Icon name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                </Pressable>
              }
            />
          </View>

          <AppButton
            title="Sign in"
            icon="arrow-right"
            onPress={onLogin}
            loading={loading}
            testID="login-submit-button"
            style={{ marginTop: spacing.lg }}
          />

          <Pressable
            onPress={() => router.push("/(auth)/register")}
            style={s.switchRow}
            testID="go-to-register-button"
          >
            <Text style={s.switchMuted}>New to TruckTrust? </Text>
            <Text style={s.switchLink}>Create an account</Text>
          </Pressable>
        </View>

        {/* Trust row */}
        <View style={s.trustRow}>
          {TRUST.map((t) => (
            <View key={t.label} style={s.trustItem}>
              <View style={s.trustIcon}>
                <Icon name={t.icon} size={18} color={colors.brandPrimary} />
              </View>
              <Text style={s.trustLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const TRUST = [
  { icon: "account-check-outline", label: "KYC-verified\npartners" },
  { icon: "shield-lock-outline", label: "OTP-secured\ndeliveries" },
  { icon: "cash-check", label: "Protected\npayments" },
] as const;

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  scroll: { flex: 1 },
  hero: { height: 340, width: "100%", backgroundColor: c.brand },
  heroImg: { width: "100%", height: "100%" },
  scrim: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  brandRow: { position: "absolute", left: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoBadge: {
    width: 42, height: 42, borderRadius: radius.md, backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
  },
  brandName: { color: "#FFFFFF", fontSize: fontSize.xl, fontWeight: "800", letterSpacing: 0.2 },
  brandTag: { color: "rgba(255,255,255,0.85)", fontSize: fontSize.sm, fontWeight: "600" },
  heroCopy: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing["3xl"] + spacing.md, gap: spacing.sm },
  heroPill: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)", borderWidth: 1, borderColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill,
  },
  heroPillText: { color: "#FFFFFF", fontSize: fontSize.sm, fontWeight: "700" },
  heroTitle: { color: "#FFFFFF", fontSize: 34, lineHeight: 38, fontWeight: "800" },
  card: {
    marginTop: -spacing["3xl"],
    marginHorizontal: spacing.lg,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: c.border,
    boxShadow: "0px 10px 30px rgba(17,24,39,0.12)",
  },
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: c.onSurface },
  subtitle: { fontSize: fontSize.base, color: c.muted, marginTop: 4 },
  fields: { gap: spacing.lg, marginTop: spacing.xl },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg, minHeight: 44, alignItems: "center" },
  switchMuted: { color: c.muted, fontSize: fontSize.base },
  switchLink: { color: c.brandPrimary, fontSize: fontSize.base, fontWeight: "700" },
  trustRow: {
    flexDirection: "row", justifyContent: "space-between",
    marginHorizontal: spacing.lg, marginTop: spacing.xl, gap: spacing.sm,
  },
  trustItem: { flex: 1, alignItems: "center", gap: spacing.sm },
  trustIcon: {
    width: 40, height: 40, borderRadius: radius.pill, backgroundColor: c.brandTertiary,
    alignItems: "center", justifyContent: "center",
  },
  trustLabel: { fontSize: fontSize.sm, fontWeight: "600", color: c.onSurfaceSecondary, textAlign: "center", lineHeight: 16 },
}));
