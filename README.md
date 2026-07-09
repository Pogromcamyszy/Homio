# Homio — Aplikacja do wynajmu mieszkań w Krakowie

Homio to webowa aplikacja do ogłoszeń wynajmu mieszkań, pokoi i domów w Krakowie. Umożliwia dodawanie, przeglądanie i zarządzanie ogłoszeniami z interaktywną mapą Google Maps.

## Technologie

### Frontend
- React 18 + TypeScript
- Vite
- React Router DOM
- Google Maps API (`@react-google-maps/api`)
- React Toastify

### Backend
- Node.js + Express + TypeScript
- SQLite (`better-sqlite3`)
- JWT (`jsonwebtoken`)
- bcrypt
- multer (upload zdjęć)

## Funkcjonalności

### Użytkownik
- Rejestracja i logowanie (JWT, bcrypt)
- Zmiana hasła z wskaźnikiem siły
- Avatar profilu
- Dashboard z ogłoszeniami (aktywne, oczekujące, wynajęte, usunięte)
- System ulubionych (polubień) ogłoszeń
- Publiczny profil użytkownika

### Ogłoszenia
- Dodawanie ogłoszeń z lokalizacją na mapie
- Automatyczne wykrywanie dzielnicy Krakowa (ray casting na poligonach)
- Upload do 5 zdjęć
- Galeria zdjęć ze sliderem
- Filtrowanie i wyszukiwanie (tytuł, opis, dzielnica, cena, typ)
- Paginacja (10 ogłoszeń na stronę)
- Licznik unikalnych wyświetleń (per użytkownik/sesja)
- System lajków

### Administrator
- Panel admina z zarządzaniem ogłoszeniami
- Zatwierdzanie i odrzucanie ogłoszeń
- Przeglądanie usuniętych ogłoszeń i przywracanie
- Zarządzanie użytkownikami (role, banowanie)
- Filtrowanie i wyszukiwanie w panelu

## Struktura projektu

```
Homio/
├── frontend/                  # React + TypeScript
│   ├── src/
│   │   ├── pages/             # Strony aplikacji
│   │   ├── components/        # Komponenty
│   │   ├── api/               # Helper apiFetch
│   │   ├── AuthContext.tsx    # Kontekst autoryzacji
│   │   └── App.tsx            # Router i nawigacja
│   └── vite.config.ts
│
└── server/                    # Node.js + Express
    └── src/
        ├── routes/            # Endpointy API
        │   ├── auth.ts        # Rejestracja, logowanie
        │   ├── listings.ts    # Ogłoszenia
        │   ├── admin.ts       # Panel admina
        │   ├── profile.ts     # Profil użytkownika
        │   └── favorites.ts   # Ulubione
        ├── middleware/        # JWT, upload, requireAdmin
        ├── utils/             # Wykrywanie dzielnic (GIS)
        └── db.ts              # Schema bazy danych
```

## Schemat bazy danych

| Tabela | Opis |
|--------|------|
| `users` | Użytkownicy (role, avatar, ban) |
| `listings` | Ogłoszenia (tytuł, dzielnica, cena, zdjęcia) |
| `cities` | Miasta z granicami (polygon) |
| `districts` | Dzielnice z granicami (polygon) |
| `favorites` | Polubienia ogłoszeń |
| `listing_views` | Unikalne wyświetlenia ogłoszeń |

## Uruchomienie

### Wymagania
- Node.js 18+
- npm

### Backend
```bash
cd server
npm install
npm run dev
```

Serwer uruchamia się na `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Aplikacja uruchamia się na `http://localhost:5173`

### Zmienne środowiskowe

Utwórz plik `frontend/.env`:
```
VITE_GOOGLE_MAPS_API_KEY=twoj_klucz_api
```

### Seed danych
```bash
cd server
npx ts-node src/insert.ts
```

Tworzy 21 użytkowników i 35 ogłoszeń testowych. Hasło do wszystkich kont: `Test1234`

Konto administratora:
- Email: `jan.deweloper@example.com`
- Hasło: `Test1234`

## API

### Auth
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/auth/register` | Rejestracja |
| POST | `/api/auth/login` | Logowanie |

### Listings
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/listings` | Lista ogłoszeń (filtry, paginacja) |
| GET | `/listings/:id` | Szczegóły ogłoszenia |
| POST | `/listings` | Dodaj ogłoszenie |
| PUT | `/listings/:id` | Edytuj ogłoszenie |
| DELETE | `/listings/:id` | Usuń ogłoszenie (soft delete) |
| PATCH | `/listings/:id/rent` | Oznacz jako wynajęte |
| PATCH | `/listings/:id/unrent` | Przywróć do aktywnych |
| PATCH | `/listings/:id/restore` | Przywróć usunięte |

### Profile
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/profile/me` | Własny profil |
| GET | `/api/profile/:id` | Publiczny profil |
| POST | `/api/profile/avatar` | Zmień avatar |
| PATCH | `/api/profile/password` | Zmień hasło |

### Admin
| Metoda | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/admin/listings` | Wszystkie ogłoszenia |
| GET | `/api/admin/listings/pending` | Oczekujące |
| PATCH | `/api/admin/listings/:id/accept` | Zatwierdź |
| PATCH | `/api/admin/listings/:id/reject` | Odrzuć |
| PATCH | `/api/admin/listings/:id/restore` | Przywróć do oczekujących |
| PATCH | `/api/admin/listings/:id/restore-accept` | Przywróć i zatwierdź |
| GET | `/api/admin/users` | Lista użytkowników |
| PATCH | `/api/admin/users/:id/role` | Zmień rolę |
| PATCH | `/api/admin/users/:id/ban` | Zbanuj |
| PATCH | `/api/admin/users/:id/unban` | Odbanuj |

### Favorites
| Metoda | Endpoint | Opis |
|--------|----------|------|
| POST | `/api/favorites/:id` | Polub/odpolub |
| GET | `/api/favorites` | Lista ulubionych |

## Autor

Praca inżynierska — aplikacja webowa do wynajmu mieszkań w Krakowie.