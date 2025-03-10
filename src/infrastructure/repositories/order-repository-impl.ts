import { PrismaClient } from "@prisma/client";
import type { OrderRepository } from "@/domain/repositories/order-repository.js";
import type { Order } from "@/domain/models/index.js";
import type { OrderTicket } from "@/domain/models/index.js";
import type { OrderItem } from "@/domain/models/index.js";
import type { ID } from "@/domain/types/id.js";
import type { OrderStatus } from "@/domain/types/order-status.js";
import type { PaymentMethod } from "@/domain/types/payment-method.js";

export class OrderRepositoryImpl implements OrderRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private mapToOrder(data: any): Order {
        return {
            id: data.id,
            salesSlotId: data.salesSlotId,
            status: data.status as OrderStatus,
            items: data.items.map(
                (item: any): OrderItem => ({
                    id: item.id,
                    orderId: data.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.price,
                })
            ),
            totalAmount: data.totalAmount,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    }

    private mapToOrderTicket(data: any): OrderTicket {
        return {
            id: data.id,
            ticketNumber: data.ticketNumber,
            orderId: data.orderId,
            paymentMethod: data.paymentMethod as PaymentMethod,
            transactionId: data.transactionId,
            isPaid: data.isPaid,
            isDelivered: data.isDelivered,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    }

    async findById(id: ID): Promise<Order | null> {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });
        return order ? this.mapToOrder(order) : null;
    }

    async findAll(): Promise<Order[]> {
        const orders = await this.prisma.order.findMany({
            include: {
                items: true,
            },
        });
        return orders.map(this.mapToOrder);
    }

    async create(entity: Omit<Order, "id">): Promise<void> {
        await this.createOrder(entity);
    }

    async createOrder(data: {
        salesSlotId: ID;
        status: OrderStatus;
        items: Array<{
            productId: ID;
            quantity: number;
            price: number;
        }>;
        totalAmount: number;
        createdAt: Date;
        updatedAt: Date;
    }): Promise<Order> {
        const order = await this.prisma.order.create({
            data: {
                salesSlotId: data.salesSlotId,
                status: data.status,
                totalAmount: data.totalAmount,
                createdAt: data.createdAt,
                updatedAt: data.updatedAt,
                items: {
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
            include: {
                items: true,
            },
        });

        return this.mapToOrder(order);
    }

    async update(id: ID, entity: Partial<Order>): Promise<void> {
        const { items, ...orderData } = entity;
        await this.prisma.order.update({
            where: { id },
            data: {
                ...orderData,
                ...(items && {
                    items: {
                        deleteMany: {},
                        create: items.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                        })),
                    },
                }),
            },
        });
    }

    async delete(id: ID): Promise<void> {
        await this.prisma.order.delete({
            where: { id },
        });
    }

    async findBySalesSlotId(salesSlotId: ID): Promise<Order[]> {
        const orders = await this.prisma.order.findMany({
            where: { salesSlotId },
            include: {
                items: true,
            },
        });
        return orders.map(this.mapToOrder);
    }

    async findByStatus(status: OrderStatus): Promise<Order[]> {
        const orders = await this.prisma.order.findMany({
            where: { status },
            include: {
                items: true,
            },
        });
        return orders.map(this.mapToOrder);
    }

    async findWithTicket(orderId: ID): Promise<{
        order: Order;
        ticket: OrderTicket | null;
    } | null> {
        const result = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                ticket: true,
            },
        });

        if (!result) return null;

        return {
            order: this.mapToOrder(result),
            ticket: result.ticket ? this.mapToOrderTicket(result.ticket) : null,
        };
    }

    async findBySalesSlotIdAndStatus(
        salesSlotId: ID,
        status: OrderStatus
    ): Promise<Order[]> {
        const orders = await this.prisma.order.findMany({
            where: {
                salesSlotId,
                status,
            },
            include: {
                items: true,
            },
        });
        return orders.map(this.mapToOrder);
    }

    async updateStatus(orderId: ID, status: OrderStatus): Promise<Order> {
        const order = await this.prisma.order.update({
            where: { id: orderId },
            data: { status },
            include: {
                items: true,
            },
        });
        return this.mapToOrder(order);
    }

    async findByTimeRange(startTime: Date, endTime: Date): Promise<Order[]> {
        const orders = await this.prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startTime,
                    lte: endTime,
                },
            },
            include: {
                items: true,
            },
        });
        return orders.map(this.mapToOrder);
    }

    async countBySalesSlot(salesSlotId: ID): Promise<{
        total: number;
        byStatus: Record<OrderStatus, number>;
    }> {
        const orders = await this.prisma.order.findMany({
            where: { salesSlotId },
            select: {
                status: true,
            },
        });

        const byStatus = orders.reduce((acc, order) => {
            const status = order.status as OrderStatus;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {} as Record<OrderStatus, number>);

        return {
            total: orders.length,
            byStatus,
        };
    }
}
