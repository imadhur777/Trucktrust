import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api/client";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, spacing, fontSize, useTheme } from "@/src/theme";
import { ScreenHeader } from "@/src/components/screen-header";
import { AppButton, Field } from "@/src/components/ui";
import { ChipRow } from "@/src/components/chip-row";
import { useToast } from "@/src/components/toast";
import { TRUCK_TYPES, BODY_TYPES, MATERIALS } from "@/src/constants";

export default function PostLoad() {
  const s = useStyles();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [date, setDate] = useState("");
  const [weight, setWeight] = useState("");
  const [material, setMaterial] = useState(MATERIALS[0]);
  const [truckType, setTruckType] = useState(TRUCK_TYPES[0]);
  const [bodyType, setBodyType] = useState(BODY_TYPES[0]);
  const [special, setSpecial] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setPickup(""); setDrop(""); setDate(""); setWeight(""); setSpecial(""); setPrice("");
  };

  const onSubmit = async () => {
    if (!pickup || !drop || !date || !weight || !price) {
      toast("Please fill pickup, drop, date, weight and price", "error");
      return;
    }
    setLoading(true);
    try {
      await api.post("/loads", {
        pickup,
        drop,
        date,
        weight,
        material,
        truck_type: truckType,
        body_type: bodyType,
        special_requirements: special,
        expected_price: parseFloat(price) || 0,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await qc.invalidateQueries({ queryKey: ["my-loads"] });
      toast("Load posted", "success");
      reset();
      router.replace("/shipper");
    } catch (e: any) {
      toast(e.message || "Could not post load", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: useTheme().colors.surface }}>
      <ScreenHeader title="Post a Load" subtitle="Describe your freight requirement" />
      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: bottomChrome + 120, gap: spacing.md }}
        bottomOffset={20}
        showsVerticalScrollIndicator={false}
      >
        <Field label="Pickup location" placeholder="e.g. Mumbai, MH" value={pickup} onChangeText={setPickup} testID="post-pickup-input" />
        <Field label="Drop location" placeholder="e.g. Delhi, DL" value={drop} onChangeText={setDrop} testID="post-drop-input" />
        <Field label="Pickup date" placeholder="e.g. 12 Jun 2026" value={date} onChangeText={setDate} testID="post-date-input" />
        <Field label="Weight" placeholder="e.g. 10 ton" value={weight} onChangeText={setWeight} testID="post-weight-input" />

        <Text style={s.label}>Material</Text>
        <ChipRow options={MATERIALS} value={material} onChange={setMaterial} testIDPrefix="post-material" />

        <Text style={s.label}>Truck type</Text>
        <ChipRow options={TRUCK_TYPES} value={truckType} onChange={setTruckType} testIDPrefix="post-trucktype" />

        <Text style={s.label}>Body type</Text>
        <ChipRow options={BODY_TYPES} value={bodyType} onChange={setBodyType} testIDPrefix="post-bodytype" />

        <Field label="Expected price (₹)" placeholder="e.g. 25000" keyboardType="numeric" value={price} onChangeText={setPrice} testID="post-price-input" />
        <Field label="Special requirements (optional)" placeholder="Any instructions" value={special} onChangeText={setSpecial} multiline testID="post-special-input" />

        <AppButton title="Post Load" icon="send" onPress={onSubmit} loading={loading} testID="post-submit-button" style={{ marginTop: spacing.sm }} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  label: { fontSize: fontSize.base, fontWeight: "600", color: c.onSurfaceSecondary },
}));
