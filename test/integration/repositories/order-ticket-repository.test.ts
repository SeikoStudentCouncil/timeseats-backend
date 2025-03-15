import { OrderTicketRepositoryImpl } from "@/infrastructure/repositories/order-ticket-repository-impl.js";
import { PaymentMethod } from "@/domain/types/index.js";
import { OrderStatus } from "@/domain/types/index.js";
import prisma from "@/infrastructure/database/index.js";
import { setupDatabase } from "../../utils.js";

describe("OrderTicketRepository Integration Test", () => {
    let orderTicketRepository: OrderTicketRepositoryImpl;

    beforeAll(async () => {
        orderTicketRepository = new OrderTicketRepositoryImpl(prisma);
    });

    beforeEach(async () => {
        await setupDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe("基本的なCRUD操作", () => {
        it("伝票を作成して取得できる", async () => {
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
                    status: OrderStatus.CONFIRMED,
                    totalAmount: 1000,
                },
            });

            // 伝票データ
            const ticketData = {
                orderId: order.id,
                ticketNumber: "TEST-001",
                paymentMethod: PaymentMethod.CASH,
                isPaid: false,
                isDelivered: false,
                transactionId: undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await orderTicketRepository.create(ticketData);

            // 作成された伝票を取得
            const createdTicket =
                await orderTicketRepository.findByTicketNumber("TEST-001");
            expect(createdTicket?.ticketNumber).toBe("TEST-001");
            expect(createdTicket?.paymentMethod).toBe(PaymentMethod.CASH);

            // IDによる伝票の取得
            const retrievedTicket = await orderTicketRepository.findById(
                createdTicket!.id
            );
            expect(retrievedTicket).toBeTruthy();
            expect(retrievedTicket?.ticketNumber).toBe("TEST-001");
        });

        it("支払い状態を更新できる", async () => {
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
                    status: OrderStatus.CONFIRMED,
                    totalAmount: 1000,
                },
            });

            // 伝票の作成
            const ticket = await prisma.orderTicket.create({
                data: {
                    orderId: order.id,
                    ticketNumber: "TEST-002",
                    paymentMethod: PaymentMethod.PAYPAY,
                    isPaid: false,
                    isDelivered: false,
                    transactionId: "PAYPAY-TX-001",
                },
            });

            // 支払い状態の更新
            const updatedTicket =
                await orderTicketRepository.updatePaymentStatus(
                    ticket.id,
                    true
                );
            expect(updatedTicket.isPaid).toBe(true);

            // 更新の確認
            const retrievedTicket = await orderTicketRepository.findById(
                ticket.id
            );
            expect(retrievedTicket?.isPaid).toBe(true);
        });
    });

    describe("検索機能", () => {
        it("チケット番号で伝票を検索できる", async () => {
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
                    status: OrderStatus.CONFIRMED,
                    totalAmount: 1000,
                },
            });

            // 伝票の作成
            await prisma.orderTicket.create({
                data: {
                    orderId: order.id,
                    ticketNumber: "TEST-003",
                    paymentMethod: PaymentMethod.SQUARE,
                    isPaid: false,
                    isDelivered: false,
                    transactionId: "SQUARE-TX-001",
                },
            });

            // チケット番号での検索
            const ticket = await orderTicketRepository.findByTicketNumber(
                "TEST-003"
            );
            expect(ticket).toBeTruthy();
            expect(ticket?.paymentMethod).toBe(PaymentMethod.SQUARE);
            expect(ticket?.transactionId).toBe("SQUARE-TX-001");
        });

        it("支払い状態で伝票を検索できる", async () => {
            // 販売枠の作成
            const salesSlot = await prisma.salesSlot.create({
                data: {
                    startTime: new Date(),
                    endTime: new Date(Date.now() + 1800000),
                    isActive: true,
                },
            });

            // 注文の作成
            const order1 = await prisma.order.create({
                data: {
                    salesSlotId: salesSlot.id,
                    status: OrderStatus.CONFIRMED,
                    totalAmount: 1000,
                },
            });

            const order2 = await prisma.order.create({
                data: {
                    salesSlotId: salesSlot.id,
                    status: OrderStatus.CONFIRMED,
                    totalAmount: 1000,
                },
            });

            // 異なる支払い状態の伝票を作成
            await Promise.all([
                prisma.orderTicket.create({
                    data: {
                        orderId: order1.id,
                        ticketNumber: "TEST-004",
                        paymentMethod: PaymentMethod.CASH,
                        isPaid: true,
                        isDelivered: false,
                    },
                }),
                prisma.orderTicket.create({
                    data: {
                        orderId: order2.id,
                        ticketNumber: "TEST-005",
                        paymentMethod: PaymentMethod.PAYPAY,
                        isPaid: false,
                        isDelivered: false,
                        transactionId: "PAYPAY-TX-002",
                    },
                }),
            ]);

            // 支払い済み伝票の検索
            const paidTickets = await orderTicketRepository.findByPaymentStatus(
                true
            );
            expect(paidTickets).toHaveLength(1);
            expect(paidTickets[0].ticketNumber).toBe("TEST-004");

            // 未払い伝票の検索
            const unpaidTickets =
                await orderTicketRepository.findByPaymentStatus(false);
            expect(unpaidTickets).toHaveLength(1);
            expect(unpaidTickets[0].ticketNumber).toBe("TEST-005");
        });
    });
});