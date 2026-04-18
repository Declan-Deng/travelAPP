import { useEffect, useRef } from "react";

type SharedMapMessage = {
  frameId?: string;
  type?: string;
  spotId?: string;
};

type Props = {
  html: string;
  frameId: string;
  selectedSpotId?: string | null;
  userLocation?: [number, number] | null;
  onSelectSpot: (spotId: string) => void;
  onTilesReady: () => void;
};

function normalizeMessage(raw: unknown): SharedMapMessage | null {
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as SharedMapMessage;
    } catch {
      return null;
    }
  }

  if (typeof raw === "object") {
    return raw as SharedMapMessage;
  }

  return null;
}

export default function SharedMapFrame({
  html,
  frameId,
  selectedSpotId,
  userLocation,
  onSelectSpot,
  onTilesReady,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  function syncSelectedSpot(spotId?: string | null) {
    const frameWindow = iframeRef.current?.contentWindow as
      | (Window & {
          __setSelectedSpot?: (nextSpotId: string | null) => void;
          __focusUserLocation?: (coords: [number, number]) => void;
        })
      | null;

    if (!frameWindow?.__setSelectedSpot) return;
    frameWindow.__setSelectedSpot(spotId ?? null);
  }

  function focusUserLocation(coords?: [number, number] | null) {
    const frameWindow = iframeRef.current?.contentWindow as
      | (Window & {
          __focusUserLocation?: (nextCoords: [number, number]) => void;
        })
      | null;

    if (!coords || !frameWindow?.__focusUserLocation) return;
    frameWindow.__focusUserLocation(coords);
  }

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;

      const payload = normalizeMessage(event.data);
      if (!payload || payload.frameId !== frameId) return;

      if (payload.type === "selectSpot" && payload.spotId) {
        onSelectSpot(payload.spotId);
        return;
      }

      if (payload.type === "tilesReady") {
        onTilesReady();
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [frameId, onSelectSpot, onTilesReady]);

  useEffect(() => {
    syncSelectedSpot(selectedSpotId);
  }, [selectedSpotId]);

  useEffect(() => {
    focusUserLocation(userLocation);
  }, [userLocation]);

  return (
    <iframe
      ref={iframeRef}
      title="香港地图"
      srcDoc={html}
      onLoad={() => {
        syncSelectedSpot(selectedSpotId);
        focusUserLocation(userLocation);
      }}
      style={iframeStyle}
    />
  );
}

const iframeStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "0",
  display: "block",
  background: "#08111d",
};
