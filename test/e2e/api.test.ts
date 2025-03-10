import { describe, it, expect, beforeAll } from "vitest";
import { Hono } from "hono";
import type {
    Order,
    OrderTicket,
    Product,
    SalesSlot,
} from "../../src/domain/models/index.js";
import { OrderStatus, PaymentMethod } from "../../src/domain/types/index.js";
import api from "../../src/router.js";

describe("食品システム API E2Eテスト", () => {
    let app: Hono;

    beforeAll(() => {
        app = api;
    });

    // beforeAll(() => {
    //     app = new Hono();

    //     // モックエンドポイント
    //     app.post("/products", async (c) => {
    //         const body = await c.req.json();
    //         return c.json({ id: "1", ...body }, 201);
    //     });

    //     app.get("/products", (c) => {
    //         return c.json([
    //             {
    //                 id: "1",
    //                 name: "テスト商品",
    //                 price: 500,
    //             },
    //         ]);
    //     });

    //     app.post("/sales-slots", async (c) => {
    //         const body = await c.req.json();
    //         return c.json(
    //             {
    //                 id: "1",
    //                 ...body,
    //                 isActive: false,
    //                 productInventories: body.productInventories.map(
    //                     (inv: any) => ({
    //                         ...inv,
    //                         reservedQuantity: 0,
    //                         soldQuantity: 0,
    //                     })
    //                 ),
    //             },
    //             201
    //         );
    //     });

    //     app.get("/sales-slots/current", (c) => {
    //         return c.json({
    //             id: "1",
    //             startTime: "2025-03-10T10:00:00.000Z",
    //             endTime: "2025-03-10T10:30:00.000Z",
    //             isActive: true,
    //             productInventories: [
    //                 {
    //                     productId: "1",
    //                     initialQuantity: 50,
    //                     reservedQuantity: 0,
    //                     soldQuantity: 0,
    //                 },
    //             ],
    //         });
    //     });

    //     app.post("/orders/reserve", async (c) => {
    //         const body = await c.req.json();
    //         return c.json(
    //             {
    //                 id: "1",
    //                 ...body,
    //                 status: OrderStatus.RESERVED,
    //                 totalAmount: 1000,
    //                 orderItems: body.items.map((item: any) => ({
    //                     productId: item.productId,
    //                     quantity: item.quantity,
    //                     price: 500,
    //                 })),
    //             },
    //             201
    //         );
    //     });

    //     app.post("/orders/:id/confirm", async (c) => {
    //         const { ticketId } = await c.req.json();
    //         return c.json({
    //             id: c.req.param("id"),
    //             status: OrderStatus.CONFIRMED,
    //             orderTicketId: ticketId,
    //         });
    //     });

    //     app.post("/tickets", async (c) => {
    //         const body = await c.req.json();
    //         return c.json(
    //             {
    //                 id: "1",
    //                 ...body,
    //                 isPaid: false,
    //                 isDelivered: false,
    //             },
    //             201
    //         );
    //     });

    //     app.patch("/tickets/:id/payment", async (c) => {
    //         const body = await c.req.json();
    //         return c.json({
    //             id: c.req.param("id"),
    //             ...body,
    //         });
    //     });
    // });

    describe("ヘルスチェック API", () => {
        it("GET /health - 正常なレスポンスを返す", async () => {
            const res = await app.request("/health");
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toMatchObject({ status: "ok" });
        });
    });

    describe("商品管理 API", () => {
        it("POST /products - 商品を登録できる", async () => {
            const testProduct = {
                name: "テスト商品",
                price: 500,
            };

            const res = await app.request("/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testProduct),
            });

            expect(res.status).toBe(201);
            const data = (await res.json()) as Product;
            expect(data).toMatchObject({
                id: expect.any(String),
                ...testProduct,
            });
        });

        it("GET /products - 商品一覧を取得できる", async () => {
            const res = await app.request("/products");
            expect(res.status).toBe(200);
            const data = (await res.json()) as Product[];
            expect(Array.isArray(data)).toBe(true);
            expect(data.length).toBeGreaterThan(0);
        });
    });

    describe("販売枠 API", () => {
        it("POST /sales-slots - 販売枠を作成できる", async () => {
            const testSalesSlot = {
                startTime: "2025-03-10T10:00:00.000Z",
                endTime: "2025-03-10T10:30:00.000Z",
                productInventories: [
                    {
                        productId: "1",
                        initialQuantity: 50,
                    },
                ],
            };

            const res = await app.request("/sales-slots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testSalesSlot),
            });

            expect(res.status).toBe(201);
            const data = (await res.json()) as SalesSlot;
            expect(data).toMatchObject({
                id: expect.any(String),
                isActive: false,
                productInventories: expect.arrayContaining([
                    expect.objectContaining({
                        productId: "1",
                        initialQuantity: 50,
                        reservedQuantity: 0,
                        soldQuantity: 0,
                    }),
                ]),
            });
        });

        it("GET /sales-slots/current - 現在アクティブな販売枠を取得できる", async () => {
            const res = await app.request("/sales-slots/current");
            expect(res.status).toBe(200);
            const data = (await res.json()) as SalesSlot;
            expect(data).toMatchObject({
                id: expect.any(String),
                isActive: true,
                productInventories: expect.any(Array),
            });
        });
    });

    describe("注文フロー API", () => {
        it("POST /orders/reserve - 注文の仮予約を作成できる", async () => {
            const testOrder = {
                salesSlotId: "1",
                items: [
                    {
                        productId: "1",
                        quantity: 2,
                    },
                ],
            };

            const res = await app.request("/orders/reserve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testOrder),
            });

            expect(res.status).toBe(201);
            const data = (await res.json()) as Order;
            expect(data).toMatchObject({
                id: expect.any(String),
                status: OrderStatus.RESERVED,
                totalAmount: expect.any(Number),
                orderItems: expect.arrayContaining([
                    expect.objectContaining({
                        productId: "1",
                        quantity: 2,
                    }),
                ]),
            });
        });

        it("POST /orders/:id/confirm - 注文を確定できる", async () => {
            const orderId = "1";
            const ticketId = "1";
            const res = await app.request(`/orders/${orderId}/confirm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticketId }),
            });

            expect(res.status).toBe(200);
            const data = (await res.json()) as Order;
            expect(data).toMatchObject({
                id: orderId,
                status: OrderStatus.CONFIRMED,
                orderTicketId: ticketId,
            });
        });
    });

    describe("伝票 API", () => {
        it("POST /tickets - 伝票を発行できる", async () => {
            const testTicket = {
                orderId: "1",
                ticketNumber: "T001",
            };

            const res = await app.request("/tickets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(testTicket),
            });

            expect(res.status).toBe(201);
            const data = (await res.json()) as OrderTicket;
            expect(data).toMatchObject({
                id: expect.any(String),
                ticketNumber: "T001",
                orderId: "1",
                isPaid: false,
                isDelivered: false,
            });
        });

        it("PATCH /tickets/:id/payment - 支払い状態を更新できる", async () => {
            const ticketId = "1";
            const res = await app.request(`/tickets/${ticketId}/payment`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    isPaid: true,
                    paymentMethod: PaymentMethod.CASH,
                }),
            });

            expect(res.status).toBe(200);
            const data = (await res.json()) as OrderTicket;
            expect(data).toMatchObject({
                id: ticketId,
                isPaid: true,
                paymentMethod: PaymentMethod.CASH,
            });
        });
    });
});
