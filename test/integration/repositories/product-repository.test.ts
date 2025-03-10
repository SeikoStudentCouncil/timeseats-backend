import { ProductRepositoryImpl } from "@/infrastructure/repositories/product-repository-impl.js";
import prisma from "@/infrastructure/database/index.js";
import { setupDatabase } from "../../utils.js";

describe("ProductRepository Integration Test", () => {
    let productRepository: ProductRepositoryImpl;

    beforeAll(async () => {
        productRepository = new ProductRepositoryImpl(prisma);
    });

    beforeEach(async () => {
        await setupDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe("基本的なCRUD操作", () => {
        it("商品を作成して取得できる", async () => {
            const productData = {
                name: "テスト商品",
                price: 1000,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await productRepository.create(productData);

            // 作成された商品を検索
            const products = await productRepository.findAll();
            expect(products).toHaveLength(1);
            const createdProduct = products[0];
            expect(createdProduct.name).toBe("テスト商品");
            expect(createdProduct.price).toBe(1000);
        });

        it("商品情報を更新できる", async () => {
            // 商品の作成
            const product = await prisma.product.create({
                data: {
                    name: "更新前商品",
                    price: 500,
                },
            });

            // 更新
            await productRepository.update(product.id, {
                name: "更新後商品",
                price: 600,
            });

            // 更新の確認
            const updatedProduct = await productRepository.findById(product.id);
            expect(updatedProduct?.name).toBe("更新後商品");
            expect(updatedProduct?.price).toBe(600);
        });

        it("商品を削除できる", async () => {
            // 商品の作成
            const product = await prisma.product.create({
                data: {
                    name: "削除対象商品",
                    price: 300,
                },
            });

            // 削除
            await productRepository.delete(product.id);

            // 削除の確認
            const deletedProduct = await productRepository.findById(product.id);
            expect(deletedProduct).toBeNull();
        });
    });

    describe("在庫管理", () => {
        it("販売枠ごとの在庫を設定できる", async () => {
            // 商品の作成
            const product = await prisma.product.create({
                data: {
                    name: "在庫管理商品",
                    price: 1000,
                },
            });

            // 販売枠の作成
            const salesSlot = await prisma.salesSlot.create({
                data: {
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 1800000),
                    isActive: true,
                },
            });

            // 在庫の設定
            // 在庫の設定と確認
            const createdInventory = await productRepository.createInventory({
                productId: product.id,
                salesSlotId: salesSlot.id,
                initialQuantity: 10,
                reservedQuantity: 0,
                soldQuantity: 0,
            });
            expect(createdInventory).toBeTruthy();
            expect(createdInventory.initialQuantity).toBe(10);

            // 設定された在庫の再取得と確認
            const foundInventory =
                await productRepository.findInventoryByProductAndSalesSlot(
                    product.id,
                    salesSlot.id
                );
            expect(foundInventory).toBeTruthy();
            expect(foundInventory?.initialQuantity).toBe(10);
            expect(foundInventory?.id).toBe(createdInventory.id);
        });

        it("在庫情報を更新できる", async () => {
            // 商品の作成
            const product = await prisma.product.create({
                data: {
                    name: "在庫更新商品",
                    price: 1000,
                },
            });

            // 販売枠の作成
            const salesSlot = await prisma.salesSlot.create({
                data: {
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 1800000),
                    isActive: true,
                },
            });

            // 初期在庫の設定
            const inventory = await productRepository.createInventory({
                productId: product.id,
                salesSlotId: salesSlot.id,
                initialQuantity: 10,
                reservedQuantity: 0,
                soldQuantity: 0,
            });

            // 在庫の更新
            await productRepository.updateInventory(inventory.id, {
                reservedQuantity: 2,
                soldQuantity: 1,
            });

            // 更新の確認
            const updatedInventory =
                await productRepository.findInventoryByProductAndSalesSlot(
                    product.id,
                    salesSlot.id
                );
            expect(updatedInventory?.reservedQuantity).toBe(2);
            expect(updatedInventory?.soldQuantity).toBe(1);
        });
    });

    describe("検索機能", () => {
        beforeEach(async () => {
            // テスト用の商品データを作成
            await Promise.all([
                prisma.product.create({
                    data: {
                        name: "安価商品A",
                        price: 500,
                    },
                }),
                prisma.product.create({
                    data: {
                        name: "中価商品B",
                        price: 1000,
                    },
                }),
                prisma.product.create({
                    data: {
                        name: "高価商品C",
                        price: 1500,
                    },
                }),
            ]);
        });

        it("名前で商品を検索できる", async () => {
            const products = await productRepository.searchByName("商品B");
            expect(products).toHaveLength(1);
            expect(products[0].name).toBe("中価商品B");
        });

        it("在庫がある商品のみを検索できる", async () => {
            // 販売枠の作成
            const salesSlot = await prisma.salesSlot.create({
                data: {
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 1800000),
                    isActive: true,
                },
            });

            // 商品に在庫を設定
            const products = await productRepository.findAll();
            await Promise.all([
                productRepository.createInventory({
                    productId: products[0].id,
                    salesSlotId: salesSlot.id,
                    initialQuantity: 5,
                    reservedQuantity: 0,
                    soldQuantity: 0,
                }),
                productRepository.createInventory({
                    productId: products[1].id,
                    salesSlotId: salesSlot.id,
                    initialQuantity: 0,
                    reservedQuantity: 0,
                    soldQuantity: 0,
                }),
            ]);

            const availableProducts = await productRepository.findAvailable(
                salesSlot.id
            );
            expect(availableProducts).toHaveLength(1);
            expect(availableProducts[0].product.id).toBe(products[0].id);
        });
    });
});
