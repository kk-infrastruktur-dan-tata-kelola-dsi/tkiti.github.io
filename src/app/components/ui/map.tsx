"use client";

import * as React from "react";
import { MapPin } from "lucide-react";

interface MapProps {
  center?: [number, number]; // [latitude, longitude]
  zoom?: number;
  className?: string;
  showMarker?: boolean;
  markerColor?: string;
}

export function Map({
  center = [-0.915475, 100.460229], // Default: Universitas Andalas coordinates [lat, lng]
  zoom = 17,
  className = "",
  showMarker = true,
  markerColor = "#3ECFB2",
}: MapProps) {
  const [lat, lng] = center;

  // OpenStreetMap iframe URL dengan bbox yang lebih kecil untuk zoom lebih dekat
  const bboxSize = zoom >= 17 ? 0.001 : zoom >= 15 ? 0.0035 : 0.007;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - bboxSize},${lat - bboxSize},${lng + bboxSize},${lat + bboxSize}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className={`relative ${className}`}>
      <iframe
        src={mapUrl}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          background: "#070809",
        }}
        title="Map Location"
        loading="lazy"
      />
      
      {/* Custom overlay styling */}
      <style>{`
        iframe {
          filter: invert(0.9) hue-rotate(180deg) brightness(0.9) contrast(1.2);
        }
      `}</style>
    </div>
  );
}
