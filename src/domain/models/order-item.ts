import type { ID } from "../types/id.js";

export interface OrderItem {
    id: ID;
    orderId: ID;
    productId: ID;
    quantity: number;
    price: number;
}
