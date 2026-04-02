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
  center = [-6.3410, 106.7360], // Default: Universitas Terbuka coordinates [lat, lng]
  zoom = 15,
  className = "",
  showMarker = true,
  markerColor = "#3ECFB2",
}: MapProps) {
  const [lat, lng] = center;
  
  // OpenStreetMap iframe URL
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;

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
