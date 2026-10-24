import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapPicker = ({ lat, lng, onLocationChange }) => {
    useMapEvents({
        click(e) {
            onLocationChange(e.latlng.lat, e.latlng.lng);
        },
    });

    return lat && lng ? <Marker position={[lat, lng]} /> : null;
};

const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const PropertyMap = ({ position, onLocationChange, isPicker = false, zoom = 15 }) => {
    // Default to Greater Noida (popular for the current context of staysetu) if no position provided
    const defaultPosition = [28.4595, 77.4975];
    const mapPosition = position && position.lat && position.lng
        ? [position.lat, position.lng]
        : defaultPosition;

    return (
        <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0">
            <MapContainer
                center={mapPosition}
                zoom={zoom}
                scrollWheelZoom={!isPicker} // Better UX for viewers
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {isPicker ? (
                    <MapPicker lat={position?.lat} lng={position?.lng} onLocationChange={onLocationChange} />
                ) : (
                    position && position.lat && position.lng && <Marker position={[position.lat, position.lng]} />
                )}
                <MapUpdater center={mapPosition} />
            </MapContainer>

            {isPicker ? (
                <div className="absolute top-3 right-3 z-[1000] bg-white/95 backdrop-blur shadow-premium-sm border border-slate-100 rounded-xl px-4 py-2.5 pointer-events-none">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Interactive Map</p>
                    <p className="text-xs font-bold text-slate-700">Click anywhere to pin location</p>
                </div>
            ) : (
                <div className="absolute bottom-3 right-3 z-[1000]">
                    <a
                        href={`https://www.google.com/maps?q=${position?.lat},${position?.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white/95 backdrop-blur shadow-premium-sm border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                    >
                        Open in Google Maps
                    </a>
                </div>
            )}
        </div>
    );
};

export default PropertyMap;
