import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useMemo, useState } from "react";
import Geolocation, {
  type GeoError,
  type GeoOptions,
  type GeoPosition,
  PositionError,
} from "react-native-geolocation-service";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import MapSurface from "./src/components/MapSurface";
import { getCitywalkImage } from "./src/lib/citywalkImages";
import {
  allRegionalSpots,
  allSpots,
  cityRecommendations,
  galleryItems,
  getDistanceFromOldCity,
  getSpotBody,
  getSpotById,
  getSpotDuration,
  getSpotImageKey,
  getSpotIntro,
  getSpotOpenHours,
  getSpotRating,
  getSpotTags,
  inferSpotCategory,
  lonelyPlanetHighlights,
  oldCityCenter,
  openingHoursMethodNote,
  places,
  ratingMethodNote,
  recommendedRoute,
  regionalSpotCollections,
  routeStops,
  searchSpots,
  sourceLinks,
} from "./src/lib/quanzhou";

const routeCoords = routeStops.map((spot: any) => spot.coords as [number, number]);
const extraOldCitySpots = Object.values(places).filter(
  (spot: any) => !recommendedRoute.stops.includes(spot.id)
);
const cityOnlySpots = allRegionalSpots.filter((spot: any) => !places[spot.id]);

const palette = {
  bg: "#091524",
  bgSoft: "#10233b",
  panel: "rgba(12, 27, 44, 0.8)",
  panelSoft: "rgba(255, 255, 255, 0.08)",
  border: "rgba(255, 255, 255, 0.14)",
  text: "#f4f7fb",
  subText: "#a9bfd7",
  warm: "#ffb76b",
  coral: "#ff8d72",
  mint: "#7edcd0",
  sky: "#7ab6ff",
  gold: "#f9dc7b",
  green: "#7dd7a9",
  route: "#ff9d6c",
};

const uiCopy = {
  appSubtitle: "古城主线与全域景点",
  routeChip: "古城主线",
  routeMapTitle: "古城主线",
  routeMapKicker: "古城步行",
  allCityTitle: "泉州全域景点",
  allCityKicker: "全域分布",
  routeLogicTitle: "这条主线怎么走",
  routeLogicNote: "把寺观、街巷和城南海港串成一条顺路的步行线。",
  mapHintRoute: "地图会同时显示主线、古城顺路景点和外围延伸景点。",
  mapHintFocus: "地图已切到当前景点或专题。",
  searchEmpty: "没有找到相关景点，可试试“寺”“桥”“海”“古城”。",
  extendTitle: "古城之外还可以去哪",
  extendNote: "先看主题推荐，再看行程建议，最后按区域筛选景点。",
  extendIndex: "区域索引",
  extendLp: "主题推荐",
  extendGuide: "行程建议",
  extendMapAction: "在地图查看",
  guideKicker: "图册与信息",
  guideTitle: "图册、时间与出发信息",
  guideNote: "适合出发前快速浏览。",
};

const glyphMap: Record<string, string> = {
  "walk-outline": "⇢",
  "time-outline": "◷",
  "map-outline": "⌖",
  "compass-outline": "◎",
  "locate-outline": "⌾",
  "expand-outline": "▣",
  "search-outline": "⌕",
  "trail-sign-outline": "↗",
  "apps-outline": "▦",
  "reader-outline": "≣",
  "document-text-outline": "☰",
  "location-outline": "⌾",
  "navigate-outline": "➤",
  "close-outline": "×",
  "albums-outline": "▤",
  "book-outline": "☷",
  "sunny-outline": "◐",
};

type TabKey = "route" | "map" | "extend" | "guide";
type ExtendView = "index" | "lp" | "guide";

function getNativePosition(options: GeoOptions) {
  return new Promise<GeoPosition>((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function toLatLng(position: GeoPosition): [number, number] {
  return [position.coords.latitude, position.coords.longitude];
}

function App() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.max(screenWidth - 32, 280);
  const regionCardWidth = Math.max(Math.floor((contentWidth - 12) / 2), 132);
  const galleryCardWidth = contentWidth;
  const tabBarBottom = Math.max(14, insets.bottom + 8);
  const tabBarHeight = 74;
  const tabBarReservedSpace = tabBarBottom + tabBarHeight + 12;
  const [currentTab, setCurrentTab] = useState<TabKey>("route");
  const [extendView, setExtendView] = useState<ExtendView>("index");
  const [selectedSpotId, setSelectedSpotId] = useState<string>(
    recommendedRoute.stops[0]
  );
  const [detailSpotId, setDetailSpotId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"route" | "focus" | "all">("route");
  const [focusedSpotIds, setFocusedSpotIds] = useState<string[]>(
    recommendedRoute.stops
  );
  const [mapTitle, setMapTitle] = useState<string>(uiCopy.routeMapTitle);
  const [mapKicker, setMapKicker] = useState<string>(uiCopy.routeMapKicker);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegionId, setSelectedRegionId] = useState<string>(
    regionalSpotCollections[0].id
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [expandedSpotId, setExpandedSpotId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const selectedSpot = getSpotById(selectedSpotId);
  const selectedRegion = useMemo(
    () =>
      regionalSpotCollections.find((section: any) => section.id === selectedRegionId) ||
      regionalSpotCollections[0],
    [selectedRegionId]
  );

  const regionCategories = useMemo(() => {
    const counts = selectedRegion.spots.reduce((acc: Record<string, number>, spot: any) => {
      const category = inferSpotCategory(spot);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    return [
      { label: "全部", count: selectedRegion.spots.length },
      ...Object.entries(counts).map(([label, count]) => ({ label, count })),
    ];
  }, [selectedRegion]);

  const filteredRegionSpots = useMemo(() => {
    if (selectedCategory === "全部") return selectedRegion.spots;
    return selectedRegion.spots.filter(
      (spot: any) => inferSpotCategory(spot) === selectedCategory
    );
  }, [selectedCategory, selectedRegion]);

  const searchResults = useMemo(
    () => searchSpots(searchQuery),
    [searchQuery]
  );

  const mapVisibleSpots = useMemo(() => {
    if (mapMode === "route") {
      return {
        route: routeStops,
        extras: extraOldCitySpots,
        city: cityOnlySpots,
      };
    }

    if (mapMode === "all") {
      return {
        route: routeStops,
        extras: extraOldCitySpots,
        city: cityOnlySpots,
      };
    }

    const focused = focusedSpotIds
      .map((spotId) => getSpotById(spotId))
      .filter(Boolean);

    return {
      route: focused.filter((spot: any) => recommendedRoute.stops.includes(spot.id)),
      extras: focused.filter(
        (spot: any) =>
          !recommendedRoute.stops.includes(spot.id) && places[spot.id]
      ),
      city: focused.filter((spot: any) => !places[spot.id]),
    };
  }, [focusedSpotIds, mapMode]);

  function focusRoute() {
    setCurrentTab("map");
    setMapMode("route");
    setFocusedSpotIds(recommendedRoute.stops);
    setSelectedSpotId(recommendedRoute.stops[0]);
    setMapTitle(uiCopy.routeMapTitle);
    setMapKicker(uiCopy.routeMapKicker);
  }

  function focusAllCity() {
    setCurrentTab("map");
    setMapMode("all");
    setFocusedSpotIds(allSpots.map((spot: any) => spot.id));
    setSelectedSpotId(recommendedRoute.stops[0]);
    setMapTitle(uiCopy.allCityTitle);
    setMapKicker(uiCopy.allCityKicker);
  }

  function focusSpot(spotId: string, options?: { tab?: TabKey; kicker?: string }) {
    const spot = getSpotById(spotId);
    if (!spot?.coords) return;

    setCurrentTab(options?.tab || "map");
    setMapMode("focus");
    setFocusedSpotIds([spotId]);
    setSelectedSpotId(spotId);
    setMapTitle(spot.name);
    setMapKicker(options?.kicker || inferSpotCategory(spot));
  }

  function focusCollection(spotIds: string[], title: string, kicker: string) {
    const hasCoords = spotIds.some((spotId) => Array.isArray(getSpotById(spotId)?.coords));
    if (!hasCoords) return;

    setCurrentTab("map");
    setMapMode("focus");
    setFocusedSpotIds(spotIds);
    setSelectedSpotId(spotIds[0]);
    setMapTitle(title);
    setMapKicker(kicker);
  }

  async function locateUser() {
    async function withTimeout<T>(
      promise: Promise<T>,
      ms: number,
      code: string
    ): Promise<T> {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error(code)), ms);
        }),
      ]);
    }

    setCurrentTab("map");
    setMapMode("all");
    setFocusedSpotIds(allSpots.map((spot: any) => spot.id));
    setMapKicker("正在定位");
    setMapTitle("正在获取位置…");
    setIsLocating(true);
    let fallbackCoords: [number, number] | null = null;
    let fallbackProvider = "";

    try {
      console.log("[locate] start");
      const servicesEnabled = await withTimeout(
        Location.hasServicesEnabledAsync(),
        3000,
        "SERVICES_TIMEOUT"
      );
      console.log("[locate] servicesEnabled", servicesEnabled);
      if (!servicesEnabled) {
        if (typeof Location.enableNetworkProviderAsync === "function") {
          try {
            console.log("[locate] requesting network provider");
            await withTimeout(
              Location.enableNetworkProviderAsync(),
              6000,
              "PROVIDER_TIMEOUT"
            );
          } catch {
            Alert.alert("定位服务未开启", "请先在系统里打开定位服务，再点一次定位。");
            return;
          }
        } else {
          Alert.alert("定位服务未开启", "请先在系统里打开定位服务，再点一次定位。");
          return;
        }
      }

      setMapKicker("检查权限");
      let permission = await withTimeout(
        Location.getForegroundPermissionsAsync(),
        3000,
        "PERMISSION_CHECK_TIMEOUT"
      );
      console.log("[locate] foreground permission", permission.status);
      if (permission.status !== "granted") {
        setMapKicker("请求定位权限");
        permission = await withTimeout(
          Location.requestForegroundPermissionsAsync(),
          12000,
          "PERMISSION_REQUEST_TIMEOUT"
        );
        console.log("[locate] requested permission", permission.status);
      }

      if (permission.status !== "granted") {
        setMapKicker("定位不可用");
        setMapTitle("未获得定位权限");
        Alert.alert("定位权限未开启", "请在系统权限里允许定位后再试。");
        return;
      }

      setMapKicker("读取最近位置");
      try {
        const lastKnown = await getNativePosition({
          accuracy: { android: "balanced", ios: "hundredMeters" },
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 1000 * 60 * 30,
          showLocationDialog: false,
          forceRequestLocation: true,
          forceLocationManager: true,
        });
        fallbackCoords = toLatLng(lastKnown);
        fallbackProvider = lastKnown.provider || "cached";
        console.log("[locate] lastKnown ok", fallbackProvider, lastKnown.coords.accuracy);

        if (fallbackCoords) {
          setUserLocation(fallbackCoords);
          setMapKicker("最近位置");
          setMapTitle("你的位置");
        }
      } catch (error: unknown) {
        const geoError = error as GeoError;
        console.log(
          "[locate] lastKnown error",
          geoError?.code ?? "unknown",
          geoError?.message ?? error
        );
      }

      setMapKicker("获取实时位置");
      const position = await getNativePosition({
        accuracy: { android: "high", ios: "best" },
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        distanceFilter: 0,
        showLocationDialog: true,
        forceRequestLocation: true,
        forceLocationManager: true,
      });
      console.log(
        "[locate] current position ok",
        position.provider || "live",
        position.coords.accuracy
      );

      const coords = toLatLng(position);
      setUserLocation(coords);
      setMapKicker("实时定位");
      setMapTitle("你的位置");
    } catch (error: unknown) {
      const geoError = error as GeoError;
      console.log(
        "[locate] error",
        geoError?.code ?? "unknown",
        geoError?.message ?? error
      );
      if (error instanceof Error && error.message === "SERVICES_TIMEOUT") {
        setMapKicker("定位检查超时");
        setMapTitle("暂时无法获取位置");
        Alert.alert("定位检查超时", "系统定位状态检查超时了，请再试一次。");
        return;
      }

      if (error instanceof Error && error.message === "PERMISSION_CHECK_TIMEOUT") {
        setMapKicker("权限检查超时");
        setMapTitle("暂时无法获取位置");
        Alert.alert("权限检查超时", "这次没有及时拿到定位权限状态，请再试一次。");
        return;
      }

      if (error instanceof Error && error.message === "PERMISSION_REQUEST_TIMEOUT") {
        setMapKicker("等待授权超时");
        setMapTitle("暂时无法获取位置");
        Alert.alert("授权超时", "没有等到系统定位授权结果，请确认权限弹窗是否被遮挡。");
        return;
      }

      if (
        geoError?.code === PositionError.TIMEOUT ||
        (error instanceof Error && error.message === "LOCATION_TIMEOUT")
      ) {
        if (fallbackCoords) {
          setUserLocation(fallbackCoords);
          setMapKicker(fallbackProvider ? `最近位置 · ${fallbackProvider}` : "最近位置");
          setMapTitle("你的位置");
          Alert.alert(
            "实时定位超时",
            "先为你显示最近一次已知位置。到开阔区域后再点一次，通常会更快拿到实时位置。"
          );
          return;
        }

        setMapKicker("定位超时");
        setMapTitle("暂时无法获取位置");
        Alert.alert(
          "定位超时",
          "这次没有及时拿到当前位置。请确认系统定位已开启，或到更开阔的位置后再试。"
        );
        return;
      }

      if (geoError?.code === PositionError.SETTINGS_NOT_SATISFIED) {
        setMapKicker("定位模式不足");
        setMapTitle("暂时无法获取位置");
        Alert.alert("定位模式不足", "请把系统定位模式调到高精度后再试一次。");
        return;
      }

      if (geoError?.code === PositionError.POSITION_UNAVAILABLE) {
        if (fallbackCoords) {
          setUserLocation(fallbackCoords);
          setMapKicker(fallbackProvider ? `最近位置 · ${fallbackProvider}` : "最近位置");
          setMapTitle("你的位置");
          Alert.alert(
            "实时定位暂不可用",
            "先为你显示最近一次已知位置。等网络或卫星信号稳定后，再点一次通常就能拿到实时位置。"
          );
          return;
        }

        setMapKicker("定位源不可用");
        setMapTitle("暂时无法获取位置");
        Alert.alert("定位源不可用", "系统暂时没有返回可用位置，请稍后再试。");
        return;
      }

      setMapKicker("定位失败");
      setMapTitle("暂时无法获取位置");
      Alert.alert(
        "定位失败",
        "这次没有成功拿到当前位置。请确认手机系统定位已开启，再重试一次。"
      );
    } finally {
      setIsLocating(false);
    }
  }

  function renderRouteTab() {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["rgba(122, 182, 255, 0.28)", "rgba(255, 141, 114, 0.1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Image
            source={getCitywalkImage("kaiyuan.jpg")}
            style={styles.heroImage}
          />
          <View style={styles.heroShade} />
          <View style={styles.heroContent}>
            <View style={styles.heroEyebrowRow}>
              <GlassPill icon="walk-outline" label={uiCopy.routeChip} />
              <GlassPill
                icon="time-outline"
                label={recommendedRoute.note || "半天到一天"}
              />
            </View>
            <Text style={styles.heroTitle}>{recommendedRoute.headline}</Text>
            <Text style={styles.heroText}>{recommendedRoute.lead}</Text>
            <View style={styles.heroStatsRow}>
              <StatChip label="站点" value={`${recommendedRoute.stops.length} 站`} />
              <StatChip label="方式" value="步行为主" />
              <StatChip label="适合" value="首访泉州" />
            </View>
            <View style={styles.heroActionRow}>
              <ActionButton
                icon="map-outline"
                label="直接看地图"
                onPress={focusRoute}
                primary
              />
              <ActionButton
                icon="compass-outline"
                label="查看全域景点"
                onPress={focusAllCity}
              />
            </View>
          </View>
        </LinearGradient>

        <SectionTitle
          kicker="主线逻辑"
          title={uiCopy.routeLogicTitle}
          note={uiCopy.routeLogicNote}
        />

        <View style={styles.cardGrid}>
          {recommendedRoute.panels.map((panel: any) => (
            <GlassCard key={panel.title} style={styles.logicCard}>
              <Text style={styles.logicTitle}>{panel.title}</Text>
              <Text style={styles.cardText}>{panel.body}</Text>
            </GlassCard>
          ))}
        </View>

        <SectionTitle
          kicker="步行顺序"
          title="一站一站往下走"
          note="列表里直接带评级、开放参考和地图入口。"
        />

        <View style={styles.stopsWrap}>
          {routeStops.map((spot: any, index: number) => (
            <Pressable
              key={spot.id}
              style={styles.stopCard}
              onPress={() => setDetailSpotId(spot.id)}
            >
              <View style={styles.stopIndex}>
                <Text style={styles.stopIndexText}>{String(index + 1).padStart(2, "0")}</Text>
              </View>
              <View style={styles.stopBody}>
                <View style={styles.rowBetween}>
                  <Text style={styles.stopTitle}>{spot.name}</Text>
                  <RatingBadge score={getSpotRating(spot.id)} compact />
                </View>
                <Text style={styles.stopSubtitle}>{spot.subtitle}</Text>
                <View style={styles.metaRow}>
                  <MetaPill icon="time-outline" text={getSpotDuration(spot) || "现场调整"} />
                  <MetaPill icon="sunny-outline" text={getSpotOpenHours(spot.id)} />
                </View>
                <View style={styles.stopActionRow}>
                  <MiniButton
                    icon="document-text-outline"
                    label="看详情"
                    onPress={() => setDetailSpotId(spot.id)}
                  />
                  <MiniButton
                    icon="location-outline"
                    label="地图定位"
                    onPress={() => focusSpot(spot.id)}
                  />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  function renderMapTab() {
    return (
      <View
          style={[styles.mapTabShell, { paddingBottom: 18 }]}
        >
        <View style={styles.mapHeader}>
          <View style={styles.mapHeaderCopy}>
            <Text style={styles.sectionEyebrow}>地图与搜索</Text>
            <Text style={styles.mapHeaderTitle}>{mapTitle}</Text>
            <Text style={styles.sectionHint}>
              {mapMode === "route"
                ? uiCopy.mapHintRoute
                : uiCopy.mapHintFocus}
            </Text>
          </View>
          <View style={styles.mapHeaderActions}>
            <SmallIconButton
              icon="locate-outline"
              onPress={() => {
                if (!isLocating) {
                  void locateUser();
                }
              }}
            />
            <SmallIconButton icon="expand-outline" onPress={focusAllCity} />
          </View>
        </View>

        <GlassCard style={styles.searchPanel}>
          <View style={styles.searchInputWrap}>
            <Glyph name="search-outline" size={18} color={palette.subText} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="搜索景点、寺观、桥梁、街区或片区"
              placeholderTextColor={palette.subText}
              style={styles.searchInput}
            />
          </View>
          {!!searchQuery && (
            <ScrollView
              style={styles.searchResults}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              {searchResults.length ? (
                searchResults.map((spot: any) => (
                  <Pressable
                    key={spot.id}
                    style={styles.searchResultCard}
                    onPress={() => {
                      setSearchQuery("");
                      focusSpot(spot.id);
                    }}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={styles.searchResultTitle}>{spot.name}</Text>
                      <RatingBadge score={getSpotRating(spot.id)} compact />
                    </View>
                    <Text style={styles.searchResultType}>
                      {spot.type} · {spot.area || spot.theme || inferSpotCategory(spot)}
                    </Text>
                    <Text style={styles.searchResultHours}>
                      开放参考：{getSpotOpenHours(spot.id)}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.emptyText}>{uiCopy.searchEmpty}</Text>
              )}
            </ScrollView>
          )}
        </GlassCard>

        <MapSurface
          routeCoords={routeCoords}
          mapMode={mapMode}
          mapTitle={mapTitle}
          mapKicker={mapKicker}
          bottomInset={8}
          routeSpots={mapVisibleSpots.route}
          extraSpots={mapVisibleSpots.extras}
          citySpots={mapVisibleSpots.city}
          selectedSpot={selectedSpot}
          userLocation={userLocation}
          onSelectSpot={(spotId: string) => setSelectedSpotId(spotId)}
          onOpenDetail={(spotId: string) => setDetailSpotId(spotId)}
          onFocusRoute={focusRoute}
          onFocusAllCity={focusAllCity}
          getImageSource={(spotId?: string | null) =>
            getCitywalkImage(getSpotImageKey(spotId))
          }
          getSpotIntro={(spot: any) => getSpotIntro(spot)}
          getSpotOpenHours={(spotId?: string | null) => getSpotOpenHours(spotId)}
          getSpotRating={(spotId?: string | null) => getSpotRating(spotId)}
        />
      </View>
    );
  }

  function renderExtendTab() {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle
          kicker="泉州延伸"
          title={uiCopy.extendTitle}
          note={uiCopy.extendNote}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentRow}
        >
          {[
            { key: "index", label: uiCopy.extendIndex },
            { key: "lp", label: uiCopy.extendLp },
            { key: "guide", label: uiCopy.extendGuide },
          ].map((item) => (
            <Pressable
              key={item.key}
              style={[
                styles.segmentChip,
                extendView === item.key && styles.segmentChipActive,
              ]}
              onPress={() => setExtendView(item.key as ExtendView)}
            >
              <Text
                style={[
                  styles.segmentChipText,
                  extendView === item.key && styles.segmentChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {extendView === "lp" && (
          <View style={styles.stackGap}>
            {lonelyPlanetHighlights.map((item: any) => (
              <GlassCard key={item.title} style={styles.featureCard}>
                <Image
                  source={getCitywalkImage(item.image)}
                  style={styles.featureImage}
                />
                <View style={styles.featureBody}>
                  <Text style={styles.featureSource}>{item.source}</Text>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.cardText}>{item.text}</Text>
                  <TagRow tags={item.chips} />
                  <ActionButton
                    icon="map-outline"
                    label={uiCopy.extendMapAction}
                    onPress={() =>
                      focusCollection(item.spotIds, item.title, uiCopy.extendLp)
                    }
                    primary
                  />
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {extendView === "guide" && (
          <View style={styles.stackGap}>
            {cityRecommendations.map((item: any) => (
              <GlassCard key={item.title} style={styles.featureCard}>
                <Image
                  source={getCitywalkImage(item.image)}
                  style={styles.featureImage}
                />
                <View style={styles.featureBody}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.featureTitle}>{item.title}</Text>
                    <Text style={styles.featureSource}>{item.area}</Text>
                  </View>
                  <Text style={styles.cardText}>{item.text}</Text>
                  <View style={styles.scheduleBox}>
                    {item.schedule.map((line: string) => (
                      <Text key={line} style={styles.scheduleLine}>
                        • {line}
                      </Text>
                    ))}
                  </View>
                  <ActionButton
                    icon="map-outline"
                    label={uiCopy.extendMapAction}
                    onPress={() => focusCollection(item.spotIds, item.title, uiCopy.extendGuide)}
                    primary
                  />
                </View>
              </GlassCard>
            ))}
          </View>
        )}

        {extendView === "index" && (
          <View style={styles.stackGap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToAlignment="start"
              snapToInterval={regionCardWidth + 12}
              contentContainerStyle={styles.regionRow}
            >
              {regionalSpotCollections.map((section: any) => (
                <Pressable
                  key={section.id}
                  style={[
                    styles.regionChip,
                    { width: regionCardWidth },
                    selectedRegionId === section.id && styles.regionChipActive,
                  ]}
                  onPress={() => {
                    setSelectedRegionId(section.id);
                    setSelectedCategory("全部");
                    setExpandedSpotId(null);
                  }}
                >
                  <Text
                    style={[
                      styles.regionChipTitle,
                      selectedRegionId === section.id && styles.regionChipTitleActive,
                    ]}
                  >
                    {section.title}
                  </Text>
                  <Text style={styles.regionChipMeta}>{section.meta}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <GlassCard>
              <Text style={styles.featureTitle}>{selectedRegion.title}</Text>
              <Text style={styles.cardText}>{selectedRegion.intro}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {regionCategories.map((item) => (
                  <Pressable
                    key={item.label}
                    style={[
                      styles.filterChip,
                      selectedCategory === item.label && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedCategory(item.label)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategory === item.label &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {item.label} {item.count}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </GlassCard>

            {filteredRegionSpots.map((spot: any) => {
              const expanded = expandedSpotId === spot.id;
              return (
                <GlassCard key={spot.id} style={styles.indexCard}>
                  <Pressable
                    style={styles.indexHead}
                    onPress={() =>
                      setExpandedSpotId(expanded ? null : spot.id)
                    }
                  >
                    <View style={styles.indexHeadMain}>
                      <Text style={styles.indexTitle}>{spot.name}</Text>
                      <Text style={styles.indexMeta}>
                        {inferSpotCategory(spot)} · {getDistanceFromOldCity(spot.coords)}
                      </Text>
                    </View>
                    <View style={styles.indexRight}>
                      <RatingBadge score={getSpotRating(spot.id)} compact />
                      <Pressable
                        hitSlop={8}
                        onPress={() => focusSpot(spot.id)}
                        style={styles.mapIconButton}
                      >
                        <Glyph name="navigate-outline" size={18} color={palette.text} />
                      </Pressable>
                    </View>
                  </Pressable>

                  {expanded && (
                    <View style={styles.expandedBody}>
                      <Image
                        source={getCitywalkImage(getSpotImageKey(spot.id))}
                        style={styles.expandedImage}
                      />
                      <Text style={styles.cardText}>{spot.text}</Text>
                      <View style={styles.metaColumn}>
                        <Text style={styles.metaLine}>类型：{inferSpotCategory(spot)}</Text>
                        <Text style={styles.metaLine}>
                          开放参考：{getSpotOpenHours(spot.id)}
                        </Text>
                        <Text style={styles.metaLine}>
                          距古城中心：{getDistanceFromOldCity(spot.coords)}
                        </Text>
                        <Text style={styles.metaLine}>
                          到达建议：{spot.travel || "建议结合当天路线安排"}
                        </Text>
                      </View>
                      <View style={styles.stopActionRow}>
                        <MiniButton
                          icon="location-outline"
                          label="定位到地图"
                          onPress={() => focusSpot(spot.id)}
                        />
                        <MiniButton
                          icon="document-text-outline"
                          label="看详情"
                          onPress={() => setDetailSpotId(spot.id)}
                        />
                      </View>
                    </View>
                  )}
                </GlassCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  }

  function renderGuideTab() {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <SectionTitle
          kicker={uiCopy.guideKicker}
          title={uiCopy.guideTitle}
          note={uiCopy.guideNote}
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={galleryCardWidth + 12}
          contentContainerStyle={styles.galleryRow}
        >
          {galleryItems.map((item: any) => (
            <Pressable
              key={item.title}
              style={[styles.galleryCard, { width: galleryCardWidth }]}
              onPress={() => {
                if (item.spotId) focusSpot(item.spotId, { kicker: "图册定位" });
                if (item.spotIds) focusCollection(item.spotIds, item.title, "图册定位");
              }}
            >
              <Image
                source={getCitywalkImage(item.image)}
                style={styles.galleryImage}
              />
              <LinearGradient
                colors={["transparent", "rgba(9,21,36,0.92)"]}
                style={styles.galleryShade}
              />
              <View style={styles.galleryContent}>
                <Text style={styles.galleryKicker}>{item.kicker}</Text>
                <Text style={styles.galleryTitle}>{item.title}</Text>
                <Text numberOfLines={2} style={styles.galleryNote}>
                  {item.note}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <GlassCard>
          <Text style={styles.featureTitle}>路线故事线</Text>
          <View style={styles.storyList}>
            {recommendedRoute.chapters.map((chapter: any) => (
              <View key={chapter.step} style={styles.storyItem}>
                <View style={styles.storyBadge}>
                  <Text style={styles.storyBadgeText}>{chapter.step}</Text>
                </View>
                <View style={styles.storyBody}>
                  <Text style={styles.storyTitle}>{chapter.title}</Text>
                  <Text style={styles.cardText}>{chapter.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.featureTitle}>时间分配</Text>
          <View style={styles.stackGap}>
            {recommendedRoute.schedule.map((item: any) => (
              <View key={item.phase} style={styles.scheduleCard}>
                <Text style={styles.schedulePhase}>{item.phase}</Text>
                <Text style={styles.scheduleTitle}>{item.title}</Text>
                <Text style={styles.cardText}>{item.body}</Text>
              </View>
            ))}
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.featureTitle}>出发前先看这几条</Text>
          <View style={styles.stackGap}>
            {recommendedRoute.prep.map((item: string) => (
              <Text key={item} style={styles.listLine}>
                • {item}
              </Text>
            ))}
          </View>
        </GlassCard>

        <GlassCard>
          <Text style={styles.featureTitle}>评级与开放时间说明</Text>
          <Text style={styles.cardText}>{ratingMethodNote}</Text>
          <Text style={[styles.cardText, styles.textTopGap]}>
            {openingHoursMethodNote}
          </Text>
        </GlassCard>

        <GlassCard>
          <Text style={styles.featureTitle}>资料来源</Text>
          <View style={styles.stackGap}>
            {sourceLinks.slice(0, 12).map((item: any) => (
              <View key={item.url} style={styles.sourceItem}>
                <Text style={styles.sourceTitle}>{item.label}</Text>
                <Text style={styles.sourceNote}>{item.note}</Text>
                <Text style={styles.sourceUrl}>{item.url}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#163356", "#0b1829", "#091524"]}
        style={styles.root}
      >
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.appTitle}>泉州古城导览</Text>
            <Text style={styles.appSubtitle}>{uiCopy.appSubtitle}</Text>
          </View>
        </View>

        <View style={[styles.contentArea, { paddingBottom: tabBarReservedSpace }]}>
          {currentTab === "route" && renderRouteTab()}
          {currentTab === "map" && renderMapTab()}
          {currentTab === "extend" && renderExtendTab()}
          {currentTab === "guide" && renderGuideTab()}
        </View>

        <View
          style={[
            styles.tabBar,
            { bottom: tabBarBottom },
          ]}
        >
          <TabButton
            icon="walk-outline"
            label="主线"
            active={currentTab === "route"}
            onPress={() => setCurrentTab("route")}
          />
          <TabButton
            icon="map-outline"
            label="地图"
            active={currentTab === "map"}
            onPress={() => setCurrentTab("map")}
          />
          <TabButton
            icon="albums-outline"
            label="延伸"
            active={currentTab === "extend"}
            onPress={() => setCurrentTab("extend")}
          />
          <TabButton
            icon="book-outline"
            label="指南"
            active={currentTab === "guide"}
            onPress={() => setCurrentTab("guide")}
          />
        </View>

        <SpotDetailModal
          spotId={detailSpotId}
          onClose={() => setDetailSpotId(null)}
          onLocate={(spotId) => focusSpot(spotId)}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

function AppWithProviders() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

export { AppWithProviders as default };

function SpotDetailModal({
  spotId,
  onClose,
  onLocate,
}: {
  spotId: string | null;
  onClose: () => void;
  onLocate: (spotId: string) => void;
}) {
  const spot = getSpotById(spotId);

  if (!spot) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalSheet}>
          <Image
            source={getCitywalkImage(getSpotImageKey(spot.id))}
            style={styles.modalImage}
          />
          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{spot.name}</Text>
                <Text style={styles.modalSubtitle}>
                  {spot.area || spot.theme || spot.source || inferSpotCategory(spot)}
                </Text>
              </View>
              <RatingBadge score={getSpotRating(spot.id)} />
            </View>

            <View style={styles.metaRow}>
              <MetaPill icon="sunny-outline" text={getSpotOpenHours(spot.id)} />
              {!!spot.coords && (
                <MetaPill
                  icon="navigate-outline"
                  text={`距古城 ${getDistanceFromOldCity(spot.coords)}`}
                />
              )}
            </View>

            <Text style={styles.modalBody}>{getSpotBody(spot)}</Text>

            {Array.isArray(spot.highlights) && !!spot.highlights.length && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>现场重点</Text>
                {spot.highlights.map((item: any) => (
                  <View key={item.label} style={styles.detailLine}>
                    <Text style={styles.detailLineLabel}>{item.label}</Text>
                    <Text style={styles.detailLineValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {Array.isArray(spot.tips) && !!spot.tips.length && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>小贴士</Text>
                {spot.tips.map((item: string) => (
                  <Text key={item} style={styles.listLine}>
                    • {item}
                  </Text>
                ))}
              </View>
            )}

            {!spot.highlights?.length && (
              <View style={styles.detailBlock}>
                <Text style={styles.detailBlockTitle}>值得留意</Text>
                {getSpotTags(spot).map((tag: string) => (
                  <Text key={tag} style={styles.listLine}>
                    • {tag}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.modalActionRow}>
              <ActionButton
                icon="location-outline"
                label="定位到地图"
                onPress={() => {
                  onClose();
                  onLocate(spot.id);
                }}
                primary
              />
              <ActionButton icon="close-outline" label="关闭" onPress={onClose} />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SectionTitle({
  kicker,
  title,
  note,
}: {
  kicker: string;
  title: string;
  note?: string;
}) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionEyebrow}>{kicker}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!note && <Text style={styles.sectionHint}>{note}</Text>}
    </View>
  );
}

function GlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: any;
}) {
  return <View style={[styles.glassCard, style]}>{children}</View>;
}

function GlassPill({
  icon,
  label,
}: {
  icon: string;
  label: string;
}) {
  return (
    <View style={styles.glassPill}>
      <Glyph name={icon} size={14} color={palette.text} />
      <Text style={styles.glassPillText}>{label}</Text>
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statChipLabel}>{label}</Text>
      <Text style={styles.statChipValue}>{value}</Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  primary = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={[styles.actionButton, primary && styles.actionButtonPrimary]}
      onPress={onPress}
    >
      <Glyph name={icon} size={16} color={primary ? palette.bg : palette.text} />
      <Text
        style={[
          styles.actionButtonText,
          primary && styles.actionButtonTextPrimary,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MiniButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.miniButton} onPress={onPress}>
      <Glyph name={icon} size={14} color={palette.text} />
      <Text style={styles.miniButtonText}>{label}</Text>
    </Pressable>
  );
}

function MetaPill({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <View style={styles.metaPill}>
      <Glyph name={icon} size={14} color={palette.subText} />
      <Text style={styles.metaPillText}>{text}</Text>
    </View>
  );
}

function SmallIconButton({
  icon,
  onPress,
}: {
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.smallIconButton} onPress={onPress}>
      <Glyph name={icon} size={18} color={palette.text} />
    </Pressable>
  );
}

function RatingBadge({
  score,
  compact = false,
}: {
  score: number;
  compact?: boolean;
}) {
  const full = Math.round(score);
  return (
    <View style={[styles.ratingBadge, compact && styles.ratingBadgeCompact]}>
      <Text style={styles.ratingStars}>
        {"★".repeat(full)}
        <Text style={styles.ratingStarsMuted}>{"★".repeat(5 - full)}</Text>
      </Text>
      <Text style={styles.ratingScore}>{score.toFixed(1)}</Text>
    </View>
  );
}

function TagRow({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <View style={styles.tagRow}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tagChip}>
          <Text style={styles.tagChipText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

function TabButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: string;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      {active ? (
        <LinearGradient
          colors={["#f9dc7b", "#ff9d6c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.tabButtonActive}
        >
          <Glyph name={icon} size={18} color={palette.bg} />
          <Text style={styles.tabButtonActiveText}>{label}</Text>
        </LinearGradient>
      ) : (
        <>
          <Glyph name={icon} size={18} color={palette.subText} />
          <Text style={styles.tabButtonText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

function Glyph({
  name,
  size,
  color,
}: {
  name: string;
  size: number;
  color: string;
}) {
  return (
    <Text style={{ fontSize: size, color, fontWeight: "700", lineHeight: size + 2 }}>
      {glyphMap[name] || "•"}
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  root: {
    flex: 1,
  },
  appHeader: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "700",
  },
  appSubtitle: {
    color: palette.subText,
    fontSize: 13,
    marginTop: 2,
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 16,
  },
  heroCard: {
    minHeight: 336,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
    marginTop: 8,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  heroShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4, 13, 21, 0.4)",
  },
  heroContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: 18,
  },
  heroEyebrowRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  heroTitle: {
    color: palette.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    marginTop: 12,
  },
  heroText: {
    color: "rgba(244, 247, 251, 0.92)",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
  },
  heroStatsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    marginTop: 12,
  },
  heroActionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
    flexWrap: "wrap",
  },
  glassPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  glassPillText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "600",
  },
  statChip: {
    minWidth: 92,
    backgroundColor: "rgba(9, 21, 36, 0.48)",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statChipLabel: {
    color: palette.subText,
    fontSize: 11,
  },
  statChipValue: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  sectionHead: {
    gap: 4,
  },
  sectionEyebrow: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "700",
  },
  sectionHint: {
    color: palette.subText,
    fontSize: 14,
    lineHeight: 22,
  },
  cardGrid: {
    gap: 12,
  },
  glassCard: {
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
  },
  logicCard: {
    paddingVertical: 18,
  },
  logicTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  cardText: {
    color: palette.subText,
    fontSize: 14,
    lineHeight: 22,
  },
  stopsWrap: {
    gap: 12,
  },
  stopCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: palette.panel,
    borderColor: palette.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 14,
  },
  stopIndex: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 157, 108, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  stopIndexText: {
    color: palette.route,
    fontSize: 14,
    fontWeight: "800",
  },
  stopBody: {
    flex: 1,
    gap: 8,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  stopTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
  },
  stopSubtitle: {
    color: palette.subText,
    fontSize: 14,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  metaPillText: {
    color: palette.text,
    fontSize: 12,
  },
  stopActionRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  actionButton: {
    minHeight: 42,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: palette.gold,
    borderColor: "rgba(0,0,0,0)",
  },
  actionButtonText: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700",
  },
  actionButtonTextPrimary: {
    color: palette.bg,
  },
  miniButton: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  miniButtonText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "600",
  },
  mapTabShell: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 12,
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 10,
    gap: 12,
  },
  mapHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  mapHeaderTitle: {
    color: palette.text,
    fontSize: 23,
    fontWeight: "800",
    marginTop: 4,
  },
  mapHeaderActions: {
    flexDirection: "row",
    gap: 8,
    flexShrink: 0,
    paddingTop: 2,
  },
  smallIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  searchPanel: {
    padding: 12,
  },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
    paddingVertical: 0,
  },
  searchResults: {
    marginTop: 10,
    maxHeight: 220,
  },
  searchResultCard: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    gap: 6,
  },
  searchResultTitle: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  searchResultType: {
    color: palette.subText,
    fontSize: 13,
  },
  searchResultHours: {
    color: palette.mint,
    fontSize: 12,
  },
  emptyText: {
    color: palette.subText,
    fontSize: 13,
    paddingVertical: 12,
  },
  segmentRow: {
    gap: 10,
    paddingRight: 20,
  },
  regionRow: {
    gap: 12,
    paddingRight: 24,
  },
  filterRow: {
    gap: 10,
    paddingRight: 18,
  },
  segmentChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  segmentChipActive: {
    backgroundColor: "rgba(249, 220, 123, 0.16)",
    borderColor: "rgba(249, 220, 123, 0.3)",
  },
  segmentChipText: {
    color: palette.subText,
    fontSize: 13,
    fontWeight: "600",
  },
  segmentChipTextActive: {
    color: palette.gold,
  },
  stackGap: {
    gap: 14,
  },
  featureCard: {
    padding: 0,
    overflow: "hidden",
  },
  featureImage: {
    width: "100%",
    height: 168,
  },
  featureBody: {
    padding: 16,
    gap: 10,
  },
  featureSource: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  featureTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
  },
  tagRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(126,220,208,0.12)",
    borderWidth: 1,
    borderColor: "rgba(126,220,208,0.18)",
  },
  tagChipText: {
    color: palette.mint,
    fontSize: 12,
    fontWeight: "600",
  },
  scheduleBox: {
    gap: 6,
    padding: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  scheduleLine: {
    color: palette.subText,
    fontSize: 13,
    lineHeight: 20,
  },
  regionChip: {
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
    gap: 6,
  },
  regionChipActive: {
    backgroundColor: "rgba(122,182,255,0.14)",
    borderColor: "rgba(122,182,255,0.26)",
  },
  regionChipTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  regionChipTitleActive: {
    color: "#dfefff",
  },
  regionChipMeta: {
    color: palette.subText,
    fontSize: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  filterChipActive: {
    backgroundColor: "rgba(255,183,107,0.18)",
  },
  filterChipText: {
    color: palette.subText,
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: palette.warm,
  },
  indexCard: {
    paddingVertical: 14,
  },
  indexHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  indexHeadMain: {
    flex: 1,
    gap: 4,
  },
  indexTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "700",
  },
  indexMeta: {
    color: palette.subText,
    fontSize: 13,
  },
  indexRight: {
    alignItems: "flex-end",
    gap: 10,
  },
  mapIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: palette.border,
  },
  expandedBody: {
    gap: 12,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
  },
  expandedImage: {
    width: "100%",
    height: 170,
    borderRadius: 18,
  },
  metaColumn: {
    gap: 6,
  },
  metaLine: {
    color: palette.subText,
    fontSize: 13,
    lineHeight: 20,
  },
  galleryRow: {
    gap: 12,
    paddingRight: 24,
  },
  galleryCard: {
    height: 214,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: palette.panel,
  },
  galleryImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  galleryShade: {
    ...StyleSheet.absoluteFillObject,
  },
  galleryContent: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    gap: 4,
  },
  galleryKicker: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  galleryTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
  },
  galleryNote: {
    color: "rgba(244,247,251,0.88)",
    fontSize: 13,
    lineHeight: 19,
  },
  storyList: {
    gap: 14,
  },
  storyItem: {
    flexDirection: "row",
    gap: 12,
  },
  storyBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(122,182,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  storyBadgeText: {
    color: palette.sky,
    fontSize: 12,
    fontWeight: "800",
  },
  storyBody: {
    flex: 1,
    gap: 6,
  },
  storyTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  scheduleCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  schedulePhase: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  scheduleTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
    marginBottom: 6,
  },
  listLine: {
    color: palette.subText,
    fontSize: 14,
    lineHeight: 22,
  },
  textTopGap: {
    marginTop: 8,
  },
  sourceItem: {
    gap: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sourceTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700",
  },
  sourceNote: {
    color: palette.subText,
    fontSize: 13,
    lineHeight: 19,
  },
  sourceUrl: {
    color: palette.sky,
    fontSize: 12,
    lineHeight: 18,
  },
  tabBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 16,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
    backgroundColor: "rgba(12, 27, 44, 0.9)",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: 18,
  },
  tabButtonActive: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    width: "100%",
  },
  tabButtonText: {
    color: palette.subText,
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
  tabButtonActiveText: {
    color: palette.bg,
    fontSize: 10,
    fontWeight: "700",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  ratingBadgeCompact: {
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  ratingStars: {
    color: palette.gold,
    fontSize: 11,
  },
  ratingStarsMuted: {
    color: "rgba(255,255,255,0.16)",
  },
  ratingScore: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 10, 16, 0.56)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    maxHeight: "88%",
    backgroundColor: "#0b1829",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
  },
  modalImage: {
    width: "100%",
    height: 220,
  },
  modalContent: {
    padding: 18,
    paddingBottom: 38,
    gap: 14,
  },
  modalTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "800",
  },
  modalSubtitle: {
    color: palette.subText,
    fontSize: 13,
    marginTop: 4,
  },
  modalBody: {
    color: palette.subText,
    fontSize: 15,
    lineHeight: 24,
  },
  detailBlock: {
    gap: 10,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  detailBlockTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  detailLine: {
    gap: 4,
  },
  detailLineLabel: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  detailLineValue: {
    color: palette.subText,
    fontSize: 14,
    lineHeight: 21,
  },
  modalActionRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
});
