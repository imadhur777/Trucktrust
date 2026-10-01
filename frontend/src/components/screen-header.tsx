import React from "react";
import { View, Text, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { makeStyles, spacing, fontSize, useTheme } from "@/src/theme";
import { Icon } from "@/src/components/ui";

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.header, { paddingTop: insets.top + spacing.sm }]}>
      <View style={s.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={s.back} testID="header-back-button">
            <Icon name="arrow-left" size={24} color={colors.onSurface} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={s.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  header: {
    backgroundColor: c.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  back: { paddingRight: spacing.xs },
  title: { fontSize: fontSize["2xl"], fontWeight: "800", color: c.onSurface },
  subtitle: { fontSize: fontSize.base, color: c.muted, marginTop: 2 },
}));
