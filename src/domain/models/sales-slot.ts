import type { ID } from "../types/id.js";

export interface SalesSlot {
    id: ID;
    startTime: Date;
    endTime: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
