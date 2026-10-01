import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { AppButton, Field, Icon } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/auth/auth-context";
import { api, TOKEN_KEY, User } from "@/src/api/client";
import { storage } from "@/src/utils/storage";

type Step = "email" | "code" | "password";

const STEPS: { key: Step; icon: "email-outline" | "shield-key-outline" | "lock-reset"; title: string; sub: string }[] = [
  { key: "email", icon: "email-outline", title: "Forgot your password?", sub: "Enter your account email and we'll send you a 6-digit reset code." },
  { key: "code", icon: "shield-key-outline", title: "Check your inbox", sub: "Enter the 6-digit code we emailed you. It expires in 10 minutes." },
  { key: "password", icon: "lock-reset", title: "Choose a new password", sub: "Use at least 6 characters. You'll be signed in automatically." },
];

export default function ForgotPassword() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async () => {
    const e = email.trim();
    if (!e || !e.includes("@")) {
      toast("Enter a valid email address", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: e });
      toast("Reset code sent — check your email", "success");
      setStep("code");
      setCooldown(30);
    } catch (err: any) {
      toast(err.message || "Could not send code", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      toast("Enter the 6-digit code", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ reset_token: string }>("/auth/verify-reset-code", { email: email.trim(), code });
      setResetToken(res.reset_token);
      setStep("password");
    } catch (err: any) {
      toast(err.message || "Incorrect code", "error");
    } finally {
      setLoading(false);
    }
  };

  const savePassword = async () => {
    if (password.length < 6) {
      toast("Password must be at least 6 characters", "error");
      return;
    }
    if (password !== confirm) {
      toast("Passwords do not match", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ access_token: string; user: User }>("/auth/reset-password", {
        reset_token: resetToken,
        new_password: password,
      });
      await storage.secureSet(TOKEN_KEY, res.access_token);
      setUser(res.user);
      toast("Password updated", "success");
      if (res.user.role === "shipper") router.replace("/shipper");
      else if (res.user.role === "driver") router.replace("/driver");
      else router.replace("/admin");
    } catch (err: any) {
      toast(err.message || "Could not reset password", "error");
      if (String(err.message || "").toLowerCase().includes("expired")) setStep("email");
    } finally {
      setLoading(false);
    }
  };

  const meta = STEPS.find((x) => x.key === step)!;
  const stepIndex = STEPS.findIndex((x) => x.key === step);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => (step === "email" ? router.back() : setStep(step === "code" ? "email" : "code"))}
          hitSlop={10}
          style={s.backBtn}
          testID="forgot-back-button"
        >
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </Pressable>
        <View style={s.dots}>
          {STEPS.map((x, i) => (
            <View key={x.key} style={[s.dot, i <= stepIndex && { backgroundColor: colors.brandPrimary, width: 22 }]} />
          ))}
        </View>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.lg }}
        bottomOffset={24}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.iconWrap}>
          <Icon name={meta.icon} size={34} color={colors.brandPrimary} />
        </View>
        <View>
          <Text style={s.title}>{meta.title}</Text>
          <Text style={s.sub}>{meta.sub}</Text>
        </View>

        {step === "email" && (
          <>
            <Field
              label="Email"
              leftIcon="email-outline"
              placeholder="you@company.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              onSubmitEditing={sendCode}
              testID="forgot-email-input"
            />
            <AppButton title="Send reset code" icon="send" onPress={sendCode} loading={loading} testID="forgot-send-button" />
          </>
        )}

        {step === "code" && (
          <>
            <View style={s.emailChip}>
              <Icon name="email-check-outline" size={16} color={colors.onBrandTertiary} />
              <Text style={s.emailChipText}>{email.trim()}</Text>
            </View>
            <Field
              label="6-digit code"
              leftIcon="numeric"
              placeholder="••••••"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(t) => setCode(t.replace(/[^0-9]/g, ""))}
              onSubmitEditing={verifyCode}
              style={{ letterSpacing: 6, fontSize: fontSize.xl, fontWeight: "700" }}
              testID="forgot-code-input"
            />
            <AppButton title="Verify code" icon="check" onPress={verifyCode} loading={loading} testID="forgot-verify-button" />
            <Pressable
              onPress={cooldown > 0 ? undefined : sendCode}
              style={s.resendRow}
              testID="forgot-resend-button"
            >
              <Text style={s.switchMuted}>{"Didn't get it? "}</Text>
              <Text style={[s.switchLink, cooldown > 0 && { color: colors.muted }]}>
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </Text>
            </Pressable>
          </>
        )}

        {step === "password" && (
          <>
            <Field
              label="New password"
              leftIcon="lock-outline"
              placeholder="At least 6 characters"
              secureTextEntry={!showPw}
              value={password}
              onChangeText={setPassword}
              testID="forgot-new-password-input"
              right={
                <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10}>
                  <Icon name={showPw ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                </Pressable>
              }
            />
            <Field
              label="Confirm password"
              leftIcon="lock-check-outline"
              placeholder="Re-enter password"
              secureTextEntry={!showPw}
              value={confirm}
              onChangeText={setConfirm}
              onSubmitEditing={savePassword}
              testID="forgot-confirm-password-input"
            />
            <AppButton title="Save & sign in" icon="check-circle-outline" onPress={savePassword} loading={loading} testID="forgot-save-button" />
          </>
        )}

        <Pressable onPress={() => router.replace("/(auth)/login")} style={s.resendRow} testID="forgot-to-login-button">
          <Text style={s.switchMuted}>Remembered it? </Text>
          <Text style={s.switchLink}>Back to sign in</Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: spacing.md, paddingBottom: spacing.sm,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", gap: 6, alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary },
  iconWrap: {
    width: 72, height: 72, borderRadius: radius.pill, backgroundColor: c.brandTertiary,
    alignItems: "center", justifyContent: "center", marginTop: spacing.sm,
  },
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: c.onSurface },
  sub: { fontSize: fontSize.base, color: c.muted, marginTop: 6, lineHeight: 20 },
  emailChip: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    backgroundColor: c.brandTertiary, paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radius.pill,
  },
  emailChipText: { color: c.onBrandTertiary, fontWeight: "700", fontSize: fontSize.sm },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", minHeight: 44 },
  switchMuted: { color: c.muted, fontSize: fontSize.base },
  switchLink: { color: c.brandPrimary, fontSize: fontSize.base, fontWeight: "700" },
}));
