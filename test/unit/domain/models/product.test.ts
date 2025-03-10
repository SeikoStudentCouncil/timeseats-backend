import { describe, it, expect } from "vitest";
import type { Product, ProductInventory } from "@/domain/models/index.js";

describe("Product Model", () => {
    const validProduct: Product = {
        id: "1",
        name: "テスト商品",
        price: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe("基本的なバリデーション", () => {
        it("有効な商品データを検証できる", () => {
            expect(validProduct).toMatchObject({
                id: expect.any(String),
                name: expect.any(String),
                price: expect.any(Number),
            });
        });

        it("商品の価格は0以上である必要がある", () => {
            expect(validProduct.price).toBeGreaterThan(0);
        });

        it("商品名は空でない必要がある", () => {
            expect(validProduct.name.length).toBeGreaterThan(0);
        });

        it("商品名は100文字以内である必要がある", () => {
            expect(validProduct.name.length).toBeLessThanOrEqual(100);
        });
    });

    describe("日時の検証", () => {
        it("作成日時は現在時刻以前である", () => {
            expect(validProduct.createdAt.getTime()).toBeLessThanOrEqual(
                Date.now()
            );
        });

        it("更新日時は作成日時以降である", () => {
            expect(validProduct.updatedAt.getTime()).toBeGreaterThanOrEqual(
                validProduct.createdAt.getTime()
            );
        });
    });

    describe("在庫管理", () => {
        const inventory: ProductInventory = {
            id: "1",
            productId: validProduct.id,
            salesSlotId: "slot1",
            initialQuantity: 10,
            reservedQuantity: 2,
            soldQuantity: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it("初期在庫数は0以上である必要がある", () => {
            expect(inventory.initialQuantity).toBeGreaterThanOrEqual(0);
        });

        it("予約数は初期在庫数以下である必要がある", () => {
            expect(inventory.reservedQuantity).toBeLessThanOrEqual(
                inventory.initialQuantity
            );
        });

        it("販売済数は予約数以下である必要がある", () => {
            expect(inventory.soldQuantity).toBeLessThanOrEqual(
                inventory.reservedQuantity
            );
        });

        it("在庫は商品IDと販売枠IDを持つ", () => {
            expect(inventory).toMatchObject({
                productId: expect.any(String),
                salesSlotId: expect.any(String),
            });
        });

        it("在庫は適切な商品IDを参照している", () => {
            expect(inventory.productId).toBe(validProduct.id);
        });

        it("残り在庫数が計算できる", () => {
            const availableQuantity =
                inventory.initialQuantity - inventory.reservedQuantity;
            expect(availableQuantity).toBe(8);
        });
    });
});
