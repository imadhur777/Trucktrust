import React from "react";
import { ScrollView, Pressable, Text } from "react-native";
import { radius, spacing, fontSize, useTheme } from "@/src/theme";
import * as Haptics from "expo-haptics";

export function ChipRow({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  testIDPrefix?: string;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ maxHeight: 56 }}
      contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg, alignItems: "center" }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <Pressable
            key={opt}
            testID={testIDPrefix ? `${testIDPrefix}-${opt}` : undefined}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(opt);
            }}
            style={{
              flexShrink: 0,
              height: 36,
              paddingHorizontal: spacing.md,
              borderRadius: radius.pill,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: active ? colors.brandPrimary : colors.border,
            }}
          >
            <Text
              style={{
                fontSize: fontSize.base,
                fontWeight: "600",
                color: active ? colors.onBrandPrimary : colors.onSurfaceSecondary,
              }}
            >
              {opt}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
