type Spot = {
  id: string;
  name: string;
  coords: [number, number];
  subtitle?: string;
};

type SharedMapConfig = {
  frameId: string;
  routeCoords: [number, number][];
  routeGeometry?: [number, number][];
  mapMode: "route" | "focus" | "all";
  selectedSpotId?: string | null;
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

      .hongkong-marker-shell {
        background: transparent;
        border: 0;
      }

      .hongkong-route-marker {
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

      .hongkong-extra-marker {
        width: 12px;
        height: 12px;
        border-radius: 999px;
        background: #7dd7a9;
        border: 2px solid #dbfff0;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease, border-color 160ms ease;
      }

      .hongkong-city-marker {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #f9dc7b;
        border: 2px solid #fff7db;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease, border-color 160ms ease;
      }

      .hongkong-user-marker {
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: #7ab6ff;
        border: 2px solid #d7f0ff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      }

      .hongkong-route-marker.is-active,
      .hongkong-extra-marker.is-active,
      .hongkong-city-marker.is-active {
        transform: scale(1.14);
        box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.14), 0 10px 24px rgba(0, 0, 0, 0.28);
      }

      .hongkong-route-marker.is-active {
        border-color: #fff8ef;
      }

      .hongkong-extra-marker.is-active {
        border-color: #f2fff8;
      }

      .hongkong-city-marker.is-active {
        border-color: #fffcef;
      }

      .hongkong-route-marker.is-dim,
      .hongkong-extra-marker.is-dim,
      .hongkong-city-marker.is-dim {
        opacity: 0.42;
      }

      @media (max-width: 640px) {
        .hongkong-route-marker {
          width: 20px;
          height: 20px;
          font-size: 8px;
        }

        .hongkong-extra-marker {
          width: 9px;
          height: 9px;
        }

        .hongkong-city-marker {
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
      }).setView(
        (Array.isArray(data.routeGeometry) && data.routeGeometry[0]) ||
          data.routeCoords[0] ||
          [22.28194, 114.15806],
        13
      );
      let userMarker = null;
      let routeLayer = null;
      let currentRouteGeometry = Array.isArray(data.routeGeometry) ? data.routeGeometry : [];

      const tileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      });

      tileLayer.on("load", () => notify({ type: "tilesReady" }));
      tileLayer.addTo(map);

      function makeDivIcon(html, size, anchor) {
        return L.divIcon({
          className: "hongkong-marker-shell",
          html,
          iconSize: size,
          iconAnchor: anchor,
        });
      }

      function clearRouteLayer() {
        if (routeLayer) {
          map.removeLayer(routeLayer);
          routeLayer = null;
        }
      }

      function drawRouteGeometry(coords, options = {}) {
        clearRouteLayer();
        if (!Array.isArray(coords) || coords.length < 2) return;

        routeLayer = L.polyline(
          coords,
          {
            color: options.color || "#ff9d6c",
            weight: options.weight || 5,
            opacity: options.opacity || 0.92,
            dashArray: options.dashArray || null,
            lineJoin: "round",
            lineCap: "round",
          }
        ).addTo(map);

        const bounds = routeLayer.getBounds();
        if (bounds && bounds.isValid && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40] });
        }
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
      window.__setRouteGeometry = function(coords) {
        currentRouteGeometry = Array.isArray(coords) ? coords : [];
        if (currentRouteGeometry.length > 1) {
          drawRouteGeometry(currentRouteGeometry);
        } else {
          clearRouteLayer();
        }
        applyViewport();
      };
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

      if (currentRouteGeometry.length > 1) {
        drawRouteGeometry(currentRouteGeometry);
      }

      data.routeSpots.forEach((spot, index) => {
        const marker = L.marker(spot.coords, {
          icon: makeDivIcon('<div class="hongkong-route-marker">' + (index + 1) + '</div>', [28, 28], [14, 14]),
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
          icon: makeDivIcon('<div class="hongkong-extra-marker"></div>', [14, 14], [7, 7]),
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
          icon: makeDivIcon('<div class="hongkong-city-marker"></div>', [12, 12], [6, 6]),
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
          icon: makeDivIcon('<div class="hongkong-user-marker"></div>', [14, 14], [7, 7]),
        }).addTo(map);
      }

      const visibleCoords = [...data.routeSpots, ...data.extraSpots, ...data.citySpots]
        .filter((spot) => Array.isArray(spot.coords))
        .map((spot) => spot.coords);

      function applyViewport() {
        const routeBounds = currentRouteGeometry.length > 1
          ? currentRouteGeometry
          : data.routeCoords;
        if (routeBounds.length > 1) {
          map.fitBounds(routeBounds, { padding: [40, 40] });
        } else if (visibleCoords.length > 1) {
          map.fitBounds(visibleCoords, { padding: [40, 40] });
        } else {
          const selected = visibleCoords[0] || data.routeCoords[0];
          if (selected) {
            map.setView(selected, 15);
          }
        }
      }

      function syncMapSize() {
        map.invalidateSize();
        setTimeout(() => {
          map.invalidateSize();
          applyViewport();
        }, 240);
      }

      applyViewport();

      setTimeout(() => {
        setActiveSpot(
          data.selectedSpotId ||
            data.routeSpots[0]?.id ||
            data.extraSpots[0]?.id ||
            data.citySpots[0]?.id ||
            null
        );
        syncMapSize();
      }, 0);

      setTimeout(syncMapSize, 400);
      window.addEventListener("resize", syncMapSize);
    </script>
  </body>
</html>`;
}
