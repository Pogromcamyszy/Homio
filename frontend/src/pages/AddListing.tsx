import React, { useState, useRef } from "react";
import "./AddListing.css";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { toast } from "react-toastify";

const libraries = ["places"];
const phoneRegex = /^(\+48\s?)?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}$/;

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
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
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

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setCoords({ lat, lng });
    setPinMoved(true);

    try {
      const res = await fetch(`http://localhost:5000/listings/detect-district?lat=${lat}&lng=${lng}`);
      const data = await res.json();
      setDistrict(data.district || "");
    } catch {
      setDistrict("");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);
    if (value.trim() === "") {
      setPhoneError("");
    } else if (!phoneRegex.test(value.trim())) {
      setPhoneError("Podaj poprawny polski numer telefonu (9 cyfr, np. 123 456 789).");
    } else {
      setPhoneError("");
    }
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

    if (!phone.trim()) {
      toast.error("Numer telefonu jest wymagany.");
      return;
    }

    if (!phoneRegex.test(phone.trim())) {
      toast.error("Podaj poprawny polski numer telefonu (9 cyfr, np. 123 456 789).");
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
      formData.append("phone", phone.trim());
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
      setPhone("");
      setPhoneError("");
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

        <input
          placeholder="Numer telefonu (np. 123 456 789)"
          type="tel"
          value={phone}
          onChange={handlePhoneChange}
          className={phoneError ? "input-phone-error" : ""}
          required
        />
        {phoneError && <p className="district-error">{phoneError}</p>}

        <select value={type} onChange={(e) => setType(e.target.value)}>
  <option value="room">Pokój</option>
  <option value="apartment">Mieszkanie</option>
  <option value="house">Dom</option>
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

        <button type="submit" disabled={loading || !district || !!phoneError}>
          {loading ? "Adding..." : "Add Listing"}
        </button>
      </form>
    </div>
  );
}