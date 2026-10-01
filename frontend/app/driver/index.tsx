import { useState } from "react";
import { View, FlatList, RefreshControl, Text } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Load } from "@/src/api/client";
import { usesNativeTabs } from "@/src/navigation";
import { spacing, fontSize, useTheme } from "@/src/theme";
import { ScreenHeader } from "@/src/components/screen-header";
import { ChipRow } from "@/src/components/chip-row";
import { LoadCard } from "@/src/components/load-card";
import { EmptyState, Loading } from "@/src/components/ui";
import { TRUCK_TYPES, formatMoney } from "@/src/constants";

export default function DriverHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;
  const [filter, setFilter] = useState("All");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["available-loads", filter],
    queryFn: () => api.get<Load[]>(`/loads${filter !== "All" ? `?truck_type=${encodeURIComponent(filter)}` : ""}`),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View style={{ backgroundColor: colors.surface }}>
        <ScreenHeader title="Available Loads" subtitle="Find return loads on your route" />
        <View style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <ChipRow options={["All", ...TRUCK_TYPES]} value={filter} onChange={setFilter} testIDPrefix="driver-filter" />
        </View>
      </View>
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: bottomChrome + spacing.xl,
            gap: spacing.md,
            flexGrow: 1,
          }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
          renderItem={({ item }) => (
            <LoadCard
              load={item}
              onPress={() => router.push(`/load/${item.id}`)}
              showOffers={!item.my_offer}
              rightLabel={item.my_offer ? `Your offer: ${formatMoney(item.my_offer.amount)}` : undefined}
            />
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", paddingTop: spacing["3xl"] }}>
              <EmptyState
                icon="truck-remove"
                title="No return loads"
                subtitle="No loads match this filter right now. Pull to refresh or try another truck type."
              />
            </View>
          }
        />
      )}
    </View>
  );
}
