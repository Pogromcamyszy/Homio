const BASE_URL = "http://localhost:5000";

export const api = {
    // Auth
    register: async (username: string, email: string, password: string) => {
        const res = await fetch(`${BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });
        return res.json();
    },

    login: async (email: string, password: string) => {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        return res.json();
    },

    // Listings
    getListings: async () => {
        const res = await fetch(`${BASE_URL}/listings`);
        return res.json();
    },

    addListing: async (
        token: string,
        title: string,
        district: string,
        price: number,
        type: string
    ) => {
        const res = await fetch(`${BASE_URL}/listings`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, district, price, type }),
        });
        return res.json();
    },

    deleteListing: async (token: string, id: number) => {
        const res = await fetch(`${BASE_URL}/listings/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        return res.json();
    },
};
