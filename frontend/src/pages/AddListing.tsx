import React, { useState, useRef } from "react";
import "./AddListing.css";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { toast } from "react-toastify";

const libraries = ["places"];

const DISTRICTS: { name: string; min_lat: number; max_lat: number; min_lng: number; max_lng: number }[] = [
  { name: "Stare Miasto",              min_lat: 50.055, max_lat: 50.070, min_lng: 19.930, max_lng: 19.950 },
  { name: "Grzegórzki",               min_lat: 50.045, max_lat: 50.065, min_lng: 19.950, max_lng: 19.980 },
  { name: "Prądnik Czerwony",         min_lat: 50.070, max_lat: 50.100, min_lng: 19.960, max_lng: 20.020 },
  { name: "Prądnik Biały",            min_lat: 50.080, max_lat: 50.120, min_lng: 19.900, max_lng: 19.960 },
  { name: "Krowodrza",                min_lat: 50.060, max_lat: 50.090, min_lng: 19.900, max_lng: 19.940 },
  { name: "Bronowice",                min_lat: 50.070, max_lat: 50.100, min_lng: 19.860, max_lng: 19.920 },
  { name: "Zwierzyniec",              min_lat: 50.040, max_lat: 50.090, min_lng: 19.860, max_lng: 19.920 },
  { name: "Dębniki",                  min_lat: 50.010, max_lat: 50.050, min_lng: 19.880, max_lng: 19.940 },
  { name: "Łagiewniki-Borek Fałęcki", min_lat: 49.980, max_lat: 50.020, min_lng: 19.900, max_lng: 19.960 },
  { name: "Swoszowice",               min_lat: 49.950, max_lat: 50.000, min_lng: 19.880, max_lng: 19.980 },
  { name: "Podgórze Duchackie",       min_lat: 49.980, max_lat: 50.030, min_lng: 19.960, max_lng: 20.030 },
  { name: "Bieżanów-Prokocim",        min_lat: 49.970, max_lat: 50.020, min_lng: 20.000, max_lng: 20.080 },
  { name: "Podgórze",                 min_lat: 50.020, max_lat: 50.060, min_lng: 19.950, max_lng: 20.020 },
  { name: "Czyżyny",                  min_lat: 50.060, max_lat: 50.090, min_lng: 20.020, max_lng: 20.080 },
  { name: "Mistrzejowice",            min_lat: 50.090, max_lat: 50.120, min_lng: 20.020, max_lng: 20.080 },
  { name: "Bieńczyce",                min_lat: 50.070, max_lat: 50.100, min_lng: 20.060, max_lng: 20.120 },
  { name: "Wzgórza Krzesławickie",    min_lat: 50.090, max_lat: 50.130, min_lng: 20.080, max_lng: 20.150 },
  { name: "Nowa Huta",                min_lat: 50.060, max_lat: 50.130, min_lng: 20.080, max_lng: 20.200 },
];

function getDistrictForCoords(lat: number, lng: number): string {
  const found = DISTRICTS.find(
    (d) =>
      lat >= d.min_lat && lat <= d.max_lat &&
      lng >= d.min_lng && lng <= d.max_lng
  );
  return found ? found.name : "";
}

export default function AddListing() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries as any,
  });

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [district, setDistrict] = useState("");
  const [type, setType] = useState("room");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinMoved, setPinMoved] = useState(false);

  const [photos, setPhotos] = useState<(File | null)[]>([null, null, null, null, null]);
  const [previews, setPreviews] = useState<string[]>(["", "", "", "", ""]);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [coords, setCoords] = useState({ lat: 50.0619, lng: 19.9366 });

  const handlePhotoChange = (index: number, file: File | null) => {
    const newPhotos = [...photos];
    const newPreviews = [...previews];
    newPhotos[index] = file;
    newPreviews[index] = file ? URL.createObjectURL(file) : "";
    setPhotos(newPhotos);
    setPreviews(newPreviews);
  };

  const handleDeletePhoto = (index: number) => {
    const newPhotos = [...photos];
    const newPreviews = [...previews];
    newPhotos[index] = null;
    newPreviews[index] = "";
    setPhotos(newPhotos);
    setPreviews(newPreviews);
    if (fileRefs.current[index]) {
      fileRefs.current[index]!.value = "";
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setCoords({ lat, lng });
    setPinMoved(true);
    setDistrict(getDistrictForCoords(lat, lng));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Musisz być zalogowany, aby dodać ogłoszenie.");
      return;
    }

    const hasPhoto = photos.some((p) => p !== null);
    if (!hasPhoto) {
      toast.error("Dodaj co najmniej 1 zdjęcie.");
      return;
    }

    if (!title || !price) {
      toast.error("Tytuł i cena są wymagane.");
      return;
    }

    if (!district) {
      toast.error("Kliknij pin na mapie w granicach Krakowa, aby wybrać dzielnicę.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("district", district);
      formData.append("details", details);
      formData.append("price", price);
      formData.append("type", type);
      formData.append("lat", String(coords.lat));
      formData.append("lng", String(coords.lng));

      photos.forEach((photo) => {
        if (photo) formData.append("photos", photo);
      });

      const response = await fetch("http://localhost:5000/listings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Błąd podczas dodawania ogłoszenia.");
        return;
      }

      toast.success(`Ogłoszenie "${data.title}" zostało dodane!`);

      setTitle("");
      setDetails("");
      setDistrict("");
      setType("room");
      setPrice("");
      setPhotos([null, null, null, null, null]);
      setPreviews(["", "", "", "", ""]);
      setCoords({ lat: 50.0619, lng: 19.9366 });
      setPinMoved(false);
      fileRefs.current.forEach((ref) => { if (ref) ref.value = ""; });

    } catch (err) {
      console.error(err);
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="container">
      <h2>Add New Listing</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <textarea
          placeholder="Opis ogłoszenia (max 1000 znaków)"
          value={details}
          onChange={(e) => {
            if (e.target.value.length <= 1000) setDetails(e.target.value);
          }}
          rows={4}
          className="details-textarea"
        />
        <p className="details-counter">{details.length}/1000</p>

        <input
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="room">Room</option>
          <option value="apartment">Apartment</option>
        </select>

        <input
          placeholder="Dzielnica — kliknij pin na mapie"
          value={district}
          readOnly
        />
        {!district && !pinMoved && (
          <p className="district-hint">Kliknij na mapie, żeby automatycznie wykryć dzielnicę.</p>
        )}
        {!district && pinMoved && (
          <p className="district-error">Lokalizacja poza granicami Krakowa — przesuń pin.</p>
        )}

        <div className="photo-upload">
          <h3>Photos (5 slots)</h3>
          <div className="photo-grid">
            {photos.map((_, index) => (
              <div key={index} className="photo-slot">
                <input
                  ref={(el) => (fileRefs.current[index] = el)}
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handlePhotoChange(index, e.target.files ? e.target.files[0] : null)
                  }
                />
                {previews[index] && (
                  <div className="preview-box">
                    <img src={previews[index]} alt={`photo-${index}`} />
                    <button type="button" onClick={() => handleDeletePhoto(index)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="map-hint">Kliknij na mapie, żeby ustawić lokalizację ogłoszenia.</p>
        <div className="map-container">
          <GoogleMap
            zoom={12}
            center={coords}
            mapContainerStyle={{ width: "100%", height: "400px" }}
            onClick={handleMapClick}
          >
            <Marker position={coords} />
          </GoogleMap>
        </div>

        <button type="submit" disabled={loading || !district}>
          {loading ? "Adding..." : "Add Listing"}
        </button>

      </form>
    </div>
  );
}