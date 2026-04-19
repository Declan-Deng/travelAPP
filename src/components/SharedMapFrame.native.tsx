import { useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

type SharedMapMessage = {
  frameId?: string;
  type?: string;
  spotId?: string;
};

type Props = {
  html: string;
  frameId: string;
  selectedSpotId?: string | null;
  routeGeometry?: [number, number][];
  userLocation?: [number, number] | null;
  onSelectSpot: (spotId: string) => void;
  onTilesReady: () => void;
};

export default function SharedMapFrame({
  html,
  frameId,
  selectedSpotId,
  routeGeometry,
  userLocation,
  onSelectSpot,
  onTilesReady,
}: Props) {
  const webViewRef = useRef<WebView | null>(null);

  function syncSelectedSpot(spotId?: string | null) {
    webViewRef.current?.injectJavaScript(
      `window.__setSelectedSpot && window.__setSelectedSpot(${JSON.stringify(
        spotId ?? null
      )}); true;`
    );
  }

  function focusUserLocation(coords?: [number, number] | null) {
    if (!coords) return;
    webViewRef.current?.injectJavaScript(
      `window.__focusUserLocation && window.__focusUserLocation(${JSON.stringify(
        coords
      )}); true;`
    );
  }

  function syncRouteGeometry(coords?: [number, number][]) {
    webViewRef.current?.injectJavaScript(
      `window.__setRouteGeometry && window.__setRouteGeometry(${JSON.stringify(
        Array.isArray(coords) ? coords : []
      )}); true;`
    );
  }

  useEffect(() => {
    syncSelectedSpot(selectedSpotId);
  }, [selectedSpotId]);

  useEffect(() => {
    syncRouteGeometry(routeGeometry);
  }, [routeGeometry]);

  useEffect(() => {
    focusUserLocation(userLocation);
  }, [userLocation]);

  return (
    <WebView
      ref={webViewRef}
      originWhitelist={["*"]}
      source={{ html }}
      style={styles.webview}
      scrollEnabled={false}
      bounces={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      setBuiltInZoomControls={false}
      onLoadEnd={() => {
        syncSelectedSpot(selectedSpotId);
        syncRouteGeometry(routeGeometry);
        focusUserLocation(userLocation);
        setTimeout(onTilesReady, 700);
      }}
      onMessage={(event) => {
        let payload: SharedMapMessage | null = null;

        try {
          payload = JSON.parse(event.nativeEvent.data) as SharedMapMessage;
        } catch {
          payload = null;
        }

        if (!payload || payload.frameId !== frameId) return;

        if (payload.type === "selectSpot" && payload.spotId) {
          onSelectSpot(payload.spotId);
          return;
        }

        if (payload.type === "tilesReady") {
          onTilesReady();
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: "#08111d",
  },
});
