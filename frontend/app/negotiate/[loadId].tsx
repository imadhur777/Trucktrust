import { useState, useRef, useEffect } from "react";
import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Platform, TextInput, Pressable } from "react-native";

import { api, ChatMessage } from "@/src/api/client";
import { makeStyles, spacing, radius, fontSize, useTheme } from "@/src/theme";
import { ScreenHeader } from "@/src/components/screen-header";
import { Icon, Loading } from "@/src/components/ui";
import { useAuth } from "@/src/auth/auth-context";

export default function Negotiate() {
  const { loadId, driver, driverName } = useLocalSearchParams<{ loadId: string; driver?: string; driverName?: string }>();
  const s = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);

  const threadWith = user?.role === "driver" ? user.id : driver;
  const [text, setText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["messages", loadId, threadWith],
    queryFn: () => api.get<ChatMessage[]>(`/loads/${loadId}/messages?with_user=${threadWith}`),
    refetchInterval: 4000,
  });

  useEffect(() => {
    if (data?.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [data?.length]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    setText("");
    try {
      await api.post(`/loads/${loadId}/messages?with_user=${threadWith}`, { text: t });
      qc.invalidateQueries({ queryKey: ["messages", loadId, threadWith] });
    } catch {
      setText(t);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <ScreenHeader title="Negotiation" subtitle={user?.role === "shipper" ? driverName || "Driver" : "Shipper"} onBack={() => router.back()} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={0}>
        {isLoading ? (
          <Loading />
        ) : (
          <FlatList
            ref={listRef}
            data={data ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm, flexGrow: 1 }}
            renderItem={({ item }) => {
              const mine = item.sender_id === user?.id;
              if (item.type === "offer") {
                return (
                  <View style={s.systemWrap}>
                    <View style={s.system}>
                      <Icon name="gavel" size={13} color={colors.onSurfaceInverse} />
                      <Text style={s.systemText}>{item.text}</Text>
                    </View>
                  </View>
                );
              }
              return (
                <View style={[s.bubble, mine ? s.mine : s.theirs]}>
                  <Text style={[s.bubbleText, mine && { color: colors.onBrandPrimary }]}>{item.text}</Text>
                </View>
              );
            }}
            ListEmptyComponent={<Text style={s.empty}>Start the conversation about this load.</Text>}
          />
        )}
        <View style={[s.inputBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TextInput
            style={s.input}
            placeholder="Type a message"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            testID="chat-input"
          />
          <Pressable style={s.sendBtn} onPress={send} testID="chat-send-button">
            <Icon name="send" size={20} color={colors.onBrandPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  bubble: { maxWidth: "80%", paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md },
  mine: { alignSelf: "flex-end", backgroundColor: c.brandPrimary, borderBottomRightRadius: 4 },
  theirs: { alignSelf: "flex-start", backgroundColor: c.surfaceSecondary, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: fontSize.base, color: c.onSurface },
  systemWrap: { alignItems: "center" },
  system: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: c.surfaceInverse, paddingVertical: 6, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  systemText: { fontSize: fontSize.sm, color: c.onSurfaceInverse, fontWeight: "700" },
  empty: { textAlign: "center", color: c.muted, marginTop: spacing["2xl"], fontSize: fontSize.base },
  inputBar: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md,
    borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.surface,
  },
  input: {
    flex: 1, backgroundColor: c.surfaceTertiary, borderRadius: radius.pill, paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md, fontSize: fontSize.base, color: c.onSurface, maxHeight: 100,
  },
  sendBtn: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
}));
