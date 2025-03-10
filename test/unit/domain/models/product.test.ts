import { describe, it, expect } from "vitest";
import type { Product } from "../../../../src/domain/models/index.js";

describe("Product Model", () => {
    const validProduct: Product = {
        id: "1",
        name: "テスト商品",
        price: 500,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    it("有効な商品データを検証できる", () => {
        expect(validProduct).toMatchObject({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            price: expect.any(Number),
        });
    });

    it("商品の価格は0以上である必要がある", () => {
        expect(validProduct.price).toBeGreaterThan(0);
    });
});
