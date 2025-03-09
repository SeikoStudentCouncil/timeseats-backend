import type { ID } from "../types/id.js";
import type { OrderStatus } from "../types/order-status.js";
import type { OrderItem } from "./order-item.js";

export interface Order {
    id: ID;
    salesSlotId: ID;
    items: OrderItem[];
    status: OrderStatus;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
}
