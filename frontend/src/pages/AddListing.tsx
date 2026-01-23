import React, { useState, useRef } from "react";
import "./AddListing.css";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

const libraries = ["places"];

export default function AddListing() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: libraries as any,
  });

  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("room");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const [photos, setPhotos] = useState<(File | null)[]>([
    null, null, null, null, null,
  ]);

  const [previews, setPreviews] = useState<string[]>([
    "", "", "", "", "",
  ]);

  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  // OLD TOWN KRAKOW
  const [coords, setCoords] = useState({ lat: 50.0619, lng: 19.9366 });

  const handlePhotoChange = (index: number, file: File | null) => {
    const newPhotos = [...photos];
    const newPreviews = [...previews];

    newPhotos[index] = file;

    if (file) {
      newPreviews[index] = URL.createObjectURL(file);
    } else {
      newPreviews[index] = "";
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to add a listing.");
      return;
    }

    const hasPhoto = photos.some((p) => p !== null);
    if (!hasPhoto) {
      alert("You must upload at least 1 photo.");
      return;
    }

    if (!title || !location || !price) {
      alert("Title, Location, and Price are required.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("district", location);
      formData.append("price", price);
      formData.append("type", type);

      // SAVE LAT + LNG
      formData.append("lat", String(coords.lat));
      formData.append("lng", String(coords.lng));

      photos.forEach((photo) => {
        if (photo) {
          formData.append("photos", photo);
        }
      });

      const response = await fetch("http://localhost:5000/listings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.message}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      alert(`Listing added: ${data.title} in ${data.district}`);

      // reset
      setTitle("");
      setDetails("");
      setLocation("");
      setType("room");
      setPrice("");
      setPhotos([null, null, null, null, null]);
      setPreviews(["", "", "", "", ""]);

      fileRefs.current.forEach((ref) => {
        if (ref) ref.value = "";
      });

    } catch (err) {
      console.error(err);
      alert("An error occurred while adding the listing.");
    } finally {
      setLoading(false);
    }
  };

  // MAP CLICK => SET PIN
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setCoords({ lat, lng });
    alert(`Pinned location: ${lat}, ${lng}`);
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="container">
      <h2>Add New Listing</h2>

      <form onSubmit={handleSubmit}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <input placeholder="Details" value={details} onChange={(e) => setDetails(e.target.value)} />
        <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} required />
        <input placeholder="Price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="room">Room</option>
          <option value="apartment">Apartment</option>
        </select>

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

        <button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Listing"}
        </button>

        {/* GOOGLE MAP */}
        <div className="map-container">
          <GoogleMap
            zoom={14}
            center={coords}
            mapContainerStyle={{ width: "100%", height: "400px" }}
            onClick={handleMapClick}
          >
            <Marker position={coords} />
          </GoogleMap>
        </div>

        
      </form>
    </div>
  );
}
