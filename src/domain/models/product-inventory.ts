import type { ID } from "../types/id.js";

export interface ProductInventory {
    id: ID;
    salesSlotId: ID;
    productId: ID;
    initialQuantity: number;
    reservedQuantity: number;
    soldQuantity: number;
    createdAt: Date;
    updatedAt: Date;
}
