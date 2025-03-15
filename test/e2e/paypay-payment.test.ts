import { Hono } from "hono";
import api from "../../src/router.js";
import { setupDatabase } from "../utils.js";

describe("PayPay Payment Flow E2E Test", () => {
    let app: Hono;

    beforeAll(() => {
        app = api;
        setupDatabase();
    });

    it("executes the full PayPay payment process correctly", async () => {
        // 1. Create a product
        const productPayload = { name: "PayPay Flow Product", price: 1000 };
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

        // 3. Set inventory for the product
        const inventoryPayload = {
            salesSlotId,
            quantity: 5,
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

        // 4. Create an order (reserved)
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
        expect(orderData.status).toBe("RESERVED");
        const orderId = orderData.id;

        // 5. Confirm the order with payment method
        const confirmPayload = {
            paymentMethod: "PAYPAY",
            transactionId: "PAYPAY-TX-001",
        };
        const confirmRes = await app.request(
            `/api/v1/orders/${orderId}/confirm`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(confirmPayload),
            }
        );
        expect(confirmRes.status).toBe(200);
        const confirmedOrder = await confirmRes.json();
        expect(confirmedOrder.status).toBe("CONFIRMED");
        expect(confirmedOrder.ticketNumber).toBe(ticketNumber);

        // 6. Create a ticket with PayPay payment
        const ticketPayload = {
            orderId,
            paymentMethod: "PAYPAY",
            transactionId: "PAYPAY-TX-001",
        };
        const createTicketRes = await app.request("/api/v1/tickets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ticketPayload),
        });
        expect(createTicketRes.status).toBe(201);
        const ticketData = await createTicketRes.json();
        expect(ticketData.paymentMethod).toBe("PAYPAY");
        expect(ticketData.transactionId).toBe("PAYPAY-TX-001");
        const ticketId = ticketData.id;

        // 7. Mark payment as completed
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
        expect(updatedTicket.transactionId).toBe("PAYPAY-TX-001");

        // 8. Mark as delivered
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

    it("handles PayPay payment cancellation correctly", async () => {
        // 1. Create a product
        const productPayload = { name: "PayPay Cancel Product", price: 500 };
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

        // 3. Create an order (reserved)
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
        expect(orderData.status).toBe("RESERVED");
        const orderId = orderData.id;

        // 4. Cancel the order
        const cancelRes = await app.request(
            `/api/v1/orders/${orderId}/cancel`,
            {
                method: "POST",
            }
        );
        expect(cancelRes.status).toBe(200);
        const canceledOrder = await cancelRes.json();
        expect(canceledOrder.status).toBe("CANCELED");
    });
});
