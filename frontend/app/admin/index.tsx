import { useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, User, Load, Booking, Dispute } from "@/src/api/client";
import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { ScreenHeader } from "@/src/components/screen-header";
import { ChipRow } from "@/src/components/chip-row";
import { AppButton, Icon, Badge, Card, Loading } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/auth/auth-context";
import { formatMoney } from "@/src/constants";

const TABS = ["Overview", "Users", "Loads", "Bookings", "Disputes"];

export default function AdminDashboard() {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState("Overview");

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => api.get<any>("/admin/stats") });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => api.get<User[]>("/admin/users"), enabled: tab === "Users" });
  const loads = useQuery({ queryKey: ["admin-loads"], queryFn: () => api.get<Load[]>("/admin/loads"), enabled: tab === "Loads" });
  const bookings = useQuery({ queryKey: ["admin-bookings"], queryFn: () => api.get<Booking[]>("/admin/bookings"), enabled: tab === "Bookings" });
  const disputes = useQuery({ queryKey: ["admin-disputes"], queryFn: () => api.get<Dispute[]>("/admin/disputes"), enabled: tab === "Disputes" });

  const verifyUser = async (uid: string) => {
    try {
      await api.post(`/admin/users/${uid}/verify`);
      toast("User verified", "success");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e: any) {
      toast(e.message, "error");
    }
  };
  const resolveDispute = async (did: string) => {
    try {
      await api.post(`/admin/disputes/${did}/resolve`);
      toast("Dispute resolved", "success");
      qc.invalidateQueries({ queryKey: ["admin-disputes"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    } catch (e: any) {
      toast(e.message, "error");
    }
  };

  const logout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader
        title="Admin"
        subtitle={user?.name}
        right={
          <AppButton title="Logout" variant="ghost" onPress={logout} testID="admin-logout-button" style={{ height: 40, paddingHorizontal: 0 }} />
        }
      />
      <View style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        <ChipRow options={TABS} value={tab} onChange={setTab} testIDPrefix="admin-tab" />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              stats.refetch(); users.refetch(); loads.refetch(); bookings.refetch(); disputes.refetch();
            }}
          />
        }
      >
        {tab === "Overview" ? (
          stats.isLoading ? (
            <Loading />
          ) : (
            <>
              <View style={s.statGrid}>
                <Stat icon="account-group" label="Users" value={stats.data?.users} />
                <Stat icon="package-variant" label="Loads" value={stats.data?.loads} />
                <Stat icon="truck-check" label="Bookings" value={stats.data?.bookings} />
                <Stat icon="map-marker-path" label="Active trips" value={stats.data?.active_trips} />
                <Stat icon="check-decagram" label="Completed" value={stats.data?.completed_trips} />
                <Stat icon="alert-circle" label="Open disputes" value={stats.data?.open_disputes} />
              </View>
              <Card style={{ gap: spacing.sm }}>
                <Text style={s.cardTitle}>Marketplace</Text>
                <RowKV k="Shippers" v={String(stats.data?.shippers ?? 0)} />
                <RowKV k="Drivers" v={String(stats.data?.drivers ?? 0)} />
                <RowKV k="Open loads" v={String(stats.data?.open_loads ?? 0)} />
                <RowKV k="GMV (paid)" v={formatMoney(stats.data?.gmv ?? 0)} strong />
              </Card>
            </>
          )
        ) : null}

        {tab === "Users" ? (
          users.isLoading ? <Loading /> : (users.data ?? []).map((u) => (
            <Card key={u.id} style={{ gap: spacing.sm }}>
              <View style={s.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={s.title}>{u.name}</Text>
                  <Text style={s.muted}>{u.email}</Text>
                </View>
                <Badge label={u.role} tone="brand" />
              </View>
              <View style={s.rowBetween}>
                <Badge label={u.verified ? "Verified" : "KYC pending"} tone={u.verified ? "success" : "warning"} />
                {!u.verified && u.role !== "admin" ? (
                  <AppButton title="Verify" onPress={() => verifyUser(u.id)} style={{ height: 40 }} testID={`verify-user-${u.id}`} />
                ) : null}
              </View>
            </Card>
          ))
        ) : null}

        {tab === "Loads" ? (
          loads.isLoading ? <Loading /> : (loads.data ?? []).map((l) => (
            <Card key={l.id} style={{ gap: 4 }}>
              <View style={s.rowBetween}>
                <Text style={s.title}>{l.pickup} → {l.drop}</Text>
                <Badge label={l.status} tone={l.status === "open" ? "brand" : l.status === "completed" ? "success" : "warning"} />
              </View>
              <Text style={s.muted}>{l.shipper_name} · {l.truck_type} · {l.weight} · {formatMoney(l.expected_price)}</Text>
            </Card>
          ))
        ) : null}

        {tab === "Bookings" ? (
          bookings.isLoading ? <Loading /> : (bookings.data ?? []).map((bk) => (
            <Card key={bk.id} style={{ gap: 4 }}>
              <View style={s.rowBetween}>
                <Text style={s.title}>{bk.booking_ref}</Text>
                <Badge label={bk.trip_status} tone={bk.trip_status === "delivered" ? "success" : bk.trip_status === "in_transit" ? "info" : "warning"} />
              </View>
              <Text style={s.muted}>{bk.pickup} → {bk.drop}</Text>
              <Text style={s.muted}>{bk.shipper_name} ↔ {bk.driver_name} · {formatMoney(bk.amount)} · {bk.payment_status}</Text>
            </Card>
          ))
        ) : null}

        {tab === "Disputes" ? (
          disputes.isLoading ? <Loading /> : (disputes.data ?? []).length === 0 ? (
            <Card><Text style={s.muted}>No disputes raised.</Text></Card>
          ) : (disputes.data ?? []).map((d) => (
            <Card key={d.id} style={{ gap: spacing.sm }}>
              <View style={s.rowBetween}>
                <Text style={s.title}>{d.subject}</Text>
                <Badge label={d.status} tone={d.status === "open" ? "error" : "success"} />
              </View>
              <Text style={s.muted}>{d.description}</Text>
              <Text style={s.muted}>Booking {d.booking_ref} · by {d.raised_by_name}</Text>
              {d.status === "open" ? (
                <AppButton title="Mark resolved" onPress={() => resolveDispute(d.id)} style={{ height: 42 }} testID={`resolve-dispute-${d.id}`} />
              ) : null}
            </Card>
          ))
        ) : null}
      </ScrollView>
    </View>
  );
}

function Stat({ icon, label, value }: { icon: any; label: string; value: number | undefined }) {
  const s = useStyles();
  const { colors } = useTheme();
  return (
    <View style={s.statCard}>
      <Icon name={icon} size={22} color={colors.brandPrimary} />
      <Text style={s.statValue}>{value ?? 0}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function RowKV({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  const s = useStyles();
  return (
    <View style={s.rowBetween}>
      <Text style={s.muted}>{k}</Text>
      <Text style={[s.title, strong && { color: undefined }]}>{v}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  statGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  statCard: {
    width: "47%", flexGrow: 1, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg,
    padding: spacing.lg, gap: 4, borderWidth: 1, borderColor: c.border,
  },
  statValue: { fontSize: fontSize["2xl"], fontWeight: "800", color: c.onSurface },
  statLabel: { fontSize: fontSize.sm, color: c.muted, fontWeight: "600" },
  cardTitle: { fontSize: fontSize.lg, fontWeight: "800", color: c.onSurface },
  title: { fontSize: fontSize.base, fontWeight: "800", color: c.onSurface },
  muted: { fontSize: fontSize.sm, color: c.muted },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
}));
