import { View, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, Booking } from "@/src/api/client";
import { usesNativeTabs } from "@/src/navigation";
import { spacing, useTheme } from "@/src/theme";
import { ScreenHeader } from "@/src/components/screen-header";
import { BookingCard } from "@/src/components/booking-card";
import { EmptyState, Loading } from "@/src/components/ui";

export function TripsScreen({ role }: { role: "shipper" | "driver" }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => api.get<Booking[]>("/bookings/mine"),
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader title="My Trips" subtitle="Track pickups and deliveries" />
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{
            padding: spacing.lg,
            paddingBottom: bottomChrome + spacing.xl,
            gap: spacing.md,
            flexGrow: 1,
          }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
          renderItem={({ item }) => (
            <BookingCard booking={item} role={role} onPress={() => router.push(`/booking/${item.id}`)} />
          )}
          ListEmptyComponent={
            <View style={{ flex: 1, justifyContent: "center", paddingTop: spacing["3xl"] }}>
              <EmptyState
                icon="map-marker-path"
                title="No trips yet"
                subtitle={
                  role === "shipper"
                    ? "Once you accept an offer, your booked trips appear here."
                    : "Accepted bookings and ongoing trips will appear here."
                }
              />
            </View>
          }
        />
      )}
    </View>
  );
}
