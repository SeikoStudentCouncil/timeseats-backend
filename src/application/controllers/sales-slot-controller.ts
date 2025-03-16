import type { Context } from "hono";
import type { SalesSlotService } from "../../domain/services/sales-slot-service.js";

export class SalesSlotController {
    constructor(private readonly salesSlotService: SalesSlotService) {}

    async getAllSalesSlots(c: Context) {
        try {
            const salesSlots = await this.salesSlotService.getAllSalesSlots();
            return c.json(salesSlots);
        } catch (error) {
            return c.json(
                {
                    error: error instanceof Error
                        ? error.message
                        : "Unknown error"
                },
                500
            );
        }
    }

    async getSalesSlotById(c: Context) {
        try {
            const id = c.req.param("id");
            const salesSlot = await this.salesSlotService.getSalesSlotById(id);
            if (!salesSlot) {
                return c.json({ error: "Sales slot not found" }, 404);
            }
            return c.json(salesSlot);
        } catch (error) {
            return c.json(
                {
                    error: error instanceof Error
                        ? error.message
                        : "Unknown error"
                },
                500
            );
        }
    }

    async createSalesSlot(c: Context) {
        try {
            const data = await c.req.json();
            data.startTime = new Date(data.startTime);
            data.endTime = new Date(data.endTime);

            const salesSlot = await this.salesSlotService.createSalesSlot(data);
            return c.json(salesSlot, 201);
        } catch (error) {
            return c.json(
                {
                    error: error instanceof Error
                        ? error.message
                        : "Unknown error"
                },
                500
            );
        }
    }

    async updateSalesSlot(c: Context) {
        try {
            const id = c.req.param("id");
            const data = await c.req.json();
            const salesSlot = await this.salesSlotService.updateSalesSlot(id, data);
            if (!salesSlot) {
                return c.json({ error: "Sales slot not found" }, 404);
            }
            return c.json(salesSlot);
        } catch (error) {
            return c.json(
                {
                    error: error instanceof Error
                        ? error.message
                        : "Unknown error"
                },
                500
            );
        }
    }

    async deleteSalesSlot(c: Context) {
        try {
            const id = c.req.param("id");
            await this.salesSlotService.deleteSalesSlot(id);
            return c.body(null, 204);
        } catch (error) {
            return c.json(
                {
                    error: error instanceof Error
                        ? error.message
                        : "Unknown error"
                },
                500
            );
        }
    }
}