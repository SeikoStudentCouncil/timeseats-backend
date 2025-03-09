import type { ID } from "../types/id.js";

export interface Product {
    id: ID;
    name: string;
    price: number;
    createdAt: Date;
    updatedAt: Date;
}
