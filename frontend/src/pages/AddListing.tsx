import React, { useState } from "react";
import "./AddListing.css"; // import the CSS

export default function AddListing() {
    const [title, setTitle] = useState("");
    const [details, setDetails] = useState("");
    const [location, setLocation] = useState("");
    const [type, setType] = useState("room"); // optionally choose type
    const [price, setPrice] = useState("");   // optionally input price
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in to add a listing.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/listings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    district: location,
                    price: Number(price),
                    type,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Error: ${errorData.message}`);
                setLoading(false);
                return;
            }

            const data = await response.json();
            alert(`Listing added: ${data.title} in ${data.district}`);
            setTitle("");
            setDetails("");
            setLocation("");
            setType("room");
            setPrice("");
        } catch (err) {
            console.error(err);
            alert("An error occurred while adding the listing.");
        } finally {
            setLoading(false);
        }
    };

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
                <input
                    placeholder="Details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                />
                <input
                    placeholder="Location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                />
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
                <button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add Listing"}
                </button>
            </form>
        </div>
    );
}
