import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { AppButton, Field, Icon } from "@/src/components/ui";
import { ChipRow } from "@/src/components/chip-row";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/auth/auth-context";
import { TRUCK_TYPES } from "@/src/constants";

export default function Register() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();

  const [role, setRole] = useState<"shipper" | "driver">("shipper");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [truckType, setTruckType] = useState(TRUCK_TYPES[0]);
  const [capacity, setCapacity] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!name || !email || !password) {
      toast("Name, email and password are required", "error");
      return;
    }
    if (password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    if (!accepted) {
      toast("Please accept the Terms & Conditions", "error");
      return;
    }
    setLoading(true);
    try {
      const user = await signUp({
        name,
        email: email.trim(),
        phone,
        password,
        role,
        company: role === "shipper" ? company : "",
        truck_type: role === "driver" ? truckType : "",
        capacity: role === "driver" ? capacity : "",
        accepted_terms: true,
      });
      toast("Account created", "success");
      router.replace(user.role === "shipper" ? "/shipper" : "/driver");
    } catch (e: any) {
      toast(e.message || "Could not register", "error");
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
        <LinearGradient
          colors={[colors.brandPrimary, colors.brandSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.header, { paddingTop: insets.top + spacing.sm }]}
        >
          <View style={s.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={s.backBtn} testID="register-back-button">
              <Icon name="arrow-left" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={s.logoBadge}>
              <Icon name="truck-fast" size={20} color={colors.brandPrimary} />
            </View>
            <View style={{ width: 44 }} />
          </View>
          <Text style={s.headerTitle}>Create your account</Text>
          <Text style={s.headerSub}>{"Join India's trusted return-load network."}</Text>
        </LinearGradient>

        <View style={s.card}>
          <Text style={s.label}>I am a</Text>
          <View style={s.roleRow}>
            {ROLES.map((r) => {
              const active = role === r.key;
              return (
                <Pressable
                  key={r.key}
                  testID={`role-${r.key}-button`}
                  onPress={() => setRole(r.key)}
                  style={[s.roleCard, active && { borderColor: colors.brandPrimary, backgroundColor: colors.brandTertiary }]}
                >
                  <View style={[s.roleIcon, active && { backgroundColor: colors.brandPrimary }]}>
                    <Icon name={r.icon} size={22} color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary} />
                  </View>
                  <Text style={[s.roleTitle, active && { color: colors.onBrandTertiary }]}>{r.title}</Text>
                  <Text style={s.roleSub}>{r.sub}</Text>
                  {active ? (
                    <View style={s.roleCheck}>
                      <Icon name="check-circle" size={18} color={colors.brandPrimary} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={s.fields}>
            <Field label="Full name" leftIcon="account-outline" placeholder="Your name" value={name} onChangeText={setName} testID="register-name-input" />
            <Field
              label="Email"
              leftIcon="email-outline"
              placeholder="you@company.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              testID="register-email-input"
            />
            <Field label="Phone" leftIcon="phone-outline" placeholder="Mobile number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} testID="register-phone-input" />
            <Field
              label="Password"
              leftIcon="lock-outline"
              placeholder="At least 6 characters"
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
              testID="register-password-input"
              right={
                <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10} testID="register-toggle-password">
                  <Icon name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                </Pressable>
              }
            />

            {role === "shipper" ? (
              <Field label="Company (optional)" leftIcon="domain" placeholder="Business name" value={company} onChangeText={setCompany} testID="register-company-input" />
            ) : (
              <>
                <View style={{ gap: spacing.xs }}>
                  <Text style={s.label}>Truck type</Text>
                  <ChipRow options={TRUCK_TYPES} value={truckType} onChange={setTruckType} testIDPrefix="register-trucktype" />
                </View>
                <Field label="Capacity" leftIcon="weight" placeholder="e.g. 20 ton" value={capacity} onChangeText={setCapacity} testID="register-capacity-input" />
              </>
            )}
          </View>

          <Pressable onPress={() => setAccepted((v) => !v)} style={s.termsRow} testID="register-terms-checkbox">
            <View style={[s.checkbox, accepted && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}>
              {accepted ? <Icon name="check" size={16} color={colors.onBrandPrimary} /> : null}
            </View>
            <Text style={s.termsText}>
              I agree to the{" "}
              <Text style={s.switchLink} onPress={() => router.push("/(auth)/terms")} testID="register-terms-link">
                Terms & Conditions
              </Text>
            </Text>
          </Pressable>

          <AppButton title="Create account" icon="arrow-right" onPress={onSubmit} loading={loading} testID="register-submit-button" style={{ marginTop: spacing.sm }} />

          <Pressable onPress={() => router.back()} style={s.switchRow} testID="go-to-login-button">
            <Text style={s.switchMuted}>Already have an account? </Text>
            <Text style={s.switchLink}>Sign in</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const ROLES = [
  { key: "shipper", icon: "package-variant-closed", title: "Shipper", sub: "I need to move goods" },
  { key: "driver", icon: "truck", title: "Driver / Fleet", sub: "I have truck capacity" },
] as const;

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing["3xl"] + spacing.sm },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: -spacing.xs },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  logoBadge: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  headerTitle: { color: "#FFFFFF", fontSize: fontSize["2xl"], fontWeight: "800", marginTop: spacing.md },
  headerSub: { color: "rgba(255,255,255,0.9)", fontSize: fontSize.base, marginTop: 4 },
  scroll: { flex: 1 },
  card: {
    marginTop: -spacing["2xl"],
    marginHorizontal: spacing.lg,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: c.border,
    boxShadow: "0px 10px 30px rgba(17,24,39,0.12)",
  },
  label: { fontSize: fontSize.base, fontWeight: "600", color: c.onSurfaceSecondary },
  roleRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  roleCard: {
    flex: 1, gap: spacing.xs, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surfaceSecondary,
  },
  roleIcon: {
    width: 40, height: 40, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  roleTitle: { fontSize: fontSize.lg, fontWeight: "800", color: c.onSurface },
  roleSub: { fontSize: fontSize.sm, color: c.muted },
  roleCheck: { position: "absolute", top: spacing.sm, right: spacing.sm },
  fields: { gap: spacing.lg, marginTop: spacing.xl },
  termsRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.lg, minHeight: 44 },
  checkbox: {
    width: 24, height: 24, borderRadius: radius.sm, borderWidth: 2, borderColor: c.borderStrong,
    alignItems: "center", justifyContent: "center",
  },
  termsText: { flex: 1, fontSize: fontSize.base, color: c.onSurfaceSecondary, lineHeight: 20 },
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: spacing.lg, minHeight: 44 },
  switchMuted: { color: c.muted, fontSize: fontSize.base },
  switchLink: { color: c.brandPrimary, fontSize: fontSize.base, fontWeight: "700" },
}));
