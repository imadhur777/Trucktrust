import { useEffect } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/src/auth/auth-context";
import { Loading } from "@/src/components/ui";
import { useTheme } from "@/src/theme";

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <Loading />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === "shipper") return <Redirect href="/shipper" />;
  if (user.role === "driver") return <Redirect href="/driver" />;
  return <Redirect href="/admin" />;
}
