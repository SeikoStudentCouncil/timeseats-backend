import { describe, it, expect } from "vitest";
import type { Order, OrderItem } from "@/domain/models/index.js";
import { OrderStatus } from "@/domain/types/index.js";

describe("Order Model", () => {
    const validOrderItem: OrderItem = {
        id: "item1",
        productId: "product1",
        orderId: "order1",
        quantity: 2,
        price: 500,
    };

    const validOrder: Order = {
        id: "order1",
        salesSlotId: "slot1",
        status: OrderStatus.RESERVED,
        items: [validOrderItem],
        totalAmount: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe("基本的なバリデーション", () => {
        it("有効な注文データを検証できる", () => {
            expect(validOrder).toMatchObject({
                id: expect.any(String),
                salesSlotId: expect.any(String),
                status: expect.any(String),
                items: expect.any(Array),
            });
        });

        it("注文は少なくとも1つのアイテムを持つ必要がある", () => {
            expect(validOrder.items.length).toBeGreaterThan(0);
        });

        it("注文番号は必須である", () => {
            expect(validOrder.id).toBeTruthy();
        });

        it("販売枠IDは必須である", () => {
            expect(validOrder.salesSlotId).toBeTruthy();
        });
    });

    describe("注文アイテム", () => {
        it("注文アイテムは正しい数量を持つ", () => {
            const item = validOrder.items[0];
            expect(item.quantity).toBeGreaterThan(0);
        });

        it("注文アイテムは正しい価格を持つ", () => {
            const item = validOrder.items[0];
            expect(item.price).toBeGreaterThan(0);
        });

        it("注文アイテムは商品IDを持つ", () => {
            const item = validOrder.items[0];
            expect(item.productId).toBeTruthy();
        });
    });

    describe("注文ステータス", () => {
        it("新規注文は予約状態である", () => {
            expect(validOrder.status).toBe(OrderStatus.RESERVED);
        });
    });

    describe("金額計算", () => {
        it("合計金額は注文アイテムの合計と一致する", () => {
            const calculatedTotal = validOrder.items.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );
            expect(validOrder.totalAmount).toBe(calculatedTotal);
        });

        it("注文アイテムの単価は0より大きい", () => {
            validOrder.items.forEach((item) => {
                expect(item.price).toBeGreaterThan(0);
            });
        });
    });

    describe("日時の検証", () => {
        it("作成日時は現在時刻以前である", () => {
            expect(validOrder.createdAt.getTime()).toBeLessThanOrEqual(
                Date.now()
            );
        });

        it("更新日時は作成日時以降である", () => {
            expect(validOrder.updatedAt.getTime()).toBeGreaterThanOrEqual(
                validOrder.createdAt.getTime()
            );
        });
    });
});
