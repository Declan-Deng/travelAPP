type Spot = {
  id: string;
  name: string;
  coords: [number, number];
  subtitle?: string;
};

type SharedMapConfig = {
  frameId: string;
  routeCoords: [number, number][];
  mapMode: "route" | "focus" | "all";
  routeSpots: Spot[];
  extraSpots: Spot[];
  citySpots: Spot[];
  userLocation?: [number, number] | null;
};

export function buildSharedMapDocument(config: SharedMapConfig) {
  const payload = JSON.stringify(config).replace(/</g, "\\u003c");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      crossorigin=""
    />
    <style>
      html, body, #map {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background: #08111d;
        overflow: hidden;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      .leaflet-container {
        background: #08111d;
      }

      .leaflet-control-zoom {
        display: none;
      }

      .quanzhou-marker-shell {
        background: transparent;
        border: 0;
      }

      .quanzhou-route-marker {
        width: 26px;
        height: 26px;
        border-radius: 999px;
        background: #ff9d6c;
        border: 2px solid #fff2e8;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #3b150a;
        font-size: 11px;
        font-weight: 800;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.24);
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease, border-color 160ms ease;
      }

      .quanzhou-extra-marker {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: #7dd7a9;
        border: 2px solid #dbfff0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease, border-color 160ms ease;
      }

      .quanzhou-city-marker {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #f9dc7b;
        border: 2px solid #fff7db;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease, border-color 160ms ease;
      }

      .quanzhou-user-marker {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: #7ab6ff;
        border: 2px solid #d7f0ff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      }

      .quanzhou-route-marker.is-active,
      .quanzhou-extra-marker.is-active,
      .quanzhou-city-marker.is-active {
        transform: scale(1.14);
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.14), 0 10px 24px rgba(0, 0, 0, 0.28);
      }

      .quanzhou-route-marker.is-active {
        border-color: #fff8ef;
      }

      .quanzhou-extra-marker.is-active {
        border-color: #f2fff8;
      }

      .quanzhou-city-marker.is-active {
        border-color: #fffcef;
      }

      .quanzhou-route-marker.is-dim,
      .quanzhou-extra-marker.is-dim,
      .quanzhou-city-marker.is-dim {
        opacity: 0.42;
      }

      @media (max-width: 640px) {
        .quanzhou-route-marker {
          width: 22px;
          height: 22px;
          font-size: 9px;
        }

        .quanzhou-extra-marker {
          width: 9px;
          height: 9px;
        }

        .quanzhou-city-marker {
          width: 7px;
          height: 7px;
        }
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
    <script>
      const data = ${payload};

      function notify(message) {
        const payload = JSON.stringify({ ...message, frameId: data.frameId });
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(payload);
        }
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ ...message, frameId: data.frameId }, "*");
        }
      }

      const map = L.map("map", {
        zoomControl: false,
        attributionControl: true,
      }).setView(data.routeCoords[0] || [24.9149599, 118.5880777], 13);
      let userMarker = null;

      const tileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      });

      tileLayer.on("load", () => notify({ type: "tilesReady" }));
      tileLayer.addTo(map);

      function makeDivIcon(html, size, anchor) {
        return L.divIcon({
          className: "quanzhou-marker-shell",
          html,
          iconSize: size,
          iconAnchor: anchor,
        });
      }

      const markersById = new Map();
      let selectedHalo = null;
      function getMarkerInner(marker) {
        const element = marker.getElement();
        return element ? element.firstElementChild || element : null;
      }

      function clearSelectionArtifacts() {
        if (selectedHalo) {
          map.removeLayer(selectedHalo);
          selectedHalo = null;
        }

      }

      function setActiveSpot(spotId) {
        clearSelectionArtifacts();

        markersById.forEach(({ marker, kind, spot }, id) => {
          const inner = getMarkerInner(marker);
          if (!inner) return;

          const active = !!spotId && id === spotId;
          inner.classList.toggle("is-active", active);
          inner.classList.toggle("is-dim", !!spotId && !active);
          marker.setZIndexOffset(
            active ? 1200 : kind === "route" ? 700 : kind === "extra" ? 420 : 300
          );

          if (active) {
            selectedHalo = L.circleMarker(spot.coords, {
              radius: kind === "route" ? 18 : 15,
              color: kind === "route" ? "rgba(255, 157, 108, 0.78)" : kind === "extra" ? "rgba(125, 215, 169, 0.78)" : "rgba(249, 220, 123, 0.82)",
              fillColor: kind === "route" ? "rgba(255, 157, 108, 0.18)" : kind === "extra" ? "rgba(125, 215, 169, 0.18)" : "rgba(249, 220, 123, 0.18)",
              fillOpacity: 1,
              weight: 2,
              interactive: false,
            }).addTo(map);

          }
        });
      }

      window.__setSelectedSpot = setActiveSpot;
      window.__focusUserLocation = function(coords) {
        if (!coords || !Array.isArray(coords) || coords.length < 2) return;
        map.setView(coords, Math.max(map.getZoom(), 15), {
          animate: true,
        });
        if (userMarker) {
          userMarker.setLatLng(coords);
        }
      };

      window.addEventListener("message", (event) => {
        const next = event.data;
        if (!next || next.frameId !== data.frameId) return;
        if (next.type === "setSelectedSpot") {
          setActiveSpot(next.spotId || null);
        }
      });

      if (data.mapMode === "route" && data.routeCoords.length > 1) {
        L.polyline(data.routeCoords, {
          color: "#ff9d6c",
          weight: 5,
        }).addTo(map);
      }

      data.routeSpots.forEach((spot, index) => {
        const marker = L.marker(spot.coords, {
          icon: makeDivIcon('<div class="quanzhou-route-marker">' + (index + 1) + '</div>', [28, 28], [14, 14]),
        })
          .addTo(map)
          .on("click", () => {
            setActiveSpot(spot.id);
            notify({ type: "selectSpot", spotId: spot.id });
          });

        markersById.set(spot.id, { marker, kind: "route", spot });
      });

      data.extraSpots.forEach((spot) => {
        const marker = L.marker(spot.coords, {
          icon: makeDivIcon('<div class="quanzhou-extra-marker"></div>', [14, 14], [7, 7]),
        })
          .addTo(map)
          .on("click", () => {
            setActiveSpot(spot.id);
            notify({ type: "selectSpot", spotId: spot.id });
          });

        markersById.set(spot.id, { marker, kind: "extra", spot });
      });

      data.citySpots.forEach((spot) => {
        const marker = L.marker(spot.coords, {
          icon: makeDivIcon('<div class="quanzhou-city-marker"></div>', [12, 12], [6, 6]),
        })
          .addTo(map)
          .on("click", () => {
            setActiveSpot(spot.id);
            notify({ type: "selectSpot", spotId: spot.id });
          });

        markersById.set(spot.id, { marker, kind: "city", spot });
      });

      if (data.userLocation) {
        userMarker = L.marker(data.userLocation, {
          icon: makeDivIcon('<div class="quanzhou-user-marker"></div>', [14, 14], [7, 7]),
        }).addTo(map);
      }

      const visibleCoords = [...data.routeSpots, ...data.extraSpots, ...data.citySpots]
        .filter((spot) => Array.isArray(spot.coords))
        .map((spot) => spot.coords);

      if (data.mapMode === "route" && data.routeCoords.length > 1) {
        map.fitBounds(data.routeCoords, { padding: [40, 40] });
      } else if (visibleCoords.length > 1) {
        map.fitBounds(visibleCoords, { padding: [40, 40] });
      } else {
        const selected = visibleCoords[0] || data.routeCoords[0];
        if (selected) {
          map.setView(selected, 15);
        }
      }

      setTimeout(() => {
        setActiveSpot(
          data.routeSpots[0]?.id ||
            data.extraSpots[0]?.id ||
            data.citySpots[0]?.id ||
            null
        );
      }, 0);
    </script>
  </body>
</html>`;
}
