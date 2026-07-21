"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  MapPin, 
  Search, 
  Navigation, 
  Phone, 
  Star, 
  Clock, 
  Globe, 
  RefreshCw, 
  AlertTriangle, 
  Info,
  Sliders,
  ExternalLink,
  ShieldCheck,
  X
} from "lucide-react";

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  address: string;
  distance: number; // in km
  rating?: number;
  phone?: string;
  openStatus?: string;
  website?: string;
  lat: number;
  lng: number;
  type: "psychiatrist" | "psychologist" | "hospital" | "counseling" | "clinic";
}

interface NearbyProfessionalsProps {
  severity: string; // e.g. "Minimal", "Mild", "Moderate", "Moderately Severe", "Severe"
}

// Google Maps TypeScript interfaces to eliminate explicit "any"
interface GoogleMapsLatLng {
  lat: () => number;
  lng: () => number;
}
interface GooglePlaceResult {
  place_id?: string;
  name?: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  geometry?: {
    location?: GoogleMapsLatLng;
  };
  opening_hours?: {
    open_now?: boolean;
  };
}
interface GoogleMapsPlacesService {
  nearbySearch: (
    request: { location: unknown; radius: number; keyword: string },
    callback: (results: GooglePlaceResult[] | null, status: unknown) => void
  ) => void;
}
interface GoogleMarker {
  addListener: (event: string, callback: () => void) => void;
}
interface GoogleMaps {
  LatLng: new (lat: number, lng: number) => unknown;
  Map: new (el: HTMLElement, options: unknown) => unknown;
  Marker: new (options: unknown) => GoogleMarker;
  InfoWindow: new (options: unknown) => { open: (map: unknown, marker: unknown) => void };
  places: {
    PlacesService: new (div: HTMLElement) => GoogleMapsPlacesService;
    PlacesServiceStatus: { OK: unknown };
  };
}
interface WindowWithGoogle extends Window {
  google?: {
    maps?: GoogleMaps;
  };
}

// Haversine distance calculator
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NearbyProfessionals({ severity }: NearbyProfessionalsProps) {
  const isSevere = severity.toLowerCase().includes("severe") && !severity.toLowerCase().includes("moderately");
  const isMinimal = severity.toLowerCase().includes("minimal");

  const [activeTab, setActiveTab] = useState<"list" | "map">("list");
  const [useGPS, setUseGPS] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [radius, setRadius] = useState<number>(10); // Default 10 km
  const [filter, setFilter] = useState<string>("all");
  
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!isMinimal); // Starts collapsed for minimal severity

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  // Reference for session caching: Cache key is lat_lng_radius
  const cacheRef = useRef<{ [key: string]: Provider[] }>({});
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const leafletLoadedRef = useRef(false);

  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Personalized Recommendation Message
  const getRecommendationMessage = () => {
    const sev = severity.toLowerCase();
    if (sev.includes("minimal")) {
      return "Your assessment indicates minimal symptoms. Professional consultation is optional, but support is always available if you need it.";
    }
    if (sev.includes("moderately severe")) {
      return "We strongly recommend scheduling an appointment with a licensed psychiatrist or psychologist.";
    }
    if (sev.includes("severe")) {
      return "Your assessment suggests significant symptoms. Please seek professional medical assistance as soon as possible.";
    }
    if (sev.includes("moderate")) {
      return "Based on your assessment, consulting a mental health professional is recommended.";
    }
    return "If your symptoms continue or worsen, consider speaking with a qualified mental health professional.";
  };

  // Severity-based Professional Type Priority mapping
  const getPriorityOrder = useCallback((): ("psychiatrist" | "psychologist" | "hospital" | "counseling" | "clinic")[] => {
    const sev = severity.toLowerCase();
    if (sev.includes("minimal") || sev.includes("mild")) {
      return ["counseling", "psychologist", "clinic"];
    }
    if (sev.includes("moderately severe")) {
      return ["psychiatrist", "psychologist", "hospital"];
    }
    if (sev.includes("severe")) {
      return ["hospital", "psychiatrist", "clinic"];
    }
    // Moderate
    return ["psychologist", "psychiatrist", "clinic", "counseling"];
  }, [severity]);

  const trackAnalytics = useCallback((event: string, meta?: Record<string, unknown>) => {
    // Privacy-safe anonymous analytics helper
    console.log(`[Analytics-Log] Event: ${event}`, meta || {});
  }, []);

  const getCurrentLocation = useCallback(() => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Browser geolocation is not supported. Please search manually.");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        trackAnalytics("location_permission_granted");
      },
      (err) => {
        console.error(err);
        if (err.code === err.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setUseGPS(false);
          trackAnalytics("location_permission_denied");
        } else {
          setError("GPS signal unavailable. Please select 'Search Another Location'.");
        }
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [trackAnalytics]);

  // Resolves manual query via OSM Geocoding Nominatim
  const handleManualSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      trackAnalytics("provider_search_performed", { query: searchQuery });
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
        }
      });
      const data = await res.json() as { lat: string; lon: string }[];

      if (data && data.length > 0) {
        setLat(parseFloat(data[0].lat));
        setLng(parseFloat(data[0].lon));
      } else {
        setError("Could not resolve location. Please try a different query.");
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError("Network error resolving location. Please check your connectivity.");
      setLoading(false);
    }
  };

  // Google Places API fetch implementation using PlacesService
  const fetchFromGoogle = useCallback(async (centerLat: number, centerLng: number, radiusKm: number): Promise<Provider[]> => {
    const queryGooglePlaces = (
      cLat: number,
      cLng: number,
      rKm: number,
      resolveFn: (res: Provider[]) => void,
      rejectFn: (err: Error) => void
    ) => {
      try {
        const dummyDiv = document.createElement("div");
        const win = window as unknown as WindowWithGoogle;
        if (!win.google?.maps) throw new Error("Google Maps is not loaded");
        const service = new win.google.maps.places.PlacesService(dummyDiv);
        const pythagoreanLatLng = new win.google.maps.LatLng(cLat, cLng);
        
        const keywords = ["psychiatrist", "psychologist", "mental health clinic", "counseling center", "psychiatric hospital"];
        const allResults: Provider[] = [];
        let queriesFinished = 0;
  
        keywords.forEach((keyword) => {
          const req = {
            location: pythagoreanLatLng,
            radius: rKm * 1000,
            keyword: keyword,
          };
  
          service.nearbySearch(req, (results, status) => {
            queriesFinished++;
  
            const maps = win.google?.maps;
            if (maps && status === maps.places.PlacesServiceStatus.OK && results) {
              results.forEach((place) => {
                // Avoid duplicates
                if (allResults.some((p) => p.id === place.place_id)) return;
                if (!place.place_id || !place.geometry?.location) return;
  
                const plat = place.geometry.location.lat();
                const plng = place.geometry.location.lng();
                const dist = calculateDistance(cLat, cLng, plat, plng);
  
                // Map specialty type
                let type: Provider["type"] = "clinic";
                let specialty = "Mental Health Center";
  
                const kw = keyword.toLowerCase();
                if (kw.includes("psychiatrist") || kw.includes("psychiatric")) {
                  type = "psychiatrist";
                  specialty = "Psychiatrist";
                } else if (kw.includes("psychologist")) {
                  type = "psychologist";
                  specialty = "Clinical Psychologist";
                } else if (kw.includes("counseling")) {
                  type = "counseling";
                  specialty = "Counseling Center";
                } else if (kw.includes("hospital")) {
                  type = "hospital";
                  specialty = "Psychiatric Hospital";
                }
  
                allResults.push({
                  id: place.place_id,
                  name: place.name || "Mental Health Professional",
                  specialty: specialty,
                  address: place.vicinity || place.formatted_address || "Address unavailable",
                  distance: parseFloat(dist.toFixed(1)),
                  rating: place.rating,
                  openStatus: place.opening_hours?.open_now ? "Open Now" : place.opening_hours ? "Closed" : undefined,
                  lat: plat,
                  lng: plng,
                  type: type,
                });
              });
            }
  
            if (queriesFinished === keywords.length) {
              resolveFn(allResults);
            }
          });
        });
      } catch (e) {
        rejectFn(e instanceof Error ? e : new Error("Google search failed"));
      }
    };

    return new Promise((resolve, reject) => {
      const win = window as unknown as WindowWithGoogle;
      // Dynamically load Google Maps script
      if (!win.google?.maps?.places) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places`;
        script.async = true;
        script.onload = () => {
          queryGooglePlaces(centerLat, centerLng, radiusKm, resolve, reject);
        };
        script.onerror = () => reject(new Error("Failed to load Google Maps SDK."));
        document.head.appendChild(script);
      } else {
        queryGooglePlaces(centerLat, centerLng, radiusKm, resolve, reject);
      }
    });
  }, [googleMapsKey]);

  // OpenStreetMap Overpass API fetch implementation
  const fetchFromOSM = useCallback(async (centerLat: number, centerLng: number, radiusKm: number): Promise<Provider[]> => {
    const radiusMeters = radiusKm * 1000;
    const overpassQuery = `
      [out:json][timeout:15];
      (
        node(around:${radiusMeters},${centerLat},${centerLng})["healthcare"="psychiatrist"];
        node(around:${radiusMeters},${centerLat},${centerLng})["healthcare"="psychotherapist"];
        node(around:${radiusMeters},${centerLat},${centerLng})["healthcare"="psychologist"];
        node(around:${radiusMeters},${centerLat},${centerLng})["amenity"="clinic"];
        node(around:${radiusMeters},${centerLat},${centerLng})["amenity"="hospital"];
        node(around:${radiusMeters},${centerLat},${centerLng})["social_facility"="counseling"];
        way(around:${radiusMeters},${centerLat},${centerLng})["healthcare"="psychiatrist"];
        way(around:${radiusMeters},${centerLat},${centerLng})["healthcare"="psychotherapist"];
        way(around:${radiusMeters},${centerLat},${centerLng})["healthcare"="psychologist"];
        way(around:${radiusMeters},${centerLat},${centerLng})["amenity"="clinic"];
        way(around:${radiusMeters},${centerLat},${centerLng})["amenity"="hospital"];
        way(around:${radiusMeters},${centerLat},${centerLng})["social_facility"="counseling"];
      );
      out body center;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;
    const response = await fetch(url);
    const data = await response.json() as {
      elements: {
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }[];
    };

    if (!data || !data.elements) return [];

    return data.elements.map((element) => {
      const tags = element.tags || {};
      const elat = element.center ? element.center.lat : (element.lat || centerLat);
      const elng = element.center ? element.center.lon : (element.lon || centerLng);
      const dist = calculateDistance(centerLat, centerLng, elat, elng);

      let specialty = "Mental Health Center";
      let type: Provider["type"] = "clinic";

      if (tags.healthcare === "psychiatrist") {
        specialty = "Psychiatrist";
        type = "psychiatrist";
      } else if (tags.healthcare === "psychotherapist" || tags.healthcare === "psychologist") {
        specialty = "Clinical Psychologist / Psychotherapist";
        type = "psychologist";
      } else if (tags.amenity === "hospital") {
        specialty = "Hospital (Psychiatric Dept.)";
        type = "hospital";
      } else if (tags.social_facility === "counseling") {
        specialty = "Counseling Center";
        type = "counseling";
      } else if (tags.amenity === "clinic") {
        specialty = "Mental Health Clinic";
        type = "clinic";
      }

      // Reconstruct street address
      let address = tags["addr:full"];
      if (!address) {
        const street = tags["addr:street"] || "";
        const house = tags["addr:housenumber"] || "";
        const city = tags["addr:city"] || "";
        address = [house, street, city].filter(Boolean).join(", ") || "Address near coordinates";
      }

      return {
        id: String(element.id),
        name: tags.name || `${specialty} Professional`,
        specialty: specialty,
        address: address,
        distance: parseFloat(dist.toFixed(1)),
        phone: tags.phone || tags["contact:phone"] || undefined,
        openStatus: tags.opening_hours ? "Open Details" : undefined,
        website: tags.website || tags["contact:website"] || undefined,
        lat: elat,
        lng: elng,
        type: type,
      };
    });
  }, []);

  const loadProviders = useCallback(async () => {
    if (lat === null || lng === null) return;
    setLoading(true);
    setError(null);

    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}_${radius}`;
    if (cacheRef.current[cacheKey]) {
      setProviders(cacheRef.current[cacheKey]);
      setLoading(false);
      return;
    }

    try {
      let results: Provider[] = [];
      
      // If Google Maps Key is active, load via Google
      if (googleMapsKey) {
        results = await fetchFromGoogle(lat, lng, radius);
      } else {
        // Fallback to OSM Overpass
        results = await fetchFromOSM(lat, lng, radius);
      }

      // Sort by Severity-based Priority group first, and closest distance second
      const priorityOrder = getPriorityOrder();
      const sorted = [...results].sort((a, b) => {
        const priorityA = priorityOrder.indexOf(a.type);
        const priorityB = priorityOrder.indexOf(b.type);
        
        // Items with higher priority (closer to index 0) go first
        const scoreA = priorityA !== -1 ? priorityA : 999;
        const scoreB = priorityB !== -1 ? priorityB : 999;

        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
        return a.distance - b.distance;
      });

      cacheRef.current[cacheKey] = sorted;
      setProviders(sorted);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch nearby professionals. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius, googleMapsKey, fetchFromGoogle, fetchFromOSM, getPriorityOrder]);

  // Client-side filtering
  const filteredProviders = providers.filter((prov) => {
    if (filter === "all") return true;
    if (filter === "psychiatrist") return prov.type === "psychiatrist";
    if (filter === "psychologist") return prov.type === "psychologist";
    if (filter === "hospital") return prov.type === "hospital";
    if (filter === "counseling") return prov.type === "counseling";
    return true;
  });

  // Instantiates Leaflet + OSM tiles or Google Maps Frame
  const initializeMap = useCallback(async () => {
    if (!mapContainerRef.current || lat === null || lng === null) return;

    // Destroy existing map
    const instance = mapInstanceRef.current as { remove?: () => void } | null;
    if (instance && typeof instance.remove === "function") {
      instance.remove();
      mapInstanceRef.current = null;
    }

    const win = window as unknown as WindowWithGoogle;
    const maps = win.google?.maps;
    if (googleMapsKey && maps) {
      const mapOptions = {
        center: { lat, lng },
        zoom: 13,
        mapId: "DEMO_MAP_ID",
      };
      
      const map = new maps.Map(mapContainerRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Add center marker
      new maps.Marker({
        position: { lat, lng },
        map: map,
        title: "Your Location",
        icon: {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        }
      });

      // Add provider markers
      filteredProviders.forEach((prov) => {
        const marker = new maps.Marker({
          position: { lat: prov.lat, lng: prov.lng },
          map: map,
          title: prov.name,
        });

        const infowindow = new maps.InfoWindow({
          content: `
            <div style="color: black; padding: 4px;">
              <h4 style="font-weight: bold; margin-bottom: 2px;">${prov.name}</h4>
              <p style="font-size: 11px; color: #555; margin-bottom: 4px;">${prov.specialty}</p>
              <p style="font-size: 11px; margin-bottom: 4px;">Distance: ${prov.distance} km</p>
              <a href="https://www.google.com/maps/search/?api=1&query=${prov.lat},${prov.lng}" target="_blank" style="font-size: 11px; font-weight: bold; color: #4f46e5; text-decoration: underline;">Navigate</a>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infowindow.open(map, marker);
        });
      });
    } else {
      // Leaflet + OSM tiles fallback
      if (!leafletLoadedRef.current) {
        // Load CSS stylesheet
        if (!document.getElementById("leaflet-css")) {
          const link = document.createElement("link");
          link.id = "leaflet-css";
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }
        leafletLoadedRef.current = true;
      }

      // Dynamic import of Leaflet client-only
      const L = await import("leaflet");

      const map = L.map(mapContainerRef.current).setView([lat, lng], 13);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Custom Icon configuration
      const blueIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      const redIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      // User location marker
      L.marker([lat, lng], { icon: blueIcon }).addTo(map).bindPopup("<b>Your Location</b>").openPopup();

      // Provider markers
      filteredProviders.forEach((prov) => {
        const popupContent = `
          <div style="color: black; min-width: 140px;">
            <h4 style="font-weight: bold; margin: 0 0 2px 0; font-size: 13px;">${prov.name}</h4>
            <p style="font-size: 11px; color: #666; margin: 0 0 4px 0;">${prov.specialty}</p>
            <p style="font-size: 11px; margin: 0 0 4px 0;">Distance: <b>${prov.distance} km</b></p>
            <a href="https://www.google.com/maps/search/?api=1&query=${prov.lat},${prov.lng}" target="_blank" style="font-size: 11px; color: #4f46e5; text-decoration: underline; font-weight: bold;">Get Directions</a>
          </div>
        `;
        L.marker([prov.lat, prov.lng], { icon: redIcon }).addTo(map).bindPopup(popupContent);
      });
    }
  }, [lat, lng, googleMapsKey, filteredProviders]);

  // Triggers Geolocation or manual lookup
  useEffect(() => {
    if (useGPS && isExpanded) {
      getCurrentLocation();
    }
  }, [useGPS, isExpanded, getCurrentLocation]);

  // Fetches providers when coordinates or radius changes
  useEffect(() => {
    if (lat !== null && lng !== null && isExpanded) {
      loadProviders();
    }
  }, [lat, lng, radius, isExpanded, loadProviders]);

  // Renders map overlays on tab switch or provider load
  useEffect(() => {
    if (activeTab === "map" && lat !== null && lng !== null && providers.length > 0) {
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
    return () => {
      // Destroy map instance if present
      const mapInst = mapInstanceRef.current as { remove?: () => void } | null;
      if (mapInst && typeof mapInst.remove === "function") {
        mapInst.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [activeTab, providers, lat, lng, initializeMap]);

  const handleRefresh = () => {
    if (lat !== null && lng !== null) {
      // Clear current key cache
      const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}_${radius}`;
      delete cacheRef.current[cacheKey];
      loadProviders();
    }
  };

  return (
    <div className="space-y-6 pt-6 border-t border-white/5">
      {/* Smart Recommendations Heading Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold tracking-tight text-slate-200 flex items-center space-x-2">
          <MapPin className="h-6 w-6 text-indigo-400" />
          <span>👨‍⚕️ Find Nearby Mental Health Professionals</span>
        </h2>
        
        {isMinimal && !isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 rounded-xl bg-white/5 border border-white/10 px-3 py-1.5 transition-all duration-300"
          >
            Show Nearby Professionals
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* Personalized assessment-based severity notice */}
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-5 text-sm space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity Guidance</span>
            <p className="font-semibold text-indigo-200 leading-relaxed">
              {getRecommendationMessage()}
            </p>
          </div>

          {/* Severe Assessment Emergency Banner */}
          {isSevere && (
            <div className="rounded-2xl border border-red-500/20 bg-red-950/10 p-6 space-y-4">
              <div className="flex items-start space-x-3 text-red-400">
                <AlertTriangle className="h-6 w-6 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">🚨 Immediate Professional Support Recommended</h4>
                  <p className="text-sm leading-relaxed text-red-200/80">
                    Your assessment indicates significant symptoms. Please consider contacting a trusted family member, calling emergency services, or visiting the nearest hospital emergency psychiatric services immediately.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setFilter("hospital");
                    setActiveTab("list");
                    trackAnalytics("filter_selection", { type: "hospital_emergency" });
                  }}
                  className="rounded-xl bg-red-500/20 border border-red-500/30 px-4 py-2 text-xs font-bold text-white hover:bg-red-500/30 transition-all duration-300"
                >
                  Find Nearest Hospital
                </button>
                <button
                  onClick={() => {
                    setFilter("psychiatrist");
                    setActiveTab("list");
                    trackAnalytics("filter_selection", { type: "psychiatrist_emergency" });
                  }}
                  className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all duration-300"
                >
                  View Nearby Psychiatrists
                </button>
                {lat !== null && lng !== null && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=emergency+psychiatric+services&query_place_id=emergency`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackAnalytics("directions_button_clicked", { type: "google_maps_emergency" })}
                    className="inline-flex items-center rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all duration-300"
                  >
                    <span>Search Emergency Psychiatric Services</span>
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Location Controls Panel */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* GPS vs manual search switch */}
              <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-white/5">
                <button
                  onClick={() => {
                    setUseGPS(true);
                    setError(null);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
                    useGPS
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  📍 Use Current Location
                </button>
                <button
                  onClick={() => {
                    setUseGPS(false);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
                    !useGPS
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  🔍 Search Another Location
                </button>
              </div>

              {/* Radius Controls & Refresh */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-slate-400" />
                  <select
                    value={radius}
                    onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={5}>5 km radius</option>
                    <option value={10}>10 km radius</option>
                    <option value={20}>20 km radius</option>
                    <option value={50}>50 km radius</option>
                  </select>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={loading || lat === null}
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-50"
                  aria-label="Refresh Location Results"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Manual input address form */}
            {!useGPS && (
              <form onSubmit={handleManualSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter city, PIN code, landmark, or area (e.g. Ranchi, 834008)"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 pl-10 pr-4 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-all"
                >
                  Locate
                </button>
              </form>
            )}

            {/* Error states */}
            {permissionDenied && (
              <div className="flex flex-col space-y-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-300">
                <p>Location permission was denied. You can still search manually above.</p>
                <div className="pt-2">
                  <a
                    href="https://www.google.com/maps/search/mental+health+professionals"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-xl bg-amber-500/20 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500/30 transition-all duration-300"
                  >
                    Search on Google Maps
                  </a>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center space-x-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Tab Selection (List vs Map) & Filter Chips */}
          {lat !== null && lng !== null && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-3">
                {/* All / Lists filter chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "All" },
                    { id: "psychiatrist", label: "Psychiatrists" },
                    { id: "psychologist", label: "Psychologists" },
                    { id: "hospital", label: "Hospitals" },
                    { id: "counseling", label: "Counselling Centres" },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => {
                        setFilter(chip.id);
                        trackAnalytics("filter_selection", { filter: chip.id });
                      }}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold border transition-all duration-300 ${
                        filter === chip.id
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* List / Map toggle */}
                <div className="flex rounded-xl bg-slate-950 p-1 border border-white/5">
                  <button
                    onClick={() => setActiveTab("list")}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${
                      activeTab === "list" ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setActiveTab("map")}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all duration-300 ${
                      activeTab === "map" ? "bg-white/10 text-white shadow-inner" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Interactive Map
                  </button>
                </div>
              </div>

              {/* Skeletons Loading View */}
              {loading ? (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 font-semibold animate-pulse">
                    Finding nearby mental health professionals...
                  </div>
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="rounded-2xl border border-white/5 bg-slate-900/10 p-6 space-y-3 animate-pulse">
                      <div className="h-4 w-1/3 rounded bg-slate-800" />
                      <div className="h-3 w-1/5 rounded bg-slate-800" />
                      <div className="h-3 w-1/2 rounded bg-slate-800" />
                    </div>
                  ))}
                </div>
              ) : filteredProviders.length === 0 ? (
                /* Better Empty State */
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-8 text-center space-y-4">
                  <Info className="h-8 w-8 text-slate-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-300 text-sm">No nearby professionals found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                      No nearby mental health professionals were found within the selected {radius} km search radius.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    <button
                      onClick={() => setRadius((prev) => (prev < 50 ? prev * 2 : prev))}
                      className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all"
                    >
                      Expand Search Radius
                    </button>
                    <button
                      onClick={() => {
                        setUseGPS(false);
                        setSearchQuery("");
                      }}
                      className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
                    >
                      Search Another Location
                    </button>
                    <a
                      href="https://www.google.com/maps/search/mental+health+professionals"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
                    >
                      Open Google Maps Search
                    </a>
                  </div>
                </div>
              ) : activeTab === "list" ? (
                /* Providers Cards List view */
                <div className="space-y-4">
                  {filteredProviders.map((prov) => (
                    <div
                      key={prov.id}
                      onClick={() => setSelectedProvider(prov)}
                      className="group cursor-pointer rounded-2xl border border-white/10 bg-slate-900/40 p-6 flex flex-col sm:flex-row justify-between items-start gap-4 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-slate-900/60 shadow-lg"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-white text-base group-hover:text-indigo-300 transition-colors">
                            {prov.name}
                          </h4>
                          {prov.rating && (
                            <span className="flex items-center space-x-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              <Star className="h-3 w-3 fill-amber-400 shrink-0" />
                              <span>{prov.rating}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          {prov.specialty}
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed max-w-md">
                          {prov.address}
                        </div>
                        
                        {/* Open Closed Status */}
                        {prov.openStatus && (
                          <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{prov.openStatus}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0">
                        {/* Action buttons */}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${prov.lat},${prov.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            trackAnalytics("directions_button_clicked", { name: prov.name });
                          }}
                          className="flex-1 sm:flex-none justify-center inline-flex items-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all duration-300"
                        >
                          <Navigation className="mr-1.5 h-3.5 w-3.5" />
                          <span>Get Directions</span>
                        </a>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${prov.lat},${prov.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 sm:flex-none justify-center inline-flex items-center rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all duration-300"
                        >
                          <span>View on Maps</span>
                        </a>
                        {prov.phone && (
                          <a
                            href={`tel:${prov.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                            aria-label={`Call ${prov.name}`}
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Map view container */
                <div
                  ref={mapContainerRef}
                  className="w-full h-[250px] md:h-[350px] rounded-2xl border border-white/10 overflow-hidden bg-slate-950 relative z-10"
                />
              )}
            </div>
          )}

          {/* Privacy Notice */}
          <div className="flex items-center space-x-2 rounded-xl bg-white/5 p-3 text-[11px] text-slate-500 border border-white/5">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <p className="leading-relaxed">
              <strong>Privacy Notice:</strong> Your location is processed only within your browser to find nearby professionals. MindCare AI does not store or transmit your GPS location to its backend.
            </p>
          </div>
        </div>
      )}

      {/* Details modal dialog popup */}
      {selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedProvider(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              aria-label="Close details modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Header info */}
            <div className="space-y-1.5 pr-6">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                {selectedProvider.specialty}
              </span>
              <h3 className="text-xl font-extrabold text-white leading-tight">
                {selectedProvider.name}
              </h3>
              {selectedProvider.rating && (
                <div className="flex items-center space-x-1 text-sm font-semibold text-amber-400 pt-1">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span>{selectedProvider.rating} / 5.0 Rating</span>
                </div>
              )}
            </div>

            {/* Card metadata list */}
            <div className="space-y-3.5 border-t border-b border-white/5 py-4 text-sm text-slate-300">
              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Address</div>
                  <div className="leading-relaxed">{selectedProvider.address}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Navigation className="h-5 w-5 text-slate-400 shrink-0" />
                <div className="space-y-0.5">
                  <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Distance</div>
                  <div>{selectedProvider.distance} km from search center</div>
                </div>
              </div>

              {selectedProvider.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Phone</div>
                    <div>{selectedProvider.phone}</div>
                  </div>
                </div>
              )}

              {selectedProvider.website && (
                <div className="flex items-center space-x-3">
                  <Globe className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="space-y-0.5">
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Website</div>
                    <a
                      href={selectedProvider.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center"
                    >
                      <span>Visit site</span>
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedProvider.lat},${selectedProvider.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-xs font-bold text-white hover:bg-indigo-500 transition-all"
              >
                <Navigation className="mr-1.5 h-3.5 w-3.5" />
                <span>Directions</span>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedProvider.lat},${selectedProvider.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all"
              >
                <span>Google Maps</span>
              </a>
              {selectedProvider.phone && (
                <a
                  href={`tel:${selectedProvider.phone}`}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all"
                  aria-label="Call provider"
                >
                  <Phone className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disclaimers & Info Footer */}
      {isExpanded && (
        <div className="text-[10px] sm:text-xs text-slate-500 leading-relaxed pt-2 border-t border-white/5">
          <p>
            <strong>Professional Disclaimer:</strong> Provider information is obtained from third-party mapping services. MindCare AI does not endorse, verify, or rank healthcare professionals. Please independently verify credentials before seeking treatment.
          </p>
        </div>
      )}
    </div>
  );
}
