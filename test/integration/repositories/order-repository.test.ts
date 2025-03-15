import { OrderRepositoryImpl } from "@/infrastructure/repositories/order-repository-impl.js";
import { OrderStatus } from "@/domain/types/index.js";
import prisma from "@/infrastructure/database/index.js";
import { setupDatabase } from "../../utils.js";

describe("OrderRepository Integration Test", () => {
    let orderRepository: OrderRepositoryImpl;

    beforeAll(async () => {
        orderRepository = new OrderRepositoryImpl(prisma);
    });

    beforeEach(async () => {
        await setupDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe("基本的なCRUD操作", () => {
        it("注文を作成して取得できる", async () => {
            // 販売枠の作成
            const salesSlot = await prisma.salesSlot.create({
                data: {
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 1800000),
                    isActive: true,
                },
            });

            // 商品の作成
            const product = await prisma.product.create({
                data: {
                    name: "テスト商品",
                    price: 1000,
                },
            });

            // 注文の作成
            const now = new Date();
            const orderData = {
                salesSlotId: salesSlot.id,
                status: OrderStatus.RESERVED,
                items: [
                    {
                        productId: product.id,
                        quantity: 2,
                        price: product.price,
                    },
                ],
                totalAmount: product.price * 2,
                createdAt: now,
                updatedAt: now,
            };

            await orderRepository.createOrder(orderData);

            // 作成された注文を検索
            const orders = await orderRepository.findBySalesSlotId(
                salesSlot.id
            );
            expect(orders).toHaveLength(1);
            const createdOrder = orders[0];
            expect(createdOrder.status).toBe(OrderStatus.RESERVED);
            expect(createdOrder.items).toHaveLength(1);
            expect(createdOrder.totalAmount).toBe(2000);

            // IDで注文を取得
            const retrievedOrder = await orderRepository.findById(
                createdOrder.id
            );
            expect(retrievedOrder).toBeTruthy();
            expect(retrievedOrder?.id).toBe(createdOrder.id);
        });

        it("注文ステータスを更新できる", async () => {
            // 販売枠の作成
            const salesSlot = await prisma.salesSlot.create({
                data: {
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 1800000),
                    isActive: true,
                },
            });

            // 注文の作成
            const order = await prisma.order.create({
                data: {
                    salesSlotId: salesSlot.id,
                    status: OrderStatus.RESERVED,
                    totalAmount: 0,
                },
            });

            // ステータスの更新
            const updatedOrder = await orderRepository.updateStatus(
                order.id,
                OrderStatus.CONFIRMED
            );
            expect(updatedOrder.status).toBe(OrderStatus.CONFIRMED);

            // 更新の確認
            const retrievedOrder = await orderRepository.findById(order.id);
            expect(retrievedOrder?.status).toBe(OrderStatus.CONFIRMED);
        });
    });

    describe("検索と一覧取得", () => {
        it("販売枠IDで注文を検索できる", async () => {
            // 販売枠の作成
            const salesSlot = await prisma.salesSlot.create({
                data: {
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 1800000),
                    isActive: true,
                },
            });

            // 複数の注文を作成
            await Promise.all([
                prisma.order.create({
                    data: {
                        salesSlotId: salesSlot.id,
                        status: OrderStatus.RESERVED,
                        totalAmount: 1000,
                    },
                }),
                prisma.order.create({
                    data: {
                        salesSlotId: salesSlot.id,
                        status: OrderStatus.RESERVED,
                        totalAmount: 2000,
                    },
                }),
            ]);

            // 販売枠IDでの検索
            const orders = await orderRepository.findBySalesSlotId(
                salesSlot.id
            );
            expect(orders).toHaveLength(2);
            orders.forEach((order) => {
                expect(order.salesSlotId).toBe(salesSlot.id);
            });
        });

        it("注文ステータスで検索できる", async () => {
            // 販売枠の作成
            const salesSlot = await prisma.salesSlot.create({
                data: {
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 1800000),
                    isActive: true,
                },
            });

            // 異なるステータスの注文を作成
            await Promise.all([
                prisma.order.create({
                    data: {
                        salesSlotId: salesSlot.id,
                        status: OrderStatus.RESERVED,
                        totalAmount: 1000,
                    },
                }),
                prisma.order.create({
                    data: {
                        salesSlotId: salesSlot.id,
                        status: OrderStatus.CONFIRMED,
                        totalAmount: 2000,
                    },
                }),
            ]);

            // 予約済み注文の検索
            const reservedOrders = await orderRepository.findByStatus(
                OrderStatus.RESERVED
            );
            expect(reservedOrders).toHaveLength(1);
            expect(reservedOrders[0].status).toBe(OrderStatus.RESERVED);

            // 確定済み注文の検索
            const confirmedOrders = await orderRepository.findByStatus(
                OrderStatus.CONFIRMED
            );
            expect(confirmedOrders).toHaveLength(1);
            expect(confirmedOrders[0].status).toBe(OrderStatus.CONFIRMED);
        });
    });
});
