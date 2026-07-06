import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { toast } from "react-toastify";
import { AuthContext } from "../AuthContext";
import "./EditListing.css";

const libraries = ["places"];
const phoneRegex = /^(\+48\s?)?[0-9]{3}[\s\-]?[0-9]{3}[\s\-]?[0-9]{3}$/;

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

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
  const [coords, setCoords] = useState({ lat: 50.0619, lng: 19.9366 });
  const [pinMoved, setPinMoved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`http://localhost:5000/listings/${id}`, { headers });
        const data = await res.json();

        if (!data.is_owner) {
          toast.error("Nie masz uprawnień do edycji tego ogłoszenia.");
          navigate("/");
          return;
        }

        setTitle(data.title);
        setDetails(data.details || "");
        setDistrict(data.district);
        setType(data.type);
        setPrice(String(data.price));
        setPhone(data.phone || "");
        setCoords({ lat: data.lat, lng: data.lng });
      } catch (err) {
        console.error(err);
        toast.error("Błąd podczas pobierania ogłoszenia.");
      } finally {
        setFetching(false);
      }
    };
    fetchListing();
  }, [id, token]);

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

    if (!title || !price) {
      toast.error("Tytuł i cena są wymagane.");
      return;
    }

    if (!phone.trim()) {
      toast.error("Numer telefonu jest wymagany.");
      return;
    }

    if (!phoneRegex.test(phone.trim())) {
      toast.error("Podaj poprawny polski numer telefonu.");
      return;
    }

    if (!district) {
      toast.error("Ustaw pin na mapie w granicach Krakowa.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/listings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          district,
          details,
          price: parseInt(price),
          type,
          phone: phone.trim(),
          lat: coords.lat,
          lng: coords.lng,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Błąd podczas zapisywania.");
        return;
      }

      toast.success("Ogłoszenie zostało zaktualizowane!");
      navigate(`/listings/${id}`);
    } catch (err) {
      console.error(err);
      toast.error("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !isLoaded) return <div className="edit-loading">Ładowanie...</div>;

  return (
    <div className="edit-container">
      <h2>Edytuj ogłoszenie</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Tytuł"
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
          className="edit-textarea"
        />
        <p className="edit-counter">{details.length}/1000</p>

        <input
          placeholder="Cena (PLN)"
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
        {phoneError && <p className="edit-error">{phoneError}</p>}

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="room">Pokój</option>
          <option value="apartment">Mieszkanie</option>
        </select>

        <input
          placeholder="Dzielnica — kliknij pin na mapie"
          value={district}
          readOnly
        />
        {!district && pinMoved && (
          <p className="edit-error">Lokalizacja poza granicami Krakowa — przesuń pin.</p>
        )}

        <p className="edit-hint">Kliknij na mapie, żeby zmienić lokalizację.</p>
        <div className="edit-map">
          <GoogleMap
            zoom={14}
            center={coords}
            mapContainerStyle={{ width: "100%", height: "400px" }}
            onClick={handleMapClick}
          >
            <Marker position={coords} />
          </GoogleMap>
        </div>

        <button type="submit" disabled={loading || !district || !!phoneError}>
          {loading ? "Zapisywanie..." : "Zapisz zmiany"}
        </button>
      </form>
    </div>
  );
}