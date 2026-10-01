import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  PressableProps,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";
import * as Haptics from "expo-haptics";
import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";

type IconName = React.ComponentProps<typeof MaterialDesignIcons>["name"];

export function Icon({
  name,
  size = 22,
  color,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  return <MaterialDesignIcons name={name} size={size} color={color ?? colors.onSurface} />;
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
export function AppButton({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
  testID,
}: {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const s = useBtnStyles();
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const bg: Record<string, string> = {
    primary: colors.brandPrimary,
    secondary: colors.surfaceSecondary,
    outline: "transparent",
    ghost: "transparent",
    danger: colors.error,
  };
  const fg: Record<string, string> = {
    primary: colors.onBrandPrimary,
    secondary: colors.onSurfaceSecondary,
    outline: colors.brandPrimary,
    ghost: colors.brandPrimary,
    danger: colors.onError,
  };
  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (isDisabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        s.base,
        {
          backgroundColor: bg[variant],
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: colors.brandPrimary,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={s.row}>
          {icon ? <Icon name={icon} size={18} color={fg[variant]} /> : null}
          <Text style={[s.label, { color: fg[variant] }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const useBtnStyles = makeStyles((c) => ({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { fontSize: fontSize.lg, fontWeight: "700" },
}));

// ---------------------------------------------------------------------------
// Field (labeled text input)
// ---------------------------------------------------------------------------
export function Field({
  label,
  error,
  containerStyle,
  leftIcon,
  right,
  ...props
}: TextInputProps & {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  leftIcon?: IconName;
  right?: React.ReactNode;
}) {
  const s = useFieldStyles();
  const { colors } = useTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[{ gap: spacing.xs }, containerStyle]}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <View
        style={[
          s.inputWrap,
          focused ? { borderColor: colors.brandPrimary, backgroundColor: colors.surface } : null,
          error ? { borderColor: colors.error } : null,
        ]}
      >
        {leftIcon ? <Icon name={leftIcon} size={20} color={focused ? colors.brandPrimary : colors.muted} /> : null}
        <TextInput
          placeholderTextColor={colors.muted}
          style={s.input}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        {right}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
    </View>
  );
}

const useFieldStyles = makeStyles((c) => ({
  label: { fontSize: fontSize.base, fontWeight: "600", color: c.onSurfaceSecondary },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: c.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: c.border,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.lg,
    color: c.onSurface,
    minHeight: 50,
    ...Platform.select({ web: { outlineWidth: 0 } as any }),
  },
  error: { fontSize: fontSize.sm, color: c.error },
}));

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({
  children,
  style,
  onPress,
  testID,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  testID?: string;
}) {
  const s = useCardStyles();
  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        style={({ pressed }) => [s.card, { opacity: pressed ? 0.9 : 1 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={[s.card, style]}>
      {children}
    </View>
  );
}

const useCardStyles = makeStyles((c) => ({
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
  },
}));

// ---------------------------------------------------------------------------
// Badge / Status pill
// ---------------------------------------------------------------------------
export function Badge({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "error" | "brand" | "info";
  icon?: IconName;
}) {
  const { colors } = useTheme();
  const map: Record<string, { bg: string; fg: string }> = {
    neutral: { bg: colors.surfaceTertiary, fg: colors.onSurfaceTertiary },
    success: { bg: colors.success, fg: colors.onSuccess },
    warning: { bg: colors.warning, fg: colors.onWarning },
    error: { bg: colors.error, fg: colors.onError },
    brand: { bg: colors.brandTertiary, fg: colors.onBrandTertiary },
    info: { bg: colors.surfaceInverse, fg: colors.onSurfaceInverse },
  };
  const { bg, fg } = map[tone];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: bg,
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.pill,
        alignSelf: "flex-start",
      }}
    >
      {icon ? <Icon name={icon} size={13} color={fg} /> : null}
      <Text style={{ color: fg, fontSize: fontSize.sm, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Star rating (display + interactive)
// ---------------------------------------------------------------------------
export function StarRating({
  value,
  size = 18,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (v: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable
          key={i}
          disabled={!onChange}
          onPress={() => onChange?.(i)}
          testID={onChange ? `star-${i}` : undefined}
        >
          <Icon
            name={i <= Math.round(value) ? "star" : "star-outline"}
            size={size}
            color={i <= Math.round(value) ? colors.brandSecondary : colors.muted}
          />
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
export function EmptyState({
  icon = "inbox-outline",
  title,
  subtitle,
}: {
  icon?: IconName;
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: "center", padding: spacing["2xl"], gap: spacing.sm }}>
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.pill,
          backgroundColor: colors.brandTertiary,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} size={34} color={colors.brandPrimary} />
      </View>
      <Text style={{ fontSize: fontSize.xl, fontWeight: "700", color: colors.onSurface, textAlign: "center" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ fontSize: fontSize.base, color: colors.muted, textAlign: "center", maxWidth: 280 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------
export function Loading() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
      <ActivityIndicator size="large" color={colors.brandPrimary} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Route row: A -> B
// ---------------------------------------------------------------------------
export function RouteRow({ from, to, big }: { from: string; to: string; big?: boolean }) {
  const { colors } = useTheme();
  const fs = big ? fontSize.xl : fontSize.lg;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" }}>
      <Icon name="circle-outline" size={14} color={colors.brandSecondary} />
      <Text style={{ fontSize: fs, fontWeight: "800", color: colors.onSurface, flexShrink: 1 }}>{from}</Text>
      <Icon name="arrow-right" size={16} color={colors.muted} />
      <Icon name="map-marker" size={15} color={colors.brandPrimary} />
      <Text style={{ fontSize: fs, fontWeight: "800", color: colors.onSurface, flexShrink: 1 }}>{to}</Text>
    </View>
  );
}
