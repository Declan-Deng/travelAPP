import { hongKongData } from "../data/hongKongData";

const data = hongKongData as any;

export const places = data.places as Record<string, any>;
export const routes = data.routes as any[];
export const sourceLinks = data.sourceLinks as any[];
export const galleryItems = data.galleryItems as any[];
export const lonelyPlanetHighlights = data.lonelyPlanetHighlights as any[];
export const cityRecommendations = data.cityRecommendations as any[];
export const regionalSpotCollections = data.regionalSpotCollections as any[];
export const placeMedia = data.placeMedia as Record<string, any>;
export const spotGuideMeta = data.spotGuideMeta as Record<string, any>;
export const placeImageOverrides = data.placeImageOverrides as Record<string, string>;
export const spotImageOverrides = data.spotImageOverrides as Record<string, string>;
export const ratingMethodNote = data.ratingMethodNote as string;
export const openingHoursMethodNote = data.openingHoursMethodNote as string;
export const hongKongCenter = data.hongKongCenter as [number, number];
export const recommendedRoute = routes[0];

export const allRegionalSpots = regionalSpotCollections.flatMap((section) =>
  section.spots.map((spot: any) => ({
    ...spot,
    regionId: section.id,
    regionTitle: section.title,
    regionMeta: section.meta,
  }))
);

export const regionalSpotLookup = new Map(
  allRegionalSpots.map((spot: any) => [spot.id, spot])
);

export const allSpots = [
  ...Object.values(places).map((place: any) => ({
    ...place,
    area: place.area || place.theme,
    source: place.area || "香港行程",
    type: "香港景点",
  })),
  ...allRegionalSpots
    .filter((spot: any) => !places[spot.id])
    .map((spot: any) => ({
      ...spot,
      subtitle: spot.text,
      theme: spot.source,
      type: "全域景点",
    })),
];

export function getSpotById(spotId?: string | null) {
  if (!spotId) return null;
  return places[spotId] || regionalSpotLookup.get(spotId) || null;
}

export function getSpotImageKey(spotId?: string | null) {
  if (!spotId) return "spot_detail_image_04.png";
  return (
    placeMedia[spotId]?.image ||
    regionalSpotLookup.get(spotId)?.image ||
    placeImageOverrides[spotId] ||
    spotImageOverrides[spotId] ||
    "spot_detail_image_04.png"
  );
}

export function getSpotRating(spotId?: string | null) {
  if (!spotId) return 4.6;
  return Number(spotGuideMeta[spotId]?.rating || 4.2);
}

export function getSpotOpenHours(spotId?: string | null) {
  if (!spotId) return "以当日安排为准";
  return spotGuideMeta[spotId]?.openHours || "以当日安排为准";
}

export function getSpotDuration(spot: any) {
  if (!spot?.stay?.length) return null;
  return `${spot.stay[0]}-${spot.stay[1]} 分钟`;
}

export function getSpotIntro(spot: any) {
  if (!spot) return "";
  if (spot.subtitle) return spot.subtitle;
  if (spot.text) return spot.text;
  return "";
}

export function getSpotBody(spot: any) {
  if (!spot) return "";
  if (Array.isArray(spot.overview)) return spot.overview.join("\n\n");
  return spot.text || spot.subtitle || "";
}

export function getSpotTags(spot: any) {
  if (Array.isArray(spot.tags) && spot.tags.length) return spot.tags;
  return [spot.theme || spot.source, spot.bestFor].filter(Boolean);
}

export function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function getDistanceFromCenter(coords?: [number, number]) {
  if (!coords) return "";
  const value = haversineKm(hongKongCenter, coords);
  if (value < 1) return `${Math.round(value * 1000)} m`;
  return `${value.toFixed(value < 10 ? 1 : 0)} km`;
}

export function inferSpotCategory(spot: any) {
  const text = [spot.name, spot.source, spot.theme, ...(spot.tags || [])]
    .filter(Boolean)
    .join(" ");

  if (/(博物馆|故宫|文化|大馆|艺穗会|酒店|警署|街市活化|乐园)/.test(text)) {
    return "文化地标";
  }

  if (/(小轮|码头|海港|海滨|维港|摩天轮|金紫荆|星光大道)/.test(text)) {
    return "海滨维港";
  }

  if (/(山顶|观景台|泳滩|浅水湾|赤柱|香港仔|大潭|龟背湾|昂坪|大澳|离岛)/.test(text)) {
    return "山海离岛";
  }

  if (/(中环|上环|坚尼地城|西营盘|港岛|扶手电梯|街市|金钟|铜锣湾)/.test(text)) {
    return "港岛漫游";
  }

  return "街区商圈";
}

export function searchSpots(query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return [];

  return allSpots
    .filter((spot: any) => {
      const haystack = [
        spot.name,
        spot.mapLabel,
        spot.subtitle,
        spot.text,
        spot.area,
        spot.source,
        spot.theme,
        ...(spot.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(keyword);
    })
    .slice(0, 16);
}
