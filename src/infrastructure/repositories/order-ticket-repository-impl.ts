import { PrismaClient } from "@prisma/client";
import type { OrderTicketRepository } from "../../domain/repositories/order-ticket-repository.js";
import type { OrderTicket } from "../../domain/models/order-ticket.js";
import type { ID } from "../../domain/types/id.js";
import type { PaymentMethod } from "../../domain/types/payment-method.js";

export class OrderTicketRepositoryImpl implements OrderTicketRepository {
    constructor(private readonly prisma: PrismaClient) {}

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

    async findById(id: ID): Promise<OrderTicket | null> {
        const ticket = await this.prisma.orderTicket.findUnique({
            where: { id },
        });
        return ticket ? this.mapToOrderTicket(ticket) : null;
    }

    async findAll(): Promise<OrderTicket[]> {
        const tickets = await this.prisma.orderTicket.findMany();
        return tickets.map(this.mapToOrderTicket);
    }

    async create(entity: Omit<OrderTicket, "id">): Promise<void> {
        await this.prisma.orderTicket.create({
            data: entity,
        });
    }

    async update(id: ID, entity: Partial<OrderTicket>): Promise<void> {
        await this.prisma.orderTicket.update({
            where: { id },
            data: entity,
        });
    }

    async delete(id: ID): Promise<void> {
        await this.prisma.orderTicket.delete({
            where: { id },
        });
    }

    async findByTicketNumber(
        ticketNumber: string
    ): Promise<OrderTicket | null> {
        const ticket = await this.prisma.orderTicket.findUnique({
            where: { ticketNumber },
        });
        return ticket ? this.mapToOrderTicket(ticket) : null;
    }

    async findByOrderId(orderId: ID): Promise<OrderTicket | null> {
        const ticket = await this.prisma.orderTicket.findUnique({
            where: { orderId },
        });
        return ticket ? this.mapToOrderTicket(ticket) : null;
    }

    async findByPaymentMethod(
        paymentMethod: PaymentMethod
    ): Promise<OrderTicket[]> {
        const tickets = await this.prisma.orderTicket.findMany({
            where: { paymentMethod },
        });
        return tickets.map(this.mapToOrderTicket);
    }

    async findByPaymentStatus(isPaid: boolean): Promise<OrderTicket[]> {
        const tickets = await this.prisma.orderTicket.findMany({
            where: { isPaid },
        });
        return tickets.map(this.mapToOrderTicket);
    }

    async findByDeliveryStatus(isDelivered: boolean): Promise<OrderTicket[]> {
        const tickets = await this.prisma.orderTicket.findMany({
            where: { isDelivered },
        });
        return tickets.map(this.mapToOrderTicket);
    }

    async updatePaymentStatus(
        id: ID,
        isPaid: boolean,
        transactionId?: string
    ): Promise<OrderTicket> {
        const ticket = await this.prisma.orderTicket.update({
            where: { id },
            data: {
                isPaid,
                ...(transactionId && { transactionId }),
            },
        });
        return this.mapToOrderTicket(ticket);
    }

    async updateDeliveryStatus(
        id: ID,
        isDelivered: boolean
    ): Promise<OrderTicket> {
        const ticket = await this.prisma.orderTicket.update({
            where: { id },
            data: { isDelivered },
        });
        return this.mapToOrderTicket(ticket);
    }

    async findByTimeRange(
        startTime: Date,
        endTime: Date
    ): Promise<OrderTicket[]> {
        const tickets = await this.prisma.orderTicket.findMany({
            where: {
                createdAt: {
                    gte: startTime,
                    lte: endTime,
                },
            },
        });
        return tickets.map(this.mapToOrderTicket);
    }

    async getDailySummary(date: Date): Promise<{
        total: number;
        byPaymentMethod: Record<PaymentMethod, number>;
        paid: number;
        delivered: number;
    }> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const tickets = await this.prisma.orderTicket.findMany({
            where: {
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
        });

        const byPaymentMethod = tickets.reduce((acc, ticket) => {
            const method = ticket.paymentMethod as PaymentMethod;
            acc[method] = (acc[method] || 0) + 1;
            return acc;
        }, {} as Record<PaymentMethod, number>);

        return {
            total: tickets.length,
            byPaymentMethod,
            paid: tickets.filter((t) => t.isPaid).length,
            delivered: tickets.filter((t) => t.isDelivered).length,
        };
    }
}
