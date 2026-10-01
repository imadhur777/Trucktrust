import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { radius, spacing, fontSize, useTheme } from "@/src/theme";
import { Icon } from "@/src/components/ui";

type ToastTone = "success" | "error" | "info";
interface ToastItem {
  message: string;
  tone: ToastTone;
}

const ToastContext = createContext<(msg: string, tone?: ToastTone) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<ToastItem | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const show = useCallback(
    (message: string, tone: ToastTone = "info") => {
      setItem({ message, tone });
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
          setItem(null),
        );
      }, 2600);
    },
    [opacity],
  );

  const toneColor: Record<ToastTone, string> = {
    success: colors.success,
    error: colors.error,
    info: colors.surfaceInverse,
  };
  const toneIcon: Record<ToastTone, any> = {
    success: "check-circle",
    error: "alert-circle",
    info: "information",
  };

  return (
    <ToastContext.Provider value={show}>
      {children}
      {item ? (
        <Animated.View
          style={{
            position: "absolute",
            top: insets.top + spacing.sm,
            left: spacing.lg,
            right: spacing.lg,
            opacity,
            zIndex: 9999,
            pointerEvents: "none",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: spacing.sm,
              backgroundColor: toneColor[item.tone],
              paddingVertical: spacing.md,
              paddingHorizontal: spacing.lg,
              borderRadius: radius.md,
              boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <Icon name={toneIcon[item.tone]} size={20} color={colors.onSurfaceInverse} />
            <Text
              style={{
                color: colors.onSurfaceInverse,
                fontSize: fontSize.base,
                fontWeight: "600",
                flex: 1,
              }}
            >
              {item.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
