import React from "react";
import Map from "../components/Map";

export default function Home() {
    return (
        <div className="container">
            <h2>Welcome to Homio</h2>
            <p>Find your perfect rental apartment or room in Kraków.</p>
            <Map location="Kraków, Poland" />
        </div>
    );
}
