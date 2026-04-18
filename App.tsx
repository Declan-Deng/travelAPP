import { StatusBar } from "expo-status-bar";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode, useEffect, useMemo, useState } from "react";
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
  getDistanceFromCenter,
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
  openingHoursMethodNote,
  places,
  recommendedRoute,
  routes,
  ratingMethodNote,
  regionalSpotCollections,
  searchSpots,
  sourceLinks,
} from "./src/lib/hongKong";

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
  routeMapTitle: "香港一日游",
  routeMapKicker: "经典路线",
  allCityTitle: "香港全域景点",
  allCityKicker: "全港分布",
  routeLogicTitle: "这条线路怎么走",
  routeLogicNote: "先选天数，再看地图、延伸玩法和分区景点。",
  mapHintRoute: "地图会显示当前路线、顺路景点和其他片区的香港点位。",
  mapHintFocus: "地图已切到当前景点或专题。",
  searchEmpty: "没有找到相关景点，可试试“中环”“维港”“海边”“离岛”“博物馆”。",
  extendIndex: "区域索引",
  extendLp: "主题推荐",
  extendGuide: "替代路线",
  extendMapAction: "在地图查看",
  guideKicker: "图册与信息",
  guideTitle: "图册、时间与出发信息",
  guideNote: "图册、故事线和出发信息都收在这里。",
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
type RouteLayerKey =
  | "schedule"
  | "logic"
  | "stops"
  | "gallery"
  | "story"
  | "prep"
  | "sources";

type GeoError = {
  code?: number;
  message?: string;
};

type GeoOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
  showLocationDialog?: boolean;
  forceRequestLocation?: boolean;
  forceLocationManager?: boolean;
  accuracy?: {
    android?: string;
    ios?: string;
  };
};

type GeoPosition = {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  provider?: string;
};

const PositionError = {
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
  SETTINGS_NOT_SATISFIED: 5,
} as const;

let nativeGeolocation: any = null;

try {
  nativeGeolocation = require("react-native-geolocation-service").default;
} catch {
  nativeGeolocation = null;
}

function normalizeExpoPosition(
  location:
    | {
        coords: {
          latitude: number;
          longitude: number;
          accuracy?: number | null;
        };
      }
    | null,
  provider = "expo"
): GeoPosition | null {
  if (!location) return null;

  return {
    coords: {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy ?? undefined,
    },
    provider,
  };
}

function getNativePosition(options: GeoOptions) {
  if (nativeGeolocation?.getCurrentPosition) {
    return new Promise<GeoPosition>((resolve, reject) => {
      nativeGeolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  return Location.getCurrentPositionAsync({
    accuracy: options.enableHighAccuracy
      ? Location.Accuracy.Highest
      : Location.Accuracy.Balanced,
    mayShowUserSettingsDialog: options.showLocationDialog ?? true,
  }).then((location) => {
    const normalized = normalizeExpoPosition(location);
    if (!normalized) {
      throw new Error("POSITION_UNAVAILABLE");
    }
    return normalized;
  });
}

async function getLastKnownPositionCompat() {
  if (nativeGeolocation?.getCurrentPosition) {
    return getNativePosition({
      accuracy: { android: "balanced", ios: "hundredMeters" },
      enableHighAccuracy: false,
      timeout: 6000,
      maximumAge: 1000 * 60 * 30,
      showLocationDialog: false,
      forceRequestLocation: true,
      forceLocationManager: true,
    });
  }

  const location = await Location.getLastKnownPositionAsync({
    maxAge: 1000 * 60 * 30,
    requiredAccuracy: 500,
  });

  const normalized = normalizeExpoPosition(location, "expo-last-known");
  if (!normalized) {
    throw new Error("POSITION_UNAVAILABLE");
  }

  return normalized;
}

function toLatLng(position: GeoPosition): [number, number] {
  return [position.coords.latitude, position.coords.longitude];
}

function App() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = Math.max(screenWidth - 32, 280);
  const regionCardWidth = Math.max(Math.floor((contentWidth - 12) / 2), 132);
  const routeOptionWidth = Math.max(Math.min(contentWidth * 0.68, 224), 174);
  const routeRailCardWidth = Math.max(Math.min(contentWidth * 0.78, 286), 236);
  const layerCardWidth = Math.max(Math.floor((contentWidth - 12) / 2), 150);
  const extendPreviewWidth = Math.max(Math.min(contentWidth * 0.76, 272), 224);
  const tabBarBottom = Math.max(14, insets.bottom + 8);
  const tabBarHeight = 66;
  const tabBarReservedSpace = tabBarBottom + tabBarHeight + 12;
  const [currentTab, setCurrentTab] = useState<TabKey>("route");
  const [routeId, setRouteId] = useState<string>(recommendedRoute.id);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [extendView, setExtendView] = useState<ExtendView>("index");
  const [extendLayer, setExtendLayer] = useState<ExtendView | null>(null);
  const [showRoutePicker, setShowRoutePicker] = useState(true);
  const [routeLayer, setRouteLayer] = useState<RouteLayerKey | null>(null);
  const currentRoute = useMemo(
    () => routes.find((route: any) => route.id === routeId) || routes[0],
    [routeId]
  );
  const routeStops = useMemo(
    () => currentRoute.stops.map((stopId: string) => places[stopId]).filter(Boolean),
    [currentRoute]
  );
  const routeCoords = useMemo(
    () => routeStops.map((spot: any) => spot.coords as [number, number]).filter(Boolean),
    [routeStops]
  );
  const routeDayGroups = useMemo(() => {
    const totalStops = routeStops.length;
    const totalDays = Math.max(currentRoute.schedule.length, 1);

    return currentRoute.schedule.map((item: any, index: number) => {
      const start = Math.round((index * totalStops) / totalDays);
      const end = Math.round(((index + 1) * totalStops) / totalDays);
      const spots = routeStops.slice(start, Math.max(start + 1, end));

      return {
        ...item,
        index,
        spots,
      };
    });
  }, [currentRoute, routeStops]);
  const activeDayGroup = routeDayGroups[selectedDayIndex] || routeDayGroups[0] || null;
  const extraOldCitySpots = useMemo(
    () =>
      Object.values(places).filter(
        (spot: any) => !currentRoute.stops.includes(spot.id)
      ),
    [currentRoute]
  );
  const [selectedSpotId, setSelectedSpotId] = useState<string>(
    currentRoute.stops[0]
  );
  const [detailSpotId, setDetailSpotId] = useState<string | null>(null);
  const [mapMode, setMapMode] = useState<"route" | "focus" | "all">("route");
  const [focusedSpotIds, setFocusedSpotIds] = useState<string[]>(
    currentRoute.stops
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

  const extendSummary = useMemo(
    () => ({
      index: {
        title: selectedRegion.title,
        note: `${selectedRegion.spots.length} 个景点，先按区域选一块再进入列表。`,
      },
      lp: {
        title: "主题推荐",
        note: `${lonelyPlanetHighlights.length} 组主题，适合先定兴趣，再开地图。`,
      },
      guide: {
        title: "替代路线",
        note: `${cityRecommendations.length} 组替代方案，适合按旅行风格另起一条线。`,
      },
    }),
    [selectedRegion]
  );

  useEffect(() => {
    setSelectedSpotId(currentRoute.stops[0]);
    setSelectedDayIndex(0);
    if (mapMode === "route") {
      setFocusedSpotIds(currentRoute.stops);
      setMapTitle(currentRoute.label);
      setMapKicker(currentRoute.badge);
    }
  }, [currentRoute, mapMode]);

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
      route: focused.filter((spot: any) => currentRoute.stops.includes(spot.id)),
      extras: focused.filter(
        (spot: any) =>
          !currentRoute.stops.includes(spot.id) && places[spot.id]
      ),
      city: focused.filter((spot: any) => !places[spot.id]),
    };
  }, [currentRoute, extraOldCitySpots, focusedSpotIds, mapMode, routeStops]);

  function focusRoute() {
    setCurrentTab("map");
    setMapMode("route");
    setFocusedSpotIds(currentRoute.stops);
    setSelectedSpotId(currentRoute.stops[0]);
    setMapTitle(currentRoute.label);
    setMapKicker(currentRoute.badge);
  }

  function focusAllCity() {
    setCurrentTab("map");
    setMapMode("all");
    setFocusedSpotIds(allSpots.map((spot: any) => spot.id));
    setSelectedSpotId(currentRoute.stops[0]);
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

  function chooseRoute(nextRouteId: string) {
    setRouteId(nextRouteId);
    setShowRoutePicker(false);
  }

  function openRouteLayer(nextLayer: RouteLayerKey) {
    setRouteLayer(nextLayer);
  }

  const routeLayerEntries = useMemo(
    () => [
      {
        key: "schedule" as RouteLayerKey,
        kicker: "先扫节奏",
        title: "每日安排",
        note: `${currentRoute.schedule.length} 段，先看每天怎么排`,
      },
      {
        key: "logic" as RouteLayerKey,
        kicker: "看懂路线",
        title: "路线逻辑",
        note: `${currentRoute.panels.length} 个判断，帮你快速理解这条线`,
      },
      {
        key: "stops" as RouteLayerKey,
        kicker: "往下细看",
        title: "站点清单",
        note: `${routeStops.length} 站，评级、开放参考和地图入口都在里面`,
      },
      {
        key: "prep" as RouteLayerKey,
        kicker: "出发前",
        title: "出发信息",
        note: "把准备事项、开放时间说明和评级口径收在一起",
      },
    ],
    [currentRoute, routeStops.length]
  );

  const guideLayerEntries = useMemo(
    () => [
      {
        key: "gallery" as RouteLayerKey,
        kicker: "看画面",
        title: "图册亮点",
        note: `${galleryItems.length} 组画面，适合先建立这条线的气质`,
      },
      {
        key: "story" as RouteLayerKey,
        kicker: "看叙事",
        title: "路线故事线",
        note: `${currentRoute.chapters.length} 段，解释为什么这样走`,
      },
      {
        key: "prep" as RouteLayerKey,
        kicker: "看准备",
        title: "出发信息",
        note: `${currentRoute.prep.length} 条提醒，减少临时改计划`,
      },
      {
        key: "sources" as RouteLayerKey,
        kicker: "看出处",
        title: "资料来源",
        note: "把这次路线用到的公开资料和本地素材集中放在一层",
      },
    ],
    [currentRoute]
  );

  const extendPreviewItems = useMemo(() => {
    if (extendView === "lp") return lonelyPlanetHighlights.slice(0, 4);
    if (extendView === "guide") return cityRecommendations.slice(0, 4);
    return [];
  }, [extendView]);

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
        const lastKnown = await getLastKnownPositionCompat();
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
        <SectionTitle
          kicker="先定天数"
          title="先决定这次香港怎么玩"
          note="先选天数，再往下看。"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routeModeRow}
        >
          {routes.map((route: any) => (
            <Pressable
              key={route.id}
              style={[
                styles.routeModeChip,
                routeId === route.id && styles.routeModeChipActive,
              ]}
              onPress={() => chooseRoute(route.id)}
            >
              <Text
                style={[
                  styles.routeModeChipDays,
                  routeId === route.id && styles.routeModeChipDaysActive,
                ]}
              >
                {route.days}
              </Text>
              <Text
                style={[
                  styles.routeModeChipText,
                  routeId === route.id && styles.routeModeChipTextActive,
                ]}
              >
                {route.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.routeModeMoreButton}
            onPress={() => setShowRoutePicker(true)}
          >
            <Glyph name="apps-outline" size={16} color={palette.text} />
            <Text style={styles.routeModeMoreText}>全部方案</Text>
          </Pressable>
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={routeRailCardWidth + 14}
          contentContainerStyle={styles.routeRail}
        >
          {routes.map((route: any) => (
            <Pressable
              key={route.id}
              style={[
                styles.routeShowcaseCard,
                { width: routeRailCardWidth },
                route.id === routeId && styles.routeShowcaseCardActive,
              ]}
              onPress={() => chooseRoute(route.id)}
            >
              <Image
                source={getCitywalkImage(route.heroImage)}
                style={styles.routeShowcaseImage}
              />
              <LinearGradient
                colors={["transparent", "rgba(6,17,29,0.92)"]}
                style={styles.routeShowcaseShade}
              />
              <View style={styles.routeShowcaseBody}>
                <View style={styles.heroEyebrowRow}>
                  <GlassPill icon="walk-outline" label={route.badge} />
                </View>
                <Text numberOfLines={2} style={styles.routeShowcaseTitle}>
                  {route.headline}
                </Text>
                <Text numberOfLines={2} style={styles.routeShowcaseText}>
                  {route.lead}
                </Text>
                <View style={styles.heroStatsRow}>
                  <StatChip label="站点" value={`${route.stops.length} 站`} />
                  <StatChip label="方式" value={route.mode} />
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {activeDayGroup && (
          <GlassCard style={styles.dayPlannerCard}>
            <View style={styles.currentRouteHead}>
              <View style={styles.currentRouteCopy}>
                <Text style={styles.sectionEyebrow}>按天看节奏</Text>
                <Text style={styles.currentRouteTitle}>
                  {activeDayGroup.phase} · {activeDayGroup.title}
                </Text>
                <Text style={styles.sectionHint}>
                  {activeDayGroup.spots.length} 站 · {currentRoute.mode}
                </Text>
              </View>
              <Pressable
                style={styles.layerActionButton}
                onPress={() => openRouteLayer("schedule")}
              >
                <Glyph name="reader-outline" size={16} color={palette.text} />
                <Text style={styles.layerActionButtonText}>看完整安排</Text>
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayChipRow}
            >
              {routeDayGroups.map((item: any) => (
                <Pressable
                  key={`${currentRoute.id}-${item.index}`}
                  style={[
                    styles.dayChip,
                    selectedDayIndex === item.index && styles.dayChipActive,
                  ]}
                  onPress={() => setSelectedDayIndex(item.index)}
                >
                  <Text
                    style={[
                      styles.dayChipPhase,
                      selectedDayIndex === item.index && styles.dayChipPhaseActive,
                    ]}
                  >
                    {item.phase}
                  </Text>
                  <Text
                    style={[
                      styles.dayChipTitle,
                      selectedDayIndex === item.index && styles.dayChipTitleActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.daySummaryCard}>
              <Text style={styles.daySummaryTitle}>{activeDayGroup.title}</Text>
              <Text style={styles.cardText}>{activeDayGroup.body}</Text>
              <View style={styles.daySpotTagRow}>
                {activeDayGroup.spots.map((spot: any) => (
                  <Pressable
                    key={spot.id}
                    style={styles.daySpotTag}
                    onPress={() => focusSpot(spot.id)}
                  >
                    <Text style={styles.daySpotTagText}>{spot.name}</Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.heroActionRow}>
                <ActionButton
                  icon="map-outline"
                  label="地图看这一天"
                  onPress={() =>
                    focusCollection(
                      activeDayGroup.spots.map((spot: any) => spot.id),
                      activeDayGroup.title,
                      activeDayGroup.phase
                    )
                  }
                  primary
                />
                <ActionButton
                  icon="document-text-outline"
                  label="看站点清单"
                  onPress={() => openRouteLayer("stops")}
                />
              </View>
            </View>
          </GlassCard>
        )}

        <SectionTitle
          kicker="继续查看"
          title="从四个入口继续看"
          note="安排、逻辑、站点、出发信息分开看。"
        />

        <View style={styles.layerEntryGridWide}>
          {routeLayerEntries.map((item) => (
            <Pressable
              key={item.key}
              style={[styles.layerEntryCard, { width: layerCardWidth }]}
              onPress={() => openRouteLayer(item.key)}
            >
              <Text style={styles.layerEntryKicker}>{item.kicker}</Text>
              <Text style={styles.layerEntryTitle}>{item.title}</Text>
              <Text style={styles.layerEntryNote}>{item.note}</Text>
              <View style={styles.layerEntryFooter}>
                <Text style={styles.layerEntryAction}>进入查看</Text>
                <Glyph name="navigate-outline" size={16} color={palette.gold} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    );
  }

  function renderMapTab() {
    return (
      <View style={[styles.mapTabShell, { paddingBottom: 18 }]}>
        <View style={styles.mapHeader}>
          <View style={styles.mapHeaderCopy}>
            <Text style={styles.sectionEyebrow}>地图与搜索</Text>
            <Text style={styles.mapHeaderTitle}>{currentRoute.badge}</Text>
            <Text style={styles.sectionHint}>
              {mapMode === "route" ? uiCopy.mapHintRoute : uiCopy.mapHintFocus}
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
              placeholder="搜索景点、海滨、街区、离岛或博物馆"
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

        <View style={styles.mapPlannerWrap}>
          <View style={styles.mapCanvasWrap}>
            <MapSurface
              routeCoords={routeCoords}
              mapMode={mapMode}
              mapTitle={mapTitle}
              mapKicker={mapKicker}
              showDock={false}
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

          {activeDayGroup && (
            <GlassCard style={styles.mapPlannerSheet}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureSource}>{currentRoute.badge}</Text>
                  <Text style={styles.featureTitle}>{activeDayGroup.title}</Text>
                  <Text numberOfLines={2} style={styles.cardText}>
                    {activeDayGroup.body}
                  </Text>
                </View>
                <Pressable
                  style={styles.mapSheetButton}
                  onPress={() => openRouteLayer("schedule")}
                >
                  <Glyph name="reader-outline" size={16} color={palette.text} />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dayChipRow}
              >
                {routeDayGroups.map((item: any) => (
                  <Pressable
                    key={`${currentRoute.id}-map-${item.index}`}
                    style={[
                      styles.dayChip,
                      selectedDayIndex === item.index && styles.dayChipActive,
                    ]}
                    onPress={() => {
                      setSelectedDayIndex(item.index);
                      focusCollection(
                        item.spots.map((spot: any) => spot.id),
                        item.title,
                        item.phase
                      );
                    }}
                  >
                    <Text
                      style={[
                        styles.dayChipPhase,
                        selectedDayIndex === item.index && styles.dayChipPhaseActive,
                      ]}
                    >
                      {item.phase}
                    </Text>
                    <Text
                      style={[
                        styles.dayChipTitle,
                        selectedDayIndex === item.index && styles.dayChipTitleActive,
                      ]}
                    >
                      {item.title}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              <View style={styles.mapSheetTagRow}>
                {activeDayGroup.spots.slice(0, 4).map((spot: any) => (
                  <Pressable
                    key={spot.id}
                    style={styles.daySpotTag}
                    onPress={() => focusSpot(spot.id)}
                  >
                    <Text style={styles.daySpotTagText}>{spot.name}</Text>
                  </Pressable>
                ))}
                {activeDayGroup.spots.length > 4 && (
                  <View style={styles.mapSheetMoreTag}>
                    <Text style={styles.mapSheetMoreTagText}>
                      +{activeDayGroup.spots.length - 4} 站
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.mapSheetActionRow}>
                <MiniButton
                  icon="document-text-outline"
                  label="看站点"
                  onPress={() => openRouteLayer("stops")}
                />
                <MiniButton
                  icon="walk-outline"
                  label="回主线"
                  onPress={focusRoute}
                />
              </View>
            </GlassCard>
          )}
        </View>
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
          kicker="香港延伸"
          title="先挑一组，再继续细看"
          note="上面先选玩法，下面再看区域索引、主题推荐和替代路线。"
        />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToAlignment="start"
          snapToInterval={extendPreviewWidth + 12}
          contentContainerStyle={styles.extendPreviewRow}
        >
          {cityRecommendations.slice(0, 4).map((item: any) => (
            <Pressable
              key={item.title}
              style={[styles.extendPreviewCard, { width: extendPreviewWidth }]}
              onPress={() => {
                setExtendView("guide");
                setExtendLayer("guide");
              }}
            >
              <Image
                source={getCitywalkImage(item.image)}
                style={styles.extendPreviewImage}
              />
              <LinearGradient
                colors={["transparent", "rgba(6,17,29,0.94)"]}
                style={styles.routeShowcaseShade}
              />
              <View style={styles.extendPreviewBody}>
                <Text style={styles.featureSource}>{item.area}</Text>
                <Text style={styles.extendPreviewTitle}>{item.title}</Text>
                <Text numberOfLines={2} style={styles.extendPreviewText}>
                  {item.text}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>

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

        {extendView === "index" && (
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
        )}

        {extendView !== "index" && !!extendPreviewItems.length && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={extendPreviewWidth + 12}
            contentContainerStyle={styles.extendPreviewRow}
          >
            {extendPreviewItems.map((item: any) => (
              <Pressable
                key={item.title}
                style={[styles.extendMiniCard, { width: extendPreviewWidth }]}
                onPress={() => setExtendLayer(extendView)}
              >
                <Image
                  source={getCitywalkImage(item.image)}
                  style={styles.extendMiniImage}
                />
                <View style={styles.extendMiniBody}>
                  <Text style={styles.featureSource}>
                    {"source" in item ? item.source : item.area}
                  </Text>
                  <Text style={styles.extendMiniTitle}>{item.title}</Text>
                  <Text numberOfLines={2} style={styles.cardText}>
                    {item.text}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <GlassCard style={styles.extendOverviewCard}>
          <Text style={styles.featureSource}>
            {extendView === "index"
              ? uiCopy.extendIndex
              : extendView === "lp"
                ? uiCopy.extendLp
                : uiCopy.extendGuide}
          </Text>
          <Text style={styles.featureTitle}>{extendSummary[extendView].title}</Text>
          <Text style={styles.cardText}>{extendSummary[extendView].note}</Text>

          {extendView === "index" && (
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
          )}

          <View style={styles.heroActionRow}>
              <ActionButton
                icon="document-text-outline"
                label="查看这一组"
                onPress={() => setExtendLayer(extendView)}
                primary
              />
            <ActionButton
              icon="map-outline"
              label="地图查看"
              onPress={() => {
                if (extendView === "index") {
                  focusCollection(
                    filteredRegionSpots.map((spot: any) => spot.id),
                    selectedRegion.title,
                    uiCopy.extendIndex
                  );
                  return;
                }

                if (extendView === "lp") {
                  const item = lonelyPlanetHighlights[0];
                  if (item) {
                    focusCollection(item.spotIds, item.title, uiCopy.extendLp);
                  }
                  return;
                }

                const item = cityRecommendations[0];
                if (item) {
                  focusCollection(item.spotIds, item.title, uiCopy.extendGuide);
                }
              }}
            />
          </View>
        </GlassCard>
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

        <Pressable
          style={styles.galleryHeroCard}
          onPress={() => openRouteLayer("gallery")}
        >
          <Image
            source={getCitywalkImage(galleryItems[0]?.image)}
            style={styles.galleryHeroImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(9,21,36,0.94)"]}
            style={styles.galleryShade}
          />
          <View style={styles.galleryContent}>
            <Text style={styles.galleryKicker}>{galleryItems[0]?.kicker || "路线图册"}</Text>
            <Text style={styles.galleryTitle}>
              {galleryItems[0]?.title || "先从图册进入这条线"}
            </Text>
            <Text numberOfLines={2} style={styles.galleryNote}>
              {galleryItems[0]?.note || "点进去看整组图册和地图定位。"}
            </Text>
          </View>
        </Pressable>

        <View style={styles.layerEntryGridWide}>
          {guideLayerEntries.map((item) => (
            <Pressable
              key={item.key}
              style={[styles.layerEntryCard, { width: layerCardWidth }]}
              onPress={() => openRouteLayer(item.key)}
            >
              <Text style={styles.layerEntryKicker}>{item.kicker}</Text>
              <Text style={styles.layerEntryTitle}>{item.title}</Text>
              <Text style={styles.layerEntryNote}>{item.note}</Text>
              <View style={styles.layerEntryFooter}>
                <Text style={styles.layerEntryAction}>进入查看</Text>
                <Glyph name="navigate-outline" size={16} color={palette.gold} />
              </View>
            </Pressable>
          ))}
        </View>
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
            <Text style={styles.appTitle}>香港旅行导览</Text>
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
            label="行程"
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
        <RoutePickerModal
          visible={showRoutePicker}
          routes={routes}
          selectedRouteId={routeId}
          routeOptionWidth={routeOptionWidth}
          onClose={() => setShowRoutePicker(false)}
          onSelectRoute={chooseRoute}
        />
        <RouteLayerModal
          layer={routeLayer}
          route={currentRoute}
          routeStops={routeStops}
          galleryItems={galleryItems}
          onClose={() => setRouteLayer(null)}
          onOpenSpot={(spotId) => {
            setRouteLayer(null);
            setDetailSpotId(spotId);
          }}
          onLocateSpot={(spotId) => {
            setRouteLayer(null);
            focusSpot(spotId);
          }}
          onFocusCollection={(spotIds, title, kicker) => {
            setRouteLayer(null);
            focusCollection(spotIds, title, kicker);
          }}
        />
        <ExtendLayerModal
          layer={extendLayer}
          selectedRegion={selectedRegion}
          filteredRegionSpots={filteredRegionSpots}
          lonelyPlanetHighlights={lonelyPlanetHighlights}
          cityRecommendations={cityRecommendations}
          expandedSpotId={expandedSpotId}
          onClose={() => setExtendLayer(null)}
          onToggleSpot={(spotId) =>
            setExpandedSpotId((prev) => (prev === spotId ? null : spotId))
          }
          onOpenSpot={(spotId) => {
            setExtendLayer(null);
            setDetailSpotId(spotId);
          }}
          onLocateSpot={(spotId) => {
            setExtendLayer(null);
            focusSpot(spotId);
          }}
          onFocusCollection={(spotIds, title, kicker) => {
            setExtendLayer(null);
            focusCollection(spotIds, title, kicker);
          }}
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

function RoutePickerModal({
  visible,
  routes,
  selectedRouteId,
  routeOptionWidth,
  onClose,
  onSelectRoute,
}: {
  visible: boolean;
  routes: any[];
  selectedRouteId: string;
  routeOptionWidth: number;
  onClose: () => void;
  onSelectRoute: (routeId: string) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.layerBackdrop}>
        <View style={styles.pickerSheet}>
          <View style={styles.pickerHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>行程入口</Text>
              <Text style={styles.pickerTitle}>这次先玩几天</Text>
              <Text style={styles.sectionHint}>
                先选一个方案，再进入行程页。后面随时都能改。
              </Text>
            </View>
            <Pressable style={styles.closeIconButton} onPress={onClose}>
              <Glyph name="close-outline" size={18} color={palette.text} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={routeOptionWidth + 12}
            contentContainerStyle={styles.routeOptionRow}
          >
            {routes.map((route: any) => (
              <Pressable
                key={route.id}
                style={[
                  styles.routeOptionCard,
                  styles.routeOptionCardLarge,
                  { width: routeOptionWidth },
                  selectedRouteId === route.id && styles.routeOptionCardActive,
                ]}
                onPress={() => onSelectRoute(route.id)}
              >
                <View style={styles.routeOptionTop}>
                  <Text
                    style={[
                      styles.routeOptionDays,
                      selectedRouteId === route.id && styles.routeOptionDaysActive,
                    ]}
                  >
                    {route.days}
                  </Text>
                  <View
                    style={[
                      styles.routeOptionBadge,
                      selectedRouteId === route.id && styles.routeOptionBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.routeOptionBadgeText,
                        selectedRouteId === route.id && styles.routeOptionBadgeTextActive,
                      ]}
                    >
                      {route.label}
                    </Text>
                  </View>
                </View>
                <Text style={styles.routeOptionTitle}>{route.fit}</Text>
                <Text style={styles.routeOptionNote}>{route.note}</Text>
                <Text numberOfLines={2} style={styles.routeOptionLead}>
                  {route.lead}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function RouteLayerModal({
  layer,
  route,
  routeStops,
  galleryItems,
  onClose,
  onOpenSpot,
  onLocateSpot,
  onFocusCollection,
}: {
  layer: RouteLayerKey | null;
  route: any;
  routeStops: any[];
  galleryItems: any[];
  onClose: () => void;
  onOpenSpot: (spotId: string) => void;
  onLocateSpot: (spotId: string) => void;
  onFocusCollection: (spotIds: string[], title: string, kicker: string) => void;
}) {
  if (!layer) return null;

  const config: Record<RouteLayerKey, { kicker: string; title: string; note: string }> = {
    schedule: {
      kicker: "每日安排",
      title: `${route.label}怎么排`,
      note: "先把每天的大致节奏扫一遍，再决定哪里需要加减。",
    },
    logic: {
      kicker: "路线逻辑",
      title: "这条线为什么这样走",
      note: "这里会把路线重点、适合人群和节奏提醒放在一起。",
    },
    stops: {
      kicker: "站点清单",
      title: "按站点往下看",
      note: "每一站都能继续开详情或直接跳地图。",
    },
    gallery: {
      kicker: "路线图册",
      title: "先用画面建立感觉",
      note: "适合先看一眼这条路线的气质，再决定想去哪里深看。",
    },
    story: {
      kicker: "路线故事线",
      title: "这条路线的叙事顺序",
      note: "把一天或几天的观看顺序梳理成更容易理解的段落。",
    },
    prep: {
      kicker: "出发信息",
      title: "出发前先看这层",
      note: "把准备事项、开放时间口径和评级说明都压在一层里。",
    },
    sources: {
      kicker: "资料来源",
      title: "这次用到的资料",
      note: "方便你回头核对出处，也便于后续继续补资料。",
    },
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.layerSheet}>
          <View style={styles.layerSheetHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>{config[layer].kicker}</Text>
              <Text style={styles.layerSheetTitle}>{config[layer].title}</Text>
              <Text style={styles.sectionHint}>{config[layer].note}</Text>
            </View>
            <Pressable style={styles.closeIconButton} onPress={onClose}>
              <Glyph name="close-outline" size={18} color={palette.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.layerSheetContent}
            showsVerticalScrollIndicator={false}
          >
            {layer === "schedule" && (
              <View style={styles.stackGap}>
                {route.schedule.map((item: any) => (
                  <View key={item.phase} style={styles.scheduleCard}>
                    <Text style={styles.schedulePhase}>{item.phase}</Text>
                    <Text style={styles.scheduleTitle}>{item.title}</Text>
                    <Text style={styles.cardText}>{item.body}</Text>
                  </View>
                ))}
              </View>
            )}

            {layer === "logic" && (
              <View style={styles.stackGap}>
                {route.panels.map((panel: any) => (
                  <GlassCard key={panel.title} style={styles.logicCard}>
                    <Text style={styles.logicTitle}>{panel.title}</Text>
                    <Text style={styles.cardText}>{panel.body}</Text>
                  </GlassCard>
                ))}
              </View>
            )}

            {layer === "stops" && (
              <View style={styles.stopsWrap}>
                {routeStops.map((spot: any, index: number) => (
                  <Pressable
                    key={spot.id}
                    style={styles.stopCard}
                    onPress={() => onOpenSpot(spot.id)}
                  >
                    <Image
                      source={getCitywalkImage(getSpotImageKey(spot.id))}
                      style={styles.stopImage}
                    />
                    <View style={styles.stopBody}>
                      <View style={styles.rowBetween}>
                        <View style={styles.stopTitleWrap}>
                          <View style={styles.stopIndex}>
                            <Text style={styles.stopIndexText}>
                              {String(index + 1).padStart(2, "0")}
                            </Text>
                          </View>
                          <Text style={styles.stopTitle}>{spot.name}</Text>
                        </View>
                        <RatingBadge score={getSpotRating(spot.id)} compact />
                      </View>
                      <Text numberOfLines={2} style={styles.stopSubtitle}>
                        {spot.subtitle}
                      </Text>
                      <View style={styles.metaRow}>
                        <MetaPill
                          icon="time-outline"
                          text={getSpotDuration(spot) || "现场调整"}
                        />
                        <MetaPill
                          icon="sunny-outline"
                          text={getSpotOpenHours(spot.id)}
                        />
                      </View>
                      <View style={styles.stopActionRow}>
                        <MiniButton
                          icon="document-text-outline"
                          label="看详情"
                          onPress={() => onOpenSpot(spot.id)}
                        />
                        <MiniButton
                          icon="location-outline"
                          label="地图定位"
                          onPress={() => onLocateSpot(spot.id)}
                        />
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {layer === "gallery" && (
              <View style={styles.stackGap}>
                {galleryItems.map((item: any) => (
                  <Pressable
                    key={item.title}
                    style={styles.galleryLayerCard}
                    onPress={() => {
                      if (item.spotId) onLocateSpot(item.spotId);
                      if (item.spotIds) {
                        onFocusCollection(item.spotIds, item.title, "图册定位");
                      }
                    }}
                  >
                    <Image
                      source={getCitywalkImage(item.image)}
                      style={styles.galleryLayerImage}
                    />
                    <View style={styles.galleryLayerBody}>
                      <Text style={styles.galleryKicker}>{item.kicker}</Text>
                      <Text style={styles.galleryTitle}>{item.title}</Text>
                      <Text style={styles.cardText}>{item.note}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {layer === "story" && (
              <View style={styles.storyList}>
                {route.chapters.map((chapter: any) => (
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
            )}

            {layer === "prep" && (
              <View style={styles.stackGap}>
                <GlassCard>
                  <Text style={styles.featureTitle}>出发前先看这几条</Text>
                  <View style={styles.stackGap}>
                    {route.prep.map((item: string) => (
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
              </View>
            )}

            {layer === "sources" && (
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
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ExtendLayerModal({
  layer,
  selectedRegion,
  filteredRegionSpots,
  lonelyPlanetHighlights,
  cityRecommendations,
  expandedSpotId,
  onClose,
  onToggleSpot,
  onOpenSpot,
  onLocateSpot,
  onFocusCollection,
}: {
  layer: ExtendView | null;
  selectedRegion: any;
  filteredRegionSpots: any[];
  lonelyPlanetHighlights: any[];
  cityRecommendations: any[];
  expandedSpotId: string | null;
  onClose: () => void;
  onToggleSpot: (spotId: string) => void;
  onOpenSpot: (spotId: string) => void;
  onLocateSpot: (spotId: string) => void;
  onFocusCollection: (spotIds: string[], title: string, kicker: string) => void;
}) {
  if (!layer) return null;

  const titles: Record<ExtendView, { kicker: string; title: string; note: string }> = {
    index: {
      kicker: "区域索引",
      title: selectedRegion.title,
      note: "先按片区浏览，再决定要不要开地图或继续看详情。",
    },
    lp: {
      kicker: "主题推荐",
      title: "按兴趣看香港",
      note: "先按兴趣找方向，再决定要不要开地图。",
    },
    guide: {
      kicker: "替代路线",
      title: "换一种排法",
      note: "如果你想换种玩法，这里有几条成型的替代安排。",
    },
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.layerSheet}>
          <View style={styles.layerSheetHead}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionEyebrow}>{titles[layer].kicker}</Text>
              <Text style={styles.layerSheetTitle}>{titles[layer].title}</Text>
              <Text style={styles.sectionHint}>{titles[layer].note}</Text>
            </View>
            <Pressable style={styles.closeIconButton} onPress={onClose}>
              <Glyph name="close-outline" size={18} color={palette.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.layerSheetContent}
            showsVerticalScrollIndicator={false}
          >
            {layer === "index" && (
              <View style={styles.stackGap}>
                <GlassCard>
                  <Text style={styles.featureTitle}>{selectedRegion.title}</Text>
                  <Text style={styles.cardText}>{selectedRegion.intro}</Text>
                </GlassCard>

                {filteredRegionSpots.map((spot: any) => {
                  const expanded = expandedSpotId === spot.id;
                  return (
                    <GlassCard key={spot.id} style={styles.indexCard}>
                      <Pressable
                        style={styles.indexHead}
                        onPress={() => onToggleSpot(spot.id)}
                      >
                        <View style={styles.indexHeadMain}>
                          <Text style={styles.indexTitle}>{spot.name}</Text>
                          <Text style={styles.indexMeta}>
                            {inferSpotCategory(spot)} · {getDistanceFromCenter(spot.coords)}
                          </Text>
                        </View>
                        <View style={styles.indexRight}>
                          <RatingBadge score={getSpotRating(spot.id)} compact />
                          <View style={styles.indexQuickRow}>
                            <Pressable
                              hitSlop={8}
                              onPress={(event: any) => {
                                event?.stopPropagation?.();
                                onLocateSpot(spot.id);
                              }}
                              style={styles.indexPillButton}
                            >
                              <Glyph
                                name="navigate-outline"
                                size={14}
                                color={palette.text}
                              />
                              <Text style={styles.indexPillText}>地图</Text>
                            </Pressable>
                            <Text style={styles.indexExpandText}>
                              {expanded ? "收起" : "展开"}
                            </Text>
                          </View>
                        </View>
                      </Pressable>

                      {expanded && (
                        <View style={styles.expandedBody}>
                          <Image
                            source={getCitywalkImage(getSpotImageKey(spot.id))}
                            style={styles.expandedImage}
                          />
                          <View style={styles.stopActionRow}>
                            <MiniButton
                              icon="location-outline"
                              label="定位到地图"
                              onPress={() => onLocateSpot(spot.id)}
                            />
                            <MiniButton
                              icon="document-text-outline"
                              label="看详情"
                              onPress={() => onOpenSpot(spot.id)}
                            />
                          </View>
                          <Text style={styles.cardText}>{spot.text}</Text>
                          <View style={styles.metaColumn}>
                            <Text style={styles.metaLine}>
                              类型：{inferSpotCategory(spot)}
                            </Text>
                            <Text style={styles.metaLine}>
                              开放参考：{getSpotOpenHours(spot.id)}
                            </Text>
                            <Text style={styles.metaLine}>
                              距中环：{getDistanceFromCenter(spot.coords)}
                            </Text>
                            <Text style={styles.metaLine}>
                              到达建议：{spot.travel || "建议结合当天路线安排"}
                            </Text>
                          </View>
                        </View>
                      )}
                    </GlassCard>
                  );
                })}
              </View>
            )}

            {layer === "lp" && (
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
                          onFocusCollection(item.spotIds, item.title, uiCopy.extendLp)
                        }
                        primary
                      />
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}

            {layer === "guide" && (
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
                        onPress={() =>
                          onFocusCollection(item.spotIds, item.title, uiCopy.extendGuide)
                        }
                        primary
                      />
                    </View>
                  </GlassCard>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
                  text={`距中环 ${getDistanceFromCenter(spot.coords)}`}
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

function MiniInfoPill({ label }: { label: string }) {
  return (
    <View style={styles.miniInfoPill}>
      <Text style={styles.miniInfoPillText}>{label}</Text>
    </View>
  );
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
    paddingTop: 6,
    paddingBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appTitle: {
    color: palette.text,
    fontSize: 20,
    fontWeight: "700",
  },
  appSubtitle: {
    color: palette.subText,
    fontSize: 12,
    marginTop: 2,
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  heroCard: {
    minHeight: 304,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
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
    gap: 2,
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
    fontSize: 18,
    fontWeight: "700",
  },
  sectionHint: {
    color: palette.subText,
    fontSize: 12,
    lineHeight: 18,
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
  currentRouteCard: {
    gap: 12,
  },
  currentRouteHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  currentRouteCopy: {
    flex: 1,
    gap: 4,
  },
  currentRouteTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  currentRouteStats: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  routeModeRow: {
    gap: 10,
    paddingRight: 20,
  },
  routeModeChip: {
    minHeight: 44,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
    justifyContent: "center",
    gap: 2,
  },
  routeModeChipActive: {
    backgroundColor: "rgba(249, 220, 123, 0.14)",
    borderColor: "rgba(249, 220, 123, 0.28)",
  },
  routeModeChipDays: {
    color: palette.text,
    fontSize: 15,
    fontWeight: "800",
  },
  routeModeChipDaysActive: {
    color: palette.gold,
  },
  routeModeChipText: {
    color: palette.subText,
    fontSize: 12,
    fontWeight: "700",
  },
  routeModeChipTextActive: {
    color: palette.text,
  },
  routeModeMoreButton: {
    minHeight: 44,
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  routeModeMoreText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
  },
  miniInfoPill: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  miniInfoPillText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "600",
  },
  layerActionButton: {
    minHeight: 38,
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
  layerActionButtonText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
  },
  plannerCard: {
    gap: 14,
  },
  plannerHead: {
    gap: 4,
  },
  plannerTitle: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800",
  },
  routeOptionRow: {
    gap: 12,
    paddingRight: 24,
  },
  routeOptionCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10,
  },
  routeOptionCardLarge: {
    minHeight: 164,
  },
  routeOptionCardActive: {
    backgroundColor: "rgba(249, 220, 123, 0.12)",
    borderColor: "rgba(249, 220, 123, 0.28)",
  },
  routeOptionTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  routeOptionDays: {
    color: palette.text,
    fontSize: 26,
    fontWeight: "800",
  },
  routeOptionDaysActive: {
    color: palette.gold,
  },
  routeOptionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(122,182,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(122,182,255,0.22)",
  },
  routeOptionBadgeActive: {
    backgroundColor: "rgba(255,183,107,0.18)",
    borderColor: "rgba(255,183,107,0.26)",
  },
  routeOptionBadgeText: {
    color: palette.sky,
    fontSize: 12,
    fontWeight: "700",
  },
  routeOptionBadgeTextActive: {
    color: palette.warm,
  },
  routeOptionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  routeOptionNote: {
    color: palette.subText,
    fontSize: 13,
    lineHeight: 20,
  },
  routeOptionLead: {
    color: "rgba(244,247,251,0.82)",
    fontSize: 13,
    lineHeight: 20,
  },
  routeRail: {
    gap: 12,
    paddingRight: 20,
  },
  routeShowcaseCard: {
    minHeight: 236,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panel,
  },
  routeShowcaseCardActive: {
    borderColor: "rgba(249, 220, 123, 0.42)",
  },
  routeShowcaseImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  routeShowcaseShade: {
    ...StyleSheet.absoluteFillObject,
  },
  routeShowcaseBody: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 12,
    gap: 6,
  },
  routeShowcaseTitle: {
    color: palette.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "800",
  },
  routeShowcaseText: {
    color: "rgba(244,247,251,0.9)",
    fontSize: 12,
    lineHeight: 18,
  },
  dayPlannerCard: {
    gap: 12,
  },
  dayChipRow: {
    gap: 10,
    paddingRight: 18,
  },
  dayChip: {
    minWidth: 126,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
    gap: 4,
  },
  dayChipActive: {
    backgroundColor: "rgba(122,182,255,0.16)",
    borderColor: "rgba(122,182,255,0.3)",
  },
  dayChipPhase: {
    color: palette.subText,
    fontSize: 12,
    fontWeight: "800",
  },
  dayChipPhaseActive: {
    color: palette.sky,
  },
  dayChipTitle: {
    color: palette.text,
    fontSize: 14,
    fontWeight: "700",
  },
  dayChipTitleActive: {
    color: "#e9f4ff",
  },
  daySummaryCard: {
    gap: 12,
    padding: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  daySummaryTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  daySpotTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  daySpotTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(126,220,208,0.1)",
    borderWidth: 1,
    borderColor: "rgba(126,220,208,0.18)",
  },
  daySpotTagText: {
    color: palette.mint,
    fontSize: 12,
    fontWeight: "700",
  },
  layerEntryGrid: {
    gap: 12,
  },
  layerEntryGridWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  layerEntryCard: {
    borderRadius: 22,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
    gap: 6,
  },
  layerEntryKicker: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  layerEntryTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
  },
  layerEntryNote: {
    color: palette.subText,
    fontSize: 12,
    lineHeight: 18,
  },
  layerEntryFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
  },
  layerEntryAction: {
    color: palette.text,
    fontSize: 13,
    fontWeight: "700",
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
    fontSize: 13,
    lineHeight: 20,
  },
  stopsWrap: {
    gap: 12,
  },
  scheduleRow: {
    gap: 12,
    paddingRight: 24,
  },
  tripDayCard: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10,
  },
  tripDayTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tripDayPhase: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: "800",
  },
  tripDayDot: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 12,
    fontWeight: "700",
  },
  tripDayMode: {
    color: palette.subText,
    fontSize: 12,
    fontWeight: "600",
  },
  tripDayTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "700",
  },
  tripDayBody: {
    color: palette.subText,
    fontSize: 14,
    lineHeight: 21,
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
  stopImage: {
    width: 96,
    height: 96,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  stopIndex: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255, 157, 108, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  stopIndexText: {
    color: palette.route,
    fontSize: 12,
    fontWeight: "800",
  },
  stopBody: {
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  stopTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  stopTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },
  stopSubtitle: {
    color: palette.subText,
    fontSize: 13,
    lineHeight: 20,
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
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 9,
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
    fontSize: 13,
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
    gap: 10,
  },
  mapPlannerWrap: {
    gap: 12,
  },
  mapCanvasWrap: {
    height: 268,
    minHeight: 268,
    flexShrink: 0,
  },
  mapPlannerSheet: {
    gap: 10,
    paddingTop: 12,
    flexShrink: 0,
  },
  mapSheetButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  mapSheetTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mapSheetMoreTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  mapSheetMoreTagText: {
    color: palette.subText,
    fontSize: 12,
    fontWeight: "700",
  },
  mapSheetActionRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 4,
    gap: 12,
  },
  mapHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },
  mapHeaderTitle: {
    color: palette.text,
    fontSize: 18,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  searchPanel: {
    padding: 10,
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
    paddingVertical: 9,
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
    paddingHorizontal: 13,
    paddingVertical: 8,
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
  extendOverviewCard: {
    gap: 12,
  },
  extendPreviewRow: {
    gap: 12,
    paddingRight: 24,
  },
  extendPreviewCard: {
    minHeight: 184,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panel,
  },
  extendPreviewImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  extendPreviewBody: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 14,
    gap: 6,
  },
  extendPreviewTitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
  },
  extendPreviewText: {
    color: "rgba(244,247,251,0.88)",
    fontSize: 12,
    lineHeight: 18,
  },
  extendMiniCard: {
    flexDirection: "row",
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.panel,
  },
  extendMiniImage: {
    width: 82,
    height: "100%",
    minHeight: 112,
  },
  extendMiniBody: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  extendMiniTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
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
    height: 156,
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
    fontSize: 17,
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
    padding: 12,
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
    fontSize: 15,
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
  indexQuickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  indexPillButton: {
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: palette.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  indexPillText: {
    color: palette.text,
    fontSize: 12,
    fontWeight: "700",
  },
  indexExpandText: {
    color: palette.subText,
    fontSize: 12,
    fontWeight: "700",
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
  galleryHeroCard: {
    height: 190,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
  },
  galleryHeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
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
    left: 12,
    right: 12,
    bottom: 12,
    gap: 4,
  },
  galleryKicker: {
    color: palette.gold,
    fontSize: 12,
    fontWeight: "700",
  },
  galleryTitle: {
    color: palette.text,
    fontSize: 17,
    fontWeight: "700",
  },
  galleryNote: {
    color: "rgba(244,247,251,0.88)",
    fontSize: 12,
    lineHeight: 18,
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
    borderRadius: 22,
    paddingHorizontal: 8,
    paddingVertical: 6,
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
    minHeight: 44,
    borderRadius: 18,
  },
  tabButtonActive: {
    minHeight: 44,
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
  layerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 10, 16, 0.62)",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  pickerSheet: {
    maxHeight: "72%",
    backgroundColor: "#0b1829",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 18,
    gap: 16,
  },
  pickerHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  pickerTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "800",
  },
  closeIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  layerSheet: {
    maxHeight: "86%",
    backgroundColor: "#0b1829",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    paddingTop: 16,
  },
  layerSheetHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  layerSheetTitle: {
    color: palette.text,
    fontSize: 24,
    fontWeight: "800",
  },
  layerSheetContent: {
    padding: 18,
    paddingBottom: 40,
    gap: 14,
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
  galleryLayerCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: palette.panel,
    borderWidth: 1,
    borderColor: palette.border,
  },
  galleryLayerImage: {
    width: "100%",
    height: 188,
  },
  galleryLayerBody: {
    padding: 16,
    gap: 6,
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
