import db from "./db";
import { findDistrictForPoint } from "./utils/districts";

const photos = [
  "1769168399869-200091427.jpg",
  "1769168477972-798773588.jpg",
  "1769168780089-458461975.jpg",
  "1780339444750-210966004.jpg",
  "1780339444750-463404419.jpg",
  "1780339748950-12076648.jpg",
  "1780858739506-140764073.jpg",
  "1780858739507-597424568.jpg",
  "1780858739507-777866421.jpg",
  "1780860006186-700596254.jpg",
  "1780860006187-869140888.jpg",
  "1781035752640-381221881.jpg",
  "1781035752640-857140958.jpg",
  "1781035752641-727920652.jpg",
];

const listings = [
  { title: "Przytulny pokój w centrum",         lat: 50.0614, lng: 19.9372, price: 1800, type: "room" },
  { title: "Mieszkanie Stare Miasto",            lat: 50.0620, lng: 19.9380, price: 3200, type: "apartment" },
  { title: "Pokój Grzegórzki",                  lat: 50.0570, lng: 19.9650, price: 1500, type: "room" },
  { title: "Mieszkanie Grzegórzki",             lat: 50.0580, lng: 19.9700, price: 2800, type: "apartment" },
  { title: "Pokój Prądnik Czerwony",            lat: 50.0850, lng: 19.9800, price: 1400, type: "room" },
  { title: "Mieszkanie Prądnik Czerwony",       lat: 50.0900, lng: 19.9900, price: 2600, type: "apartment" },
  { title: "Pokój Prądnik Biały",               lat: 50.0950, lng: 19.9200, price: 1350, type: "room" },
  { title: "Mieszkanie Prądnik Biały",          lat: 50.1000, lng: 19.9300, price: 2500, type: "apartment" },
  { title: "Pokój Krowodrza",                   lat: 50.0750, lng: 19.9150, price: 1450, type: "room" },
  { title: "Mieszkanie Krowodrza",              lat: 50.0800, lng: 19.9200, price: 2700, type: "apartment" },
  { title: "Pokój Bronowice",                   lat: 50.0850, lng: 19.8800, price: 1300, type: "room" },
  { title: "Mieszkanie Bronowice",              lat: 50.0900, lng: 19.8900, price: 2400, type: "apartment" },
  { title: "Pokój Zwierzyniec",                 lat: 50.0550, lng: 19.8950, price: 1600, type: "room" },
  { title: "Mieszkanie Zwierzyniec",            lat: 50.0600, lng: 19.9000, price: 2900, type: "apartment" },
  { title: "Pokój Dębniki",                     lat: 50.0350, lng: 19.9200, price: 1400, type: "room" },
  { title: "Mieszkanie Dębniki",                lat: 50.0400, lng: 19.9100, price: 2600, type: "apartment" },
  { title: "Pokój Łagiewniki",                  lat: 50.0050, lng: 19.9300, price: 1200, type: "room" },
  { title: "Mieszkanie Łagiewniki",             lat: 50.0100, lng: 19.9400, price: 2200, type: "apartment" },
  { title: "Pokój Swoszowice",                  lat: 49.9750, lng: 19.9300, price: 1100, type: "room" },
  { title: "Mieszkanie Swoszowice",             lat: 49.9800, lng: 19.9400, price: 2000, type: "apartment" },
  { title: "Pokój Podgórze Duchackie",          lat: 50.0050, lng: 19.9800, price: 1300, type: "room" },
  { title: "Mieszkanie Podgórze Duchackie",     lat: 50.0100, lng: 19.9900, price: 2300, type: "apartment" },
  { title: "Pokój Bieżanów-Prokocim",           lat: 49.9900, lng: 20.0300, price: 1200, type: "room" },
  { title: "Mieszkanie Bieżanów-Prokocim",      lat: 50.0000, lng: 20.0400, price: 2100, type: "apartment" },
  { title: "Pokój Podgórze",                    lat: 50.0400, lng: 19.9700, price: 1400, type: "room" },
  { title: "Mieszkanie Podgórze",               lat: 50.0450, lng: 19.9800, price: 2500, type: "apartment" },
  { title: "Pokój Czyżyny",                     lat: 50.0750, lng: 20.0450, price: 1350, type: "room" },
  { title: "Mieszkanie Czyżyny",                lat: 50.0800, lng: 20.0500, price: 2400, type: "apartment" },
  { title: "Pokój Mistrzejowice",               lat: 50.1000, lng: 20.0400, price: 1300, type: "room" },
  { title: "Mieszkanie Mistrzejowice",          lat: 50.1050, lng: 20.0500, price: 2300, type: "apartment" },
  { title: "Pokój Bieńczyce",                   lat: 50.0850, lng: 20.0800, price: 1250, type: "room" },
  { title: "Mieszkanie Bieńczyce",              lat: 50.0900, lng: 20.0900, price: 2200, type: "apartment" },
  { title: "Pokój Wzgórza Krzesławickie",       lat: 50.1000, lng: 20.1000, price: 1200, type: "room" },
  { title: "Mieszkanie Wzgórza Krzesławickie",  lat: 50.1050, lng: 20.1100, price: 2100, type: "apartment" },
  { title: "Pokój Nowa Huta",                   lat: 50.0800, lng: 20.1200, price: 1100, type: "room" },
  { title: "Mieszkanie Nowa Huta",              lat: 50.0900, lng: 20.1300, price: 2000, type: "apartment" },
];

const ownerIds = [1, 2, 3, 4, 5, 6];
const phones = [
  "123 456 789", "987 654 321", "555 444 333",
  "111 222 333", "666 777 888", "999 000 111",
];

const stmt = db.prepare(`
  INSERT INTO listings
  (title, district, details, price, type, owner_id, phone, photo_1, photo_2, photo_3, lat, lng)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let inserted = 0;
let skipped = 0;

for (let i = 0; i < listings.length; i++) {
  const l = listings[i];
  const district = findDistrictForPoint(l.lat, l.lng);

  if (!district) {
    console.log(`[POMINIĘTO] "${l.title}" — współrzędne poza Krakowem`);
    skipped++;
    continue;
  }

  const p1 = photos[i % photos.length];
  const p2 = photos[(i + 1) % photos.length];
  const p3 = photos[(i + 2) % photos.length];

  stmt.run(
    l.title,
    district,
    `Opis ogłoszenia: ${l.title}. Zapraszamy do kontaktu.`,
    l.price,
    l.type,
    ownerIds[i % ownerIds.length],
    phones[i % phones.length],
    p1, p2, p3,
    l.lat, l.lng
  );

  console.log(`[OK] "${l.title}" → ${district}`);
  inserted++;
}

console.log(`\nGotowe: dodano ${inserted}, pominięto ${skipped}.`);