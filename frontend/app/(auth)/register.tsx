import { useState } from "react";
import { View, Text, Pressable } from "react-native";
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
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} testID="register-back-button">
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <Text style={s.headerTitle}>Create account</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.label}>I am a</Text>
        <View style={s.segment}>
          {(["shipper", "driver"] as const).map((r) => {
            const active = role === r;
            return (
              <Pressable
                key={r}
                testID={`role-${r}-button`}
                onPress={() => setRole(r)}
                style={[s.segmentItem, active && { backgroundColor: colors.brandPrimary }]}
              >
                <Icon
                  name={r === "shipper" ? "package-variant-closed" : "truck"}
                  size={18}
                  color={active ? colors.onBrandPrimary : colors.onSurfaceSecondary}
                />
                <Text style={[s.segmentText, active && { color: colors.onBrandPrimary }]}>
                  {r === "shipper" ? "Shipper" : "Driver / Fleet"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Field label="Full name" placeholder="Your name" value={name} onChangeText={setName} testID="register-name-input" />
        <Field
          label="Email"
          placeholder="you@company.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          testID="register-email-input"
        />
        <Field label="Phone" placeholder="Mobile number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} testID="register-phone-input" />
        <Field label="Password" placeholder="At least 6 characters" secureTextEntry value={password} onChangeText={setPassword} testID="register-password-input" />

        {role === "shipper" ? (
          <Field label="Company (optional)" placeholder="Business name" value={company} onChangeText={setCompany} testID="register-company-input" />
        ) : (
          <>
            <Text style={s.label}>Truck type</Text>
            <ChipRow options={TRUCK_TYPES} value={truckType} onChange={setTruckType} testIDPrefix="register-trucktype" />
            <Field label="Capacity" placeholder="e.g. 20 ton" value={capacity} onChangeText={setCapacity} testID="register-capacity-input" />
          </>
        )}

        <AppButton title="Create account" onPress={onSubmit} loading={loading} testID="register-submit-button" style={{ marginTop: spacing.sm }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.lg, paddingBottom: spacing.md,
    borderBottomWidth: 1, borderBottomColor: c.divider,
  },
  headerTitle: { fontSize: fontSize.lg, fontWeight: "800", color: c.onSurface },
  label: { fontSize: fontSize.base, fontWeight: "600", color: c.onSurfaceSecondary },
  segment: { flexDirection: "row", gap: spacing.sm, backgroundColor: c.surfaceSecondary, padding: spacing.xs, borderRadius: radius.md },
  segmentItem: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs,
    paddingVertical: spacing.md, borderRadius: radius.sm,
  },
  segmentText: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurfaceSecondary },
}));
