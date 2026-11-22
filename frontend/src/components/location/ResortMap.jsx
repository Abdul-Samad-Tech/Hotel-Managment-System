import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const pin = L.divIcon({
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  html: '<span style="display:block;width:18px;height:18px;border-radius:999px;background:#F2C078;border:2px solid #0B1F33;box-shadow:0 0 0 6px rgba(242,192,120,0.45)"></span>',
});

export function ResortMap({ lat, lng, label }) {
  return (
    <MapContainer center={[lat, lng]} zoom={11} scrollWheelZoom={false} className="bay-map">
      <TileLayer
        attribution="&copy; OpenStreetMap &copy; CARTO"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <Marker position={[lat, lng]} icon={pin}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  );
}
