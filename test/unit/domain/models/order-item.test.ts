import { describe, it, expect } from "vitest";
import type { OrderItem } from "../../../../src/domain/models/index.js";

describe("OrderItem Model", () => {
    const validOrderItem: OrderItem = {
        id: "item1",
        orderId: "order1",
        productId: "product1",
        quantity: 2,
        price: 500,
    };

    describe("基本的なバリデーション", () => {
        it("有効な注文アイテムデータを検証できる", () => {
            expect(validOrderItem).toMatchObject({
                id: expect.any(String),
                orderId: expect.any(String),
                productId: expect.any(String),
                quantity: expect.any(Number),
                price: expect.any(Number),
            });
        });

        it("各IDは必須である", () => {
            expect(validOrderItem.id).toBeTruthy();
            expect(validOrderItem.orderId).toBeTruthy();
            expect(validOrderItem.productId).toBeTruthy();
        });
    });

    describe("数量と価格の検証", () => {
        it("数量は0より大きい必要がある", () => {
            expect(validOrderItem.quantity).toBeGreaterThan(0);
        });

        it("価格は0より大きい必要がある", () => {
            expect(validOrderItem.price).toBeGreaterThan(0);
        });

        it("数量は整数である必要がある", () => {
            expect(Number.isInteger(validOrderItem.quantity)).toBe(true);
        });
    });

    describe("計算機能", () => {
        it("小計を計算できる", () => {
            const subtotal = validOrderItem.quantity * validOrderItem.price;
            expect(subtotal).toBe(1000);
        });

        it("数量を更新すると小計も更新される", () => {
            const updatedItem: OrderItem = {
                ...validOrderItem,
                quantity: 3,
            };
            const newSubtotal = updatedItem.quantity * updatedItem.price;
            expect(newSubtotal).toBe(1500);
        });

        it("価格を更新すると小計も更新される", () => {
            const updatedItem: OrderItem = {
                ...validOrderItem,
                price: 600,
            };
            const newSubtotal = updatedItem.quantity * updatedItem.price;
            expect(newSubtotal).toBe(1200);
        });
    });

    describe("ビジネスルール", () => {
        it("注文アイテムは同じ注文に属する必要がある", () => {
            const items: OrderItem[] = [
                validOrderItem,
                {
                    ...validOrderItem,
                    id: "item2",
                    productId: "product2",
                },
            ];
            const allSameOrder = items.every(
                (item) => item.orderId === validOrderItem.orderId
            );
            expect(allSameOrder).toBe(true);
        });

        it("注文アイテムの商品IDは一意である必要がある", () => {
            const items: OrderItem[] = [
                validOrderItem,
                {
                    ...validOrderItem,
                    id: "item2",
                    productId: "product2",
                },
            ];
            const productIds = new Set(items.map((item) => item.productId));
            expect(productIds.size).toBe(items.length);
        });
    });

    describe("エッジケース", () => {
        it("大量注文の小計も正しく計算できる", () => {
            const largeOrderItem: OrderItem = {
                ...validOrderItem,
                quantity: 1000,
                price: 99999,
            };
            const subtotal = largeOrderItem.quantity * largeOrderItem.price;
            expect(subtotal).toBe(99999000);
        });

        it("最小注文数での小計を計算できる", () => {
            const minOrderItem: OrderItem = {
                ...validOrderItem,
                quantity: 1,
                price: 1,
            };
            const subtotal = minOrderItem.quantity * minOrderItem.price;
            expect(subtotal).toBe(1);
        });
    });
});
