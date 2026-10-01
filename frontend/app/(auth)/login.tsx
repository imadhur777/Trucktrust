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
      <View style={s.hero}>
        <Image source={{ uri: HERO_IMAGE }} style={s.heroImg} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(17,24,39,0.4)", colors.surface]}
          locations={[0, 0.5, 1]}
          style={s.scrim}
        />
        <View style={[s.brandRow, { top: insets.top + spacing.lg }]}>
          <View style={s.logoBadge}>
            <Icon name="truck-fast" size={24} color={colors.onBrandPrimary} />
          </View>
          <Text style={s.brandName}>TruckTrust</Text>
        </View>
        <View style={s.heroCopy}>
          <Text style={s.heroTitle}>Fill every return trip.</Text>
          <Text style={s.heroSub}>Verified loads. Trusted drivers. Zero empty miles.</Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={s.form}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Sign in</Text>
        <Field
          label="Email"
          placeholder="you@company.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          testID="login-email-input"
        />
        <Field
          label="Password"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          testID="login-password-input"
        />
        <AppButton title="Sign in" onPress={onLogin} loading={loading} testID="login-submit-button" />
        <Pressable
          onPress={() => router.push("/(auth)/register")}
          style={s.switchRow}
          testID="go-to-register-button"
        >
          <Text style={s.switchMuted}>New to TruckTrust? </Text>
          <Text style={s.switchLink}>Create an account</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { height: 320, width: "100%" },
  heroImg: { width: "100%", height: "100%" },
  scrim: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0 },
  brandRow: { position: "absolute", left: spacing.lg, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoBadge: {
    width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.brandPrimary,
    alignItems: "center", justifyContent: "center",
  },
  brandName: { color: "#FFFFFF", fontSize: fontSize.xl, fontWeight: "800" },
  heroCopy: { position: "absolute", left: spacing.lg, right: spacing.lg, bottom: spacing.xl },
  heroTitle: { color: c.onSurface, fontSize: fontSize["2xl"], fontWeight: "800" },
  heroSub: { color: c.muted, fontSize: fontSize.base, marginTop: 4 },
  form: { flex: 1 },
  title: { fontSize: fontSize.xl, fontWeight: "800", color: c.onSurface, marginBottom: spacing.xs },
  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.md },
  switchMuted: { color: c.muted, fontSize: fontSize.base },
  switchLink: { color: c.brandPrimary, fontSize: fontSize.base, fontWeight: "700" },
}));
