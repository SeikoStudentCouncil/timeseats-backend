import { Hono } from "hono";
import api from "../../src/router.js";
import { setupDatabase } from "../utils.js";

describe("Inventory Management E2E Test", () => {
    let app: Hono;

    beforeAll(() => {
        app = api;
        setupDatabase();
    });

    it("handles out-of-stock scenarios correctly", async () => {
        // 1. Create a product
        const productPayload = { name: "Limited Product", price: 1000 };
        const productRes = await app.request("/api/v1/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productPayload),
        });
        expect(productRes.status).toBe(201);
        const productData = await productRes.json();
        const productId = productData.id;

        // 2. Create a sales slot
        const now = new Date();
        const startTime = new Date(now.getTime() + 60_000).toISOString();
        const endTime = new Date(now.getTime() + 3_600_000).toISOString();
        const slotPayload = { startTime, endTime, isActive: true };
        const slotRes = await app.request("/api/v1/sales-slots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slotPayload),
        });
        expect(slotRes.status).toBe(201);
        const slotData = await slotRes.json();
        const salesSlotId = slotData.id;

        // 3. Set limited inventory (2 items only)
        const inventoryPayload = {
            salesSlotId,
            quantity: 2,
        };
        const inventoryRes = await app.request(
            `/api/v1/products/${productId}/inventory`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inventoryPayload),
            }
        );
        expect(inventoryRes.status).toBe(200);

        // 4. Create first order (2 items)
        const orderPayload1 = {
            salesSlotId,
            items: [{ productId, quantity: 2 }],
        };
        const orderRes1 = await app.request("/api/v1/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload1),
        });
        expect(orderRes1.status).toBe(201);
        const orderData1 = await orderRes1.json();
        expect(orderData1.status).toBe("RESERVED");

        // 5. Try to create second order (should fail due to no stock)
        const orderPayload2 = {
            salesSlotId,
            items: [{ productId, quantity: 1 }],
        };
        const orderRes2 = await app.request("/api/v1/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload2),
        });
        expect(orderRes2.status).toBe(400); // Out of stock error
    });

    it("handles inventory updates after order cancellation", async () => {
        // 1. Create a product
        const productPayload = {
            name: "Cancellation Test Product",
            price: 1500,
        };
        const productRes = await app.request("/api/v1/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productPayload),
        });
        expect(productRes.status).toBe(201);
        const productData = await productRes.json();
        const productId = productData.id;

        // 2. Create a sales slot
        const now = new Date();
        const startTime = new Date(now.getTime() + 60_000).toISOString();
        const endTime = new Date(now.getTime() + 3_600_000).toISOString();
        const slotPayload = { startTime, endTime, isActive: true };
        const slotRes = await app.request("/api/v1/sales-slots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slotPayload),
        });
        expect(slotRes.status).toBe(201);
        const slotData = await slotRes.json();
        const salesSlotId = slotData.id;

        // 3. Set inventory (1 item)
        const inventoryPayload = {
            salesSlotId,
            quantity: 1,
        };
        const inventoryRes = await app.request(
            `/api/v1/products/${productId}/inventory`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inventoryPayload),
            }
        );
        expect(inventoryRes.status).toBe(200);

        // 4. Create and cancel an order
        const orderPayload = {
            salesSlotId,
            items: [{ productId, quantity: 1 }],
        };
        const orderRes = await app.request("/api/v1/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload),
        });
        expect(orderRes.status).toBe(201);
        const orderData = await orderRes.json();

        // Cancel the order
        const cancelRes = await app.request(
            `/api/v1/orders/${orderData.id}/cancel`,
            {
                method: "POST",
            }
        );
        expect(cancelRes.status).toBe(200);

        // 5. Try to create new order (should succeed as inventory was restored)
        const newOrderPayload = {
            salesSlotId,
            items: [{ productId, quantity: 1 }],
        };
        const newOrderRes = await app.request("/api/v1/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newOrderPayload),
        });
        expect(newOrderRes.status).toBe(201);
        const newOrderData = await newOrderRes.json();
        expect(newOrderData.status).toBe("RESERVED");
    });
});
