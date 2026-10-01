import { View, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Load } from "@/src/api/client";
import { usesNativeTabs } from "@/src/navigation";
import { spacing, useTheme } from "@/src/theme";
import { ScreenHeader } from "@/src/components/screen-header";
import { LoadCard } from "@/src/components/load-card";
import { EmptyState, Loading, AppButton } from "@/src/components/ui";
import { useAuth } from "@/src/auth/auth-context";

export default function ShipperHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useAuth();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-loads"],
    queryFn: () => api.get<Load[]>("/loads/mine"),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader title="My Loads" subtitle={`Hi ${user?.name?.split(" ")[0] ?? ""}, manage your shipments`} />
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: bottomChrome + 96,
            gap: spacing.md,
            flexGrow: 1,
          }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
          renderItem={({ item }) => (
            <LoadCard load={item} onPress={() => router.push(`/load/${item.id}`)} />
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", paddingTop: spacing["3xl"] }}>
              <EmptyState
                icon="package-variant"
                title="No active loads"
                subtitle="Post your first load and start receiving offers from verified drivers."
              />
            </View>
          }
        />
      )}
      <View style={{ position: "absolute", left: spacing.lg, right: spacing.lg, bottom: bottomChrome + 16 }}>
        <AppButton title="Post a Load" icon="plus" onPress={() => router.push("/shipper/post")} testID="post-load-fab" />
      </View>
    </View>
  );
}
