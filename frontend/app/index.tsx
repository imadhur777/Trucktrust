import { useEffect, useState } from "react";
import { View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "@/src/auth/auth-context";
import { Loading } from "@/src/components/ui";
import { useTheme } from "@/src/theme";
import { storage } from "@/src/utils/storage";
import { ONBOARDING_KEY } from "@/src/constants";

export default function Index() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    storage.getItem<boolean>(ONBOARDING_KEY, false).then((v) => setOnboarded(!!v));
  }, []);

  if (loading || onboarded === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <Loading />
      </View>
    );
  }

  if (!user) return <Redirect href={onboarded ? "/(auth)/login" : "/onboarding"} />;
  if (user.role === "shipper") return <Redirect href="/shipper" />;
  if (user.role === "driver") return <Redirect href="/driver" />;
  return <Redirect href="/admin" />;
}
