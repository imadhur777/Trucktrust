import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api, User } from "@/src/api/client";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { ScreenHeader } from "@/src/components/screen-header";
import { AppButton, Field, Icon, Badge, Card, StarRating } from "@/src/components/ui";
import { useToast } from "@/src/components/toast";
import { useAuth } from "@/src/auth/auth-context";

export function ProfileScreen({ role }: { role: "shipper" | "driver" }) {
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { user, setUser, signOut } = useAuth();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [company, setCompany] = useState(user?.company ?? "");
  const [truckType, setTruckType] = useState(user?.truck_type ?? "");
  const [capacity, setCapacity] = useState(user?.capacity ?? "");
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const onSave = async () => {
    setSaving(true);
    try {
      const updated = await api.put<User>("/auth/me", {
        name,
        phone,
        company: role === "shipper" ? company : undefined,
        truck_type: role === "driver" ? truckType : undefined,
        capacity: role === "driver" ? capacity : undefined,
      });
      setUser(updated);
      toast("Profile updated", "success");
      setEditing(false);
    } catch (e: any) {
      toast(e.message || "Could not update", "error");
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader title="Profile" subtitle={user.email} />
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + spacing.xl, gap: spacing.md }}
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ alignItems: "center", gap: spacing.sm }}>
          <View style={s.avatar}>
            <Icon name={role === "shipper" ? "package-variant-closed" : "truck"} size={34} color={colors.onBrandPrimary} />
          </View>
          <Text style={s.name}>{user.name}</Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Badge label={role === "shipper" ? "Shipper" : "Driver"} tone="brand" />
            <Badge
              label={user.verified ? "Verified" : "KYC pending"}
              tone={user.verified ? "success" : "warning"}
              icon={user.verified ? "shield-check" : "shield-alert"}
            />
          </View>
          {user.rating_count > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <StarRating value={user.rating_avg} size={16} />
              <Text style={s.ratingText}>
                {user.rating_avg} ({user.rating_count})
              </Text>
            </View>
          ) : null}
        </Card>

        {editing ? (
          <>
            <Field label="Full name" value={name} onChangeText={setName} testID="profile-name-input" />
            <Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="profile-phone-input" />
            {role === "shipper" ? (
              <Field label="Company" value={company} onChangeText={setCompany} testID="profile-company-input" />
            ) : (
              <>
                <Field label="Truck type" value={truckType} onChangeText={setTruckType} testID="profile-trucktype-input" />
                <Field label="Capacity" value={capacity} onChangeText={setCapacity} testID="profile-capacity-input" />
              </>
            )}
            <View style={{ flexDirection: "row", gap: spacing.md }}>
              <AppButton title="Cancel" variant="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }} testID="profile-cancel-button" />
              <AppButton title="Save" onPress={onSave} loading={saving} style={{ flex: 1 }} testID="profile-save-button" />
            </View>
          </>
        ) : (
          <Card>
            <Row label="Phone" value={user.phone || "Not set"} />
            {role === "shipper" ? <Row label="Company" value={user.company || "Not set"} /> : null}
            {role === "driver" ? <Row label="Truck type" value={user.truck_type || "Not set"} /> : null}
            {role === "driver" ? <Row label="Capacity" value={user.capacity || "Not set"} /> : null}
            <Pressable onPress={() => setEditing(true)} style={s.editRow} testID="profile-edit-button">
              <Icon name="pencil" size={16} color={colors.brandPrimary} />
              <Text style={s.editText}>Edit profile</Text>
            </Pressable>
          </Card>
        )}

        <AppButton title="Sign out" variant="outline" icon="logout" onPress={onLogout} testID="profile-logout-button" />
      </KeyboardAwareScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const s = useStyles();
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  avatar: {
    width: 72, height: 72, borderRadius: radius.pill, backgroundColor: c.brandPrimary,
    alignItems: "center", justifyContent: "center",
  },
  name: { fontSize: fontSize.xl, fontWeight: "800", color: c.onSurface },
  ratingText: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurfaceSecondary },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: c.divider,
  },
  infoLabel: { fontSize: fontSize.base, color: c.muted },
  infoValue: { fontSize: fontSize.base, fontWeight: "700", color: c.onSurface },
  editRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: spacing.md },
  editText: { fontSize: fontSize.base, fontWeight: "700", color: c.brandPrimary },
}));
