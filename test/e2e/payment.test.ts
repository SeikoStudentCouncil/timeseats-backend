import { Hono } from "hono";
import api from "../../src/router.js";
import { setupDatabase } from "../utils.js";

describe("Cashier Flow E2E Test", () => {
    let app: Hono;

    beforeAll(async () => {
        app = api;
        await setupDatabase();
    });

    it("executes the full cashier process correctly", async () => {
        // 1. Create a product
        const productPayload = { name: "Cashier Flow Product", price: 99 };
        const productRes = await app.request("/api/v1/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productPayload),
        });
        expect(productRes.status).toBe(201);
        const productData = await productRes.json();
        const productId = productData.id;

        // 2. Create a sales slot
        const startTime = new Date("2021-01-01T15:00:00.000Z").toISOString();
        const endTime = new Date("2021-01-01T15:30:00.000Z").toISOString();
        const slotPayload = { startTime, endTime, isActive: true };
        const slotRes = await app.request("/api/v1/sales-slots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(slotPayload),
        });
        expect(slotRes.status).toBe(201);
        const slotData = await slotRes.json();
        const salesSlotId = slotData.id;

        // 3. Set inventory for the product
        const inventoryPayload = {
            salesSlotId: salesSlotId,
            quantity: 10,
        };
        const inventoryRes = await app.request(
            `/api/v1/products/${productId}/inventory`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inventoryPayload),
            }
        );
        const inventoryData = await inventoryRes.json();
        console.log(inventoryData);
        expect(inventoryRes.status).toBe(200);

        // 4. Create an order (reservation)
        const orderPayload = {
            salesSlotId,
            items: [{ productId, quantity: 2 }],
        };
        const orderRes = await app.request("/api/v1/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload),
        });
        expect(orderRes.status).toBe(201);
        const orderData = await orderRes.json();
        expect(orderData.status).toBe("RESERVED");
        const orderId = orderData.id;

        // 5. Confirm the order with payment method
        const confirmPayload = {
            paymentMethod: "CASH",
            transactionId: "TXN123456789",
        };
        const confirmRes = await app.request(
            `/api/v1/orders/${orderId}/confirm`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(confirmPayload),
            }
        );
        //expect(confirmRes.status).toBe(200);
        const confirmedOrderData = await confirmRes.json();
        console.log(confirmedOrderData);
        expect(confirmedOrderData.status).toBe("CONFIRMED");
        expect(confirmedOrderData.ticketNumber).toBeDefined();
        const ticketNumber = confirmedOrderData.ticketNumber;

        // 6. Retrieve the ticket by number
        const ticketRes = await app.request(
            `/api/v1/tickets/number/${ticketNumber}`
        );
        expect(ticketRes.status).toBe(200);
        const ticketData = await ticketRes.json();
        const ticketId = ticketData.id;
        expect(ticketData.paymentMethod).toBe("CASH");
        expect(ticketData.transactionId).toBe("TXN123456789");

        // 7. Update payment status if needed
        if (!ticketData.isPaid) {
            const paymentPayload = { isPaid: true };
            const paymentRes = await app.request(
                `/api/v1/tickets/${ticketId}/payment`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(paymentPayload),
                }
            );
            expect(paymentRes.status).toBe(200);
            const updatedTicket = await paymentRes.json();
            expect(updatedTicket.isPaid).toBe(true);
        }

        // 8. Mark the order as delivered using ticket ID
        const deliveryPayload = { isDelivered: true };
        const deliveryRes = await app.request(
            `/api/v1/tickets/${ticketId}/delivery`,
            {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(deliveryPayload),
            }
        );
        expect(deliveryRes.status).toBe(200);
        const deliveredTicket = await deliveryRes.json();
        expect(deliveredTicket.isDelivered).toBe(true);
    });
});
