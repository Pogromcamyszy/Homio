export interface User {
    id: number;
    username: string;
    email: string;
    password: string;
}

export interface Listing {
    id: number;
    title: string;
    district: string;
    price: number;
    type: "room" | "apartment";
    owner_id: number;
}
