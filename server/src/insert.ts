import db from "./db";
import bcrypt from "bcrypt";

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

const users = [
  { username: "adam_kowal", email: "adam.kowal@example.com" },
  { username: "marta_nowak", email: "marta.nowak@example.com" },
  { username: "piotr_wisnia", email: "piotr.wisnia@example.com" },
  { username: "anna_zielinska", email: "anna.zielinska@example.com" },
  { username: "tomasz_krak", email: "tomasz.krak@example.com" },
  { username: "karolina_maj", email: "karolina.maj@example.com" },
  { username: "michal_baran", email: "michal.baran@example.com" },
  { username: "joanna_kwiat", email: "joanna.kwiat@example.com" },
  { username: "rafal_dudek", email: "rafal.dudek@example.com" },
  { username: "agnieszka_wp", email: "agnieszka.wp@example.com" },
  { username: "marcin_kot", email: "marcin.kot@example.com" },
  { username: "ewa_lisowska", email: "ewa.lisowska@example.com" },
  { username: "krzysztof_bb", email: "krzysztof.bb@example.com" },
  { username: "monika_rybak", email: "monika.rybak@example.com" },
  { username: "lukasz_gorski", email: "lukasz.gorski@example.com" },
  { username: "natalia_waz", email: "natalia.waz@example.com" },
  { username: "pawel_strzelec", email: "pawel.strzelec@example.com" },
  { username: "sylwia_dab", email: "sylwia.dab@example.com" },
  { username: "wojtek_step", email: "wojtek.step@example.com" },
  { username: "izabela_kos", email: "izabela.kos@example.com" },
];

const listings = [
  { title: "Przytulne mieszkanie w centrum", district: "Stare Miasto", details: "Dwupokojowe mieszkanie blisko Rynku Głównego. Świeżo po remoncie, umeblowane.", price: 3200, type: "apartment", phone: "600100200", lat: 50.0614, lng: 19.9366, photo_1: photos[0], photo_2: photos[1] },
  { title: "Kawalerka Grzegórzki", district: "Grzegórzki", details: "Urokliwa kawalerka 28m2, blisko Galerii Kazimierz. Idealna dla studenta.", price: 1800, type: "apartment", phone: "601200300", lat: 50.0580, lng: 19.9700, photo_1: photos[2] },
  { title: "Dom na Prądniku Czerwonym", district: "Prądnik Czerwony", details: "Przestronny dom 120m2 z ogrodem. 4 pokoje, garaż, spokojna okolica.", price: 5500, type: "house", phone: "602300400", lat: 50.0900, lng: 19.9600, photo_1: photos[3], photo_2: photos[4] },
  { title: "Mieszkanie Prądnik Biały", district: "Prądnik Biały", details: "Trzypokojowe mieszkanie 65m2. Blisko parku, dobre połączenia komunikacyjne.", price: 2800, type: "apartment", phone: "603400500", lat: 50.1000, lng: 19.9100, photo_1: photos[5] },
  { title: "Kawalerka Krowodrza", district: "Krowodrza", details: "Nowoczesna kawalerka 32m2 po generalnym remoncie. Wysoki standard.", price: 2000, type: "apartment", phone: "604500600", lat: 50.0550, lng: 19.9000, photo_1: photos[6], photo_2: photos[7] },
  { title: "Mieszkanie Bronowice", district: "Bronowice", details: "Rodzinne mieszkanie 80m2, 4 pokoje. Cicha okolica, duży balkon.", price: 3500, type: "apartment", phone: "605600700", lat: 50.0500, lng: 19.8500, photo_1: photos[8] },
  { title: "Dom Zwierzyniec", district: "Zwierzyniec", details: "Stylowy dom w zielonej okolicy. Blisko Lasu Wolskiego, 3 sypialnie.", price: 6000, type: "house", phone: "606700800", lat: 50.0320, lng: 19.8400, photo_1: photos[9], photo_2: photos[10] },
  { title: "Apartament Dębniki", district: "Dębniki", details: "Luksusowy apartament z widokiem na Wisłę. 2 pokoje, podziemny parking.", price: 4200, type: "apartment", phone: "607800900", lat: 50.0200, lng: 19.8500, photo_1: photos[11] },
  { title: "Mieszkanie Łagiewniki", district: "Łagiewniki-Borek Fałęcki", details: "Spokojne mieszkanie 55m2 blisko Sanktuarium. 3 pokoje, piwnica.", price: 2400, type: "apartment", phone: "608900100", lat: 50.0100, lng: 19.9100, photo_1: photos[12], photo_2: photos[13] },
  { title: "Dom Swoszowice", district: "Swoszowice", details: "Duży dom z ogrodem 200m2 działki. 5 pokoi, idealne dla rodziny.", price: 4800, type: "house", phone: "609000200", lat: 49.9700, lng: 19.9400, photo_1: photos[0] },
  { title: "Kawalerka Podgórze Duchackie", district: "Podgórze Duchackie", details: "Nowoczesna kawalerka 30m2. Nowe budownictwo, winda, balkon.", price: 1900, type: "apartment", phone: "610100300", lat: 49.9750, lng: 19.9600, photo_1: photos[1], photo_2: photos[2] },
  { title: "Mieszkanie Bieżanów", district: "Biezanow-Prokocim", details: "Przestronne mieszkanie 70m2. 3 pokoje, dobre połączenia autobusowe.", price: 2600, type: "apartment", phone: "611200400", lat: 50.0100, lng: 20.0100, photo_1: photos[3] },
  { title: "Apartament Podgórze", district: "Podgórze", details: "Klimatyczny apartament w starej kamienicy. 2 pokoje, wysoki parter.", price: 3100, type: "apartment", phone: "612300500", lat: 50.0400, lng: 19.9400, photo_1: photos[4], photo_2: photos[5] },
  { title: "Mieszkanie Czyżyny", district: "Czyżyny", details: "Funkcjonalne mieszkanie 60m2 blisko centrum handlowego. 3 pokoje.", price: 2700, type: "apartment", phone: "613400600", lat: 50.0600, lng: 20.0100, photo_1: photos[6] },
  { title: "Dom Mistrzejowice", district: "Mistrzejowice", details: "Parterowy dom z pięknym ogrodem. 4 pokoje, garaż dwustanowiskowy.", price: 5200, type: "house", phone: "614500700", lat: 50.0850, lng: 20.0100, photo_1: photos[7], photo_2: photos[8] },
  { title: "Kawalerka Bieńczyce", district: "Bieńczyce", details: "Tania kawalerka 25m2 dla studenta lub singla. Blisko uczelni.", price: 1600, type: "apartment", phone: "615600800", lat: 50.0800, lng: 20.0500, photo_1: photos[9] },
  { title: "Mieszkanie Wzgórza Krzeszławickie", district: "Wzgórza Krzeszławickie", details: "Mieszkanie z panoramicznym widokiem. 3 pokoje, loggia, piwnica.", price: 3000, type: "apartment", phone: "616700900", lat: 50.0500, lng: 20.0500, photo_1: photos[10], photo_2: photos[11] },
  { title: "Dom Nowa Huta", district: "Nowa Huta", details: "Solidny dom w stylu modernistycznym. 5 pokoi, duże podwórko.", price: 4500, type: "house", phone: "617800100", lat: 50.0800, lng: 20.0800, photo_1: photos[12] },
  { title: "Mieszkanie Stare Miasto premium", district: "Stare Miasto", details: "Ekskluzywne mieszkanie w sercu Krakowa. 3 pokoje, taras z widokiem.", price: 5800, type: "apartment", phone: "618900200", lat: 50.0620, lng: 19.9380, photo_1: photos[13], photo_2: photos[0] },
  { title: "Kawalerka Kazimierz", district: "Grzegórzki", details: "Klimatyczna kawalerka na Kazimierzu. Idealna na wynajem krótkoterminowy.", price: 2200, type: "apartment", phone: "619000300", lat: 50.0510, lng: 19.9480, photo_1: photos[1] },
  { title: "Dom Krowodrza z garażem", district: "Krowodrza", details: "Nowoczesny dom szeregowy 110m2. 4 pokoje, ogród, garaż.", price: 5000, type: "house", phone: "620100400", lat: 50.0700, lng: 19.9100, photo_1: photos[2], photo_2: photos[3] },
  { title: "Mieszkanie Dębniki riverside", district: "Dębniki", details: "Mieszkanie z widokiem na Wisłę i Wawel. 2 pokoje, balkon.", price: 3800, type: "apartment", phone: "621200500", lat: 50.0480, lng: 19.9200, photo_1: photos[4] },
  { title: "Pokój Prądnik Czerwony", district: "Prądnik Czerwony", details: "Pokój do wynajęcia w dużym mieszkaniu. Współdzielona kuchnia i łazienka.", price: 900, type: "room", phone: "622300600", lat: 50.0850, lng: 19.9500, photo_1: photos[5], photo_2: photos[6] },
  { title: "Kawalerka Podgórze", district: "Podgórze", details: "Przytulna kawalerka 27m2 w odremontowanej kamienicy. Piwnica w cenie.", price: 1750, type: "apartment", phone: "623400700", lat: 50.0350, lng: 19.9300, photo_1: photos[7] },
  { title: "Dom Bronowice Wielkie", district: "Bronowice", details: "Wolnostojący dom 150m2 z dużą działką. Idealne dla rodziny z dziećmi.", price: 6500, type: "house", phone: "624500800", lat: 50.0600, lng: 19.8600, photo_1: photos[8], photo_2: photos[9] },
];

const superUserListings = [
  { title: "Luksusowy penthouse Stare Miasto", district: "Stare Miasto", details: "Wyjątkowy penthouse z tarasem i widokiem na Wawel. 4 pokoje, 120m2.", price: 8000, type: "apartment", phone: "700000001", lat: 50.0610, lng: 19.9370, photo_1: photos[0], photo_2: photos[1] },
  { title: "Mieszkanie z Wawelem w tle", district: "Dębniki", details: "Piękne mieszkanie z widokiem na Wawel. 3 pokoje, balkon, parking.", price: 4500, type: "apartment", phone: "700000002", lat: 50.0490, lng: 19.9250, photo_1: photos[2], photo_2: photos[3] },
  { title: "Dom z basenem Zwierzyniec", district: "Zwierzyniec", details: "Ekskluzywny dom z basenem i ogrodem. 6 pokoi, sauna, garaż.", price: 12000, type: "house", phone: "700000003", lat: 50.0330, lng: 19.8450, photo_1: photos[4], photo_2: photos[5] },
  { title: "Apartament Kazimierz premium", district: "Grzegórzki", details: "Nowoczesny apartament w sercu Kazimierza. 2 pokoje, klimatyzacja.", price: 3600, type: "apartment", phone: "700000004", lat: 50.0520, lng: 19.9460, photo_1: photos[6], photo_2: photos[7] },
  { title: "Rezydencja Krowodrza", district: "Krowodrza", details: "Okazała rezydencja 200m2 w spokojnej okolicy. 5 sypialni, ogród.", price: 9500, type: "house", phone: "700000005", lat: 50.0680, lng: 19.9050, photo_1: photos[8], photo_2: photos[9] },
  { title: "Mieszkanie inwestycyjne Czyżyny", district: "Czyżyny", details: "Idealne pod wynajem. 2 pokoje, nowe budownictwo, wysoki standard.", price: 3200, type: "apartment", phone: "700000006", lat: 50.0620, lng: 20.0050, photo_1: photos[10], photo_2: photos[11] },
  { title: "Dom szeregowy Mistrzejowice", district: "Mistrzejowice", details: "Nowy dom szeregowy 130m2. 4 pokoje, ogródek, 2 łazienki.", price: 5800, type: "house", phone: "700000007", lat: 50.0830, lng: 20.0050, photo_1: photos[12], photo_2: photos[13] },
  { title: "Kawalerka inwestycyjna Podgórze", district: "Podgórze", details: "Kawalerka 28m2 w dobrej lokalizacji. Świetna stopa zwrotu z wynajmu.", price: 2100, type: "apartment", phone: "700000008", lat: 50.0380, lng: 19.9350, photo_1: photos[0], photo_2: photos[2] },
  { title: "Loft Prądnik Czerwony", district: "Prądnik Czerwony", details: "Nowoczesny loft 75m2 w pofabrycznym budynku. Antresola, duże okna.", price: 3900, type: "apartment", phone: "700000009", lat: 50.0880, lng: 19.9550, photo_1: photos[3], photo_2: photos[4] },
  { title: "Willa Nowa Huta", district: "Nowa Huta", details: "Przestronna willa z lat 60. po gruntownym remoncie. 7 pokoi, duży ogród.", price: 7500, type: "house", phone: "700000010", lat: 50.0820, lng: 20.0750, photo_1: photos[5], photo_2: photos[6] },
];

async function seed() {
  const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get("adam_kowal");
  if (existingUser) {
    console.log("Dane już istnieją, pomijam seed.");
    return;
  }

  const hash = await bcrypt.hash("Test1234", 10);
  const insertUser = db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");

  const userIds: number[] = [];
  for (const u of users) {
    const result = insertUser.run(u.username, u.email, hash);
    userIds.push(result.lastInsertRowid as number);
  }

  const superResult = insertUser.run("jan_deweloper", "jan.deweloper@example.com", hash);
  const superUserId = superResult.lastInsertRowid as number;

  const insertListing = db.prepare(`
    INSERT INTO listings
    (title, district, details, price, type, owner_id, phone, lat, lng, accepted, photo_1, photo_2)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  listings.forEach((l, i) => {
    const ownerId = userIds[i % userIds.length];
    insertListing.run(
      l.title, l.district, l.details, l.price, l.type,
      ownerId, l.phone, l.lat, l.lng, l.photo_1, l.photo_2 || null
    );
  });

  for (const l of superUserListings) {
    insertListing.run(
      l.title, l.district, l.details, l.price, l.type,
      superUserId, l.phone, l.lat, l.lng, l.photo_1, l.photo_2 || null
    );
  }

  // ustaw admina
  db.prepare("UPDATE users SET role = 'admin' WHERE username = 'jan_deweloper'").run();

  console.log(`Dodano ${users.length + 1} użytkowników i ${listings.length + superUserListings.length} ogłoszeń.`);
}

seed().catch(console.error);