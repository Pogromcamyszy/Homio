import db from "../db";

type LatLng = { lat: number; lng: number };

function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  const { lat: x, lng: y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat, yi = polygon[i].lng;
    const xj = polygon[j].lat, yj = polygon[j].lng;
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonFromDb(raw: string): LatLng[] {
  const coords: number[][] = JSON.parse(raw);
  return coords.map((c) => ({ lat: c[1], lng: c[0] }));
}

export function getDistricts(): { name: string }[] {
  return db.prepare("SELECT name FROM districts ORDER BY id").all() as { name: string }[];
}

export function findCityForPoint(lat: number, lng: number): string | null {
  const cities = db.prepare("SELECT name, polygon FROM cities").all() as { name: string; polygon: string }[];
  const point = { lat, lng };
  for (const city of cities) {
    const polygon = polygonFromDb(city.polygon);
    if (isPointInPolygon(point, polygon)) return city.name;
  }
  return null;
}

export function findDistrictForPoint(lat: number, lng: number): string | null {
  const point = { lat, lng };
  const city = findCityForPoint(lat, lng);
  if (!city) return null;
  const cityRow = db.prepare("SELECT id FROM cities WHERE name = ?").get(city) as { id: number };
  const districts = db.prepare("SELECT name, polygon FROM districts WHERE city_id = ?").all(cityRow.id) as { name: string; polygon: string }[];
  for (const d of districts) {
    const polygon = polygonFromDb(d.polygon);
    if (isPointInPolygon(point, polygon)) return d.name;
  }
  return null;
}

export function isPointInDistrict(lat: number, lng: number, districtName: string): boolean {
  const point = { lat, lng };
  const district = db.prepare("SELECT polygon FROM districts WHERE name = ?").get(districtName) as { polygon: string } | undefined;
  if (!district) return false;
  const polygon = polygonFromDb(district.polygon);
  return isPointInPolygon(point, polygon);
}