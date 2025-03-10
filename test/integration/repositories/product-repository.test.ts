import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";

describe("ProductRepository Integration Tests", () => {
    let prisma: PrismaClient;

    beforeEach(async () => {
        prisma = new PrismaClient();
        // テストデータのセットアップ
        await prisma.product.deleteMany();
    });

    afterEach(async () => {
        // テストデータのクリーンアップ
        await prisma.product.deleteMany();
        await prisma.$disconnect();
    });

    describe("商品の永続化テスト", () => {
        it("商品を作成して取得できる", async () => {
            // 商品の作成
            const created = await prisma.product.create({
                data: {
                    name: "テスト商品",
                    price: 500,
                },
            });

            // 作成した商品のIDで検索
            const found = await prisma.product.findUnique({
                where: {
                    id: created.id,
                },
            });

            // 検証
            expect(found).not.toBeNull();
            expect(found?.name).toBe("テスト商品");
            expect(found?.price).toBe(500);
        });

        it("存在しない商品IDの場合はnullが返る", async () => {
            const found = await prisma.product.findUnique({
                where: {
                    id: "non-existent-id",
                },
            });

            expect(found).toBeNull();
        });

        it("商品を更新できる", async () => {
            // 商品の作成
            const created = await prisma.product.create({
                data: {
                    name: "古い商品名",
                    price: 500,
                },
            });

            // 商品の更新
            const updated = await prisma.product.update({
                where: {
                    id: created.id,
                },
                data: {
                    name: "新しい商品名",
                },
            });

            // 検証
            expect(updated.name).toBe("新しい商品名");
            expect(updated.price).toBe(500);
        });

        it("商品を削除できる", async () => {
            // 商品の作成
            const created = await prisma.product.create({
                data: {
                    name: "削除する商品",
                    price: 500,
                },
            });

            // 商品の削除
            await prisma.product.delete({
                where: {
                    id: created.id,
                },
            });

            // 削除の確認
            const found = await prisma.product.findUnique({
                where: {
                    id: created.id,
                },
            });

            expect(found).toBeNull();
        });

        it("全ての商品を取得できる", async () => {
            // 複数の商品を作成
            await Promise.all([
                prisma.product.create({
                    data: {
                        name: "商品1",
                        price: 500,
                    },
                }),
                prisma.product.create({
                    data: {
                        name: "商品2",
                        price: 800,
                    },
                }),
            ]);

            // 全商品の取得
            const allProducts = await prisma.product.findMany();

            // 検証
            expect(allProducts).toHaveLength(2);
            expect(allProducts).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: "商品1", price: 500 }),
                    expect.objectContaining({ name: "商品2", price: 800 }),
                ])
            );
        });
    });
});
