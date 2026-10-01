import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTheme } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";
import { Icon } from "@/src/components/ui";

export interface TabDef {
  name: string;
  title: string;
  sf: string; // SF symbol for iOS native tabs
  icon: any; // MaterialDesignIcons name for JS tabs
}

export function RoleTabs({ tabs }: { tabs: TabDef[] }) {
  const { colors } = useTheme();

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        {tabs.map((t) => (
          <NativeTabs.Trigger name={t.name} key={t.name}>
            <NativeTabs.Trigger.Icon sf={t.sf as any} />
            <NativeTabs.Trigger.Label>{t.title}</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, size }) => <Icon name={t.icon} size={size ?? 22} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
