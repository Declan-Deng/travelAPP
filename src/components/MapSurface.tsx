import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import SharedMapFrame from "./SharedMapFrame";
import { buildSharedMapDocument } from "../lib/sharedMapDocument";

type Spot = {
  id: string;
  name: string;
  coords: [number, number];
  subtitle?: string;
};

type Props = {
  routeCoords: [number, number][];
  mapMode: "route" | "focus" | "all";
  mapTitle: string;
  mapKicker: string;
  bottomInset?: number;
  routeSpots: Spot[];
  extraSpots: Spot[];
  citySpots: Spot[];
  selectedSpot: any;
  userLocation: [number, number] | null;
  onSelectSpot: (spotId: string) => void;
  onOpenDetail: (spotId: string) => void;
  onFocusRoute: () => void;
  onFocusAllCity: () => void;
  getImageSource: (spotId?: string | null) => any;
  getSpotIntro: (spot: any) => string;
  getSpotOpenHours: (spotId?: string | null) => string;
  getSpotRating: (spotId?: string | null) => number;
};

export default function MapSurface({
  routeCoords,
  mapMode,
  mapTitle,
  mapKicker,
  bottomInset = 0,
  routeSpots,
  extraSpots,
  citySpots,
  selectedSpot,
  userLocation,
  onSelectSpot,
  onOpenDetail,
  onFocusRoute,
  onFocusAllCity,
  getImageSource,
  getSpotIntro,
  getSpotOpenHours,
  getSpotRating,
}: Props) {
  const frameId = useMemo(
    () => `hongkong-map-${Math.random().toString(36).slice(2)}`,
    []
  );
  const [tilesReady, setTilesReady] = useState(false);
  const selectedSpotId = selectedSpot?.id ?? null;
  const selectedKind = useMemo(() => {
    if (!selectedSpotId) return "当前景点";
    if (routeSpots.some((spot) => spot.id === selectedSpotId)) return "当前路线";
    if (extraSpots.some((spot) => spot.id === selectedSpotId)) return "顺路景点";
    if (citySpots.some((spot) => spot.id === selectedSpotId)) return "全港景点";
    return "当前景点";
  }, [citySpots, extraSpots, routeSpots, selectedSpotId]);

  const html = useMemo(
    () =>
      buildSharedMapDocument({
        frameId,
        routeCoords,
        mapMode,
        routeSpots,
        extraSpots,
        citySpots,
        userLocation,
      }),
    [citySpots, extraSpots, frameId, mapMode, routeCoords, routeSpots, userLocation]
  );

  useEffect(() => {
    setTilesReady(false);
  }, [html]);

  return (
    <View style={styles.wrap}>
      <View style={styles.mapCanvas}>
        <SharedMapFrame
          html={html}
          frameId={frameId}
          selectedSpotId={selectedSpotId}
          userLocation={userLocation}
          onSelectSpot={onSelectSpot}
          onTilesReady={() => setTilesReady(true)}
        />

        {!tilesReady && (
          <View style={styles.loadingMask}>
            <Text style={styles.loadingTitle}>地图加载中</Text>
            <Text style={styles.loadingText}>
              正在同步同一套地图视图，第一次进入会稍慢一点。
            </Text>
          </View>
        )}

        <View style={styles.topOverlay}>
          <View style={styles.legendCard}>
            <LinearGradient
              colors={["rgba(126, 220, 208, 0.22)", "rgba(122, 182, 255, 0.06)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.legendGlow}
            />
            <Text style={styles.legendKicker}>{mapKicker}</Text>
            <Text style={styles.legendTitle}>{mapTitle}</Text>
          </View>
        </View>

        <View style={[styles.bottomOverlay, { bottom: 14 + bottomInset }]}>
          <View style={styles.dockCard}>
            <LinearGradient
              colors={["rgba(126, 220, 208, 0.28)", "rgba(255, 183, 107, 0.16)", "rgba(122, 182, 255, 0.06)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.dockGlow}
            />
            <Pressable
              style={styles.dockMain}
              onPress={() => selectedSpot?.id && onOpenDetail(selectedSpot.id)}
            >
              <Image
                source={getImageSource(selectedSpot?.id)}
                style={styles.dockImage}
              />
              <View style={styles.dockBody}>
                <View style={styles.badgeRow}>
                  <View style={styles.kindBadge}>
                    <Text style={styles.kindBadgeText}>{selectedKind}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingLabel}>导览</Text>
                    <Text style={styles.ratingValue}>
                      {getSpotRating(selectedSpot?.id).toFixed(1)}★
                    </Text>
                  </View>
                </View>
                <View style={styles.titleRow}>
                  <Text numberOfLines={1} style={styles.dockTitle}>
                    {selectedSpot?.name || "香港"}
                  </Text>
                </View>
                <Text numberOfLines={2} style={styles.dockText}>
                  {getSpotIntro(selectedSpot) || "点地图上的标记查看景点。"}
                </Text>
                <View style={styles.infoRow}>
                  <View style={styles.hoursChip}>
                    <Text numberOfLines={1} style={styles.hoursChipText}>
                      开放参考：{getSpotOpenHours(selectedSpot?.id)}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>

            <View style={styles.actionRow}>
              <ChipButton
                label="路线"
                onPress={onFocusRoute}
                active={mapMode === "route"}
              />
              <ChipButton
                label="全域"
                onPress={onFocusAllCity}
                active={mapMode === "all"}
              />
              <ChipButton
                label="详情"
                onPress={() => selectedSpot?.id && onOpenDetail(selectedSpot.id)}
                primary
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function ChipButton({
  label,
  active,
  primary,
  onPress,
}: {
  label: string;
  active?: boolean;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[
        styles.chipButton,
        active && styles.chipButtonActive,
        primary && styles.chipButtonPrimary,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipButtonText,
          active && styles.chipButtonTextActive,
          primary && styles.chipButtonTextPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 0,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#08111d",
  },
  mapCanvas: {
    flex: 1,
    minHeight: 0,
    position: "relative",
  },
  loadingMask: {
    position: "absolute",
    inset: 0 as any,
    backgroundColor: "rgba(9,21,36,0.82)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    pointerEvents: "none" as any,
  },
  loadingTitle: {
    color: "#f4f7fb",
    fontSize: 18,
    fontWeight: "700",
  },
  loadingText: {
    color: "#a9bfd7",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 260,
  },
  topOverlay: {
    position: "absolute",
    top: 12,
    left: 14,
    right: 14,
    zIndex: 20,
    pointerEvents: "box-none" as any,
  },
  legendCard: {
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    backgroundColor: "rgba(7, 18, 31, 0.52)",
  },
  legendGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  legendKicker: {
    color: "#f9dc7b",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  legendTitle: {
    color: "#f4f7fb",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 2,
  },
  bottomOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    zIndex: 20,
    pointerEvents: "box-none" as any,
  },
  dockCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    backgroundColor: "rgba(7, 18, 31, 0.58)",
  },
  dockGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  dockMain: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 8,
    alignItems: "flex-start",
  },
  dockImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  dockBody: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  kindBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(126, 220, 208, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(126, 220, 208, 0.24)",
  },
  kindBadgeText: {
    color: "#7edcd0",
    fontSize: 10,
    fontWeight: "700",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  ratingLabel: {
    color: "#a9bfd7",
    fontSize: 10,
    fontWeight: "600",
  },
  ratingValue: {
    color: "#f9dc7b",
    fontSize: 12,
    fontWeight: "800",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dockTitle: {
    color: "#f4f7fb",
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  dockText: {
    color: "#a9bfd7",
    fontSize: 12,
    lineHeight: 17,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  hoursChip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "rgba(126, 220, 208, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(126, 220, 208, 0.18)",
    maxWidth: "100%",
  },
  hoursChipText: {
    color: "#7edcd0",
    fontSize: 11,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  chipButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  chipButtonActive: {
    backgroundColor: "rgba(126, 220, 208, 0.12)",
    borderColor: "rgba(126, 220, 208, 0.32)",
  },
  chipButtonPrimary: {
    backgroundColor: "rgba(255, 183, 107, 0.16)",
    borderColor: "rgba(255, 183, 107, 0.32)",
  },
  chipButtonText: {
    color: "#f4f7fb",
    fontSize: 12,
    fontWeight: "700",
  },
  chipButtonTextActive: {
    color: "#7edcd0",
  },
  chipButtonTextPrimary: {
    color: "#ffcf88",
  },
});
