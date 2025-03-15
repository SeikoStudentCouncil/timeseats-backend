import { describe, it, expect } from "vitest";
import type { ProductInventory } from "../../../../src/domain/models/index.js";

describe("ProductInventory Model", () => {
    const validInventory: ProductInventory = {
        id: "inv1",
        productId: "product1",
        salesSlotId: "slot1",
        initialQuantity: 10,
        reservedQuantity: 2,
        soldQuantity: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe("基本的なバリデーション", () => {
        it("有効な在庫データを検証できる", () => {
            expect(validInventory).toMatchObject({
                id: expect.any(String),
                productId: expect.any(String),
                salesSlotId: expect.any(String),
                initialQuantity: expect.any(Number),
                reservedQuantity: expect.any(Number),
                soldQuantity: expect.any(Number),
            });
        });

        it("各IDは必須である", () => {
            expect(validInventory.id).toBeTruthy();
            expect(validInventory.productId).toBeTruthy();
            expect(validInventory.salesSlotId).toBeTruthy();
        });
    });

    describe("数量の検証", () => {
        it("初期数量は0以上である必要がある", () => {
            expect(validInventory.initialQuantity).toBeGreaterThanOrEqual(0);
        });

        it("予約数は初期数量以下である必要がある", () => {
            expect(validInventory.reservedQuantity).toBeLessThanOrEqual(
                validInventory.initialQuantity
            );
        });

        it("販売済数は予約数以下である必要がある", () => {
            expect(validInventory.soldQuantity).toBeLessThanOrEqual(
                validInventory.reservedQuantity
            );
        });

        it("残り在庫を計算できる", () => {
            const availableQuantity =
                validInventory.initialQuantity -
                validInventory.reservedQuantity;
            expect(availableQuantity).toBe(8);
        });

        it("予約可能数を計算できる", () => {
            const reservableQuantity =
                validInventory.initialQuantity -
                validInventory.reservedQuantity;
            expect(reservableQuantity).toBeGreaterThanOrEqual(0);
        });
    });

    describe("日時の検証", () => {
        it("作成日時は現在時刻以前である", () => {
            expect(validInventory.createdAt.getTime()).toBeLessThanOrEqual(
                Date.now()
            );
        });

        it("更新日時は作成日時以降である", () => {
            expect(validInventory.updatedAt.getTime()).toBeGreaterThanOrEqual(
                validInventory.createdAt.getTime()
            );
        });
    });

    describe("在庫状態の検証", () => {
        it("在庫なしの状態を判定できる", () => {
            const soldOutInventory: ProductInventory = {
                ...validInventory,
                initialQuantity: 5,
                reservedQuantity: 5,
                soldQuantity: 5,
            };
            const availableQuantity =
                soldOutInventory.initialQuantity -
                soldOutInventory.reservedQuantity;
            expect(availableQuantity).toBe(0);
        });

        it("予約済みの状態を判定できる", () => {
            const fullyReservedInventory: ProductInventory = {
                ...validInventory,
                initialQuantity: 5,
                reservedQuantity: 5,
                soldQuantity: 0,
            };
            const reservableQuantity =
                fullyReservedInventory.initialQuantity -
                fullyReservedInventory.reservedQuantity;
            expect(reservableQuantity).toBe(0);
        });

        it("部分的に予約された状態を判定できる", () => {
            const partiallyReservedInventory: ProductInventory = {
                ...validInventory,
                initialQuantity: 5,
                reservedQuantity: 3,
                soldQuantity: 2,
            };
            const reservableQuantity =
                partiallyReservedInventory.initialQuantity -
                partiallyReservedInventory.reservedQuantity;
            expect(reservableQuantity).toBe(2);
            expect(partiallyReservedInventory.soldQuantity).toBeLessThan(
                partiallyReservedInventory.reservedQuantity
            );
        });
    });
});
