import React from "react";

interface MapProps {
    location?: string;
    height?: string;
}

export default function Map({ location = "Kraków, Poland", height = "300px" }: MapProps) {
    const encodedLocation = encodeURIComponent(location);

    return (
        <div style={{ width: "100%", height }}>
            <iframe
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: "8px" }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2564.8431057756944!2d19.944979615713807!3d50.06465047942302!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47165b08f06107c7%3A0x9ff9f537454b6ca2!2s${encodedLocation}!5e0!3m2!1sen!2spl!4v1631376291449!5m2!1sen!2spl`}
            ></iframe>
        </div>
    );
}
