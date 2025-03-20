import type { Context } from "hono";
import type { OrderService } from "../../domain/services/order-service.js";
import type { PaymentMethod } from "../../domain/types/index.js";
import type { OrderStatus } from "../../domain/types/index.js";

export class OrderController {
    constructor(private readonly orderService: OrderService) {}

    async getAllOrders(c: Context) {
        try {
            const orders = await this.orderService.getAllOrders();
            return c.json(orders);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async getOrderById(c: Context) {
        try {
            const id = c.req.param("id");
            const order = await this.orderService.getOrderById(id);
            if (!order) {
                return c.json({ error: "Order not found" }, 404);
            }
            return c.json(order);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async createOrder(c: Context) {
        try {
            const data = await c.req.json();
            const { salesSlotId, items } = data;
            const order = await this.orderService.createReservation(
                salesSlotId,
                items
            );
            return c.json(order, 201);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async confirmOrder(c: Context) {
        try {
            const orderId = c.req.param("id");
            const { paymentMethod, transactionId, ticketNumber } = await c.req.json();
            const orderTicket = await this.orderService.confirmOrder(
                orderId,
                paymentMethod as PaymentMethod,
                ticketNumber,
                transactionId
            );
            return c.json(orderTicket);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async cancelOrder(c: Context) {
        try {
            const id = c.req.param("id");
            await this.orderService.cancelReservation(id);
            return c.body(null, 204);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async getOrdersByStatus(c: Context) {
        try {
            const status = c.req.param("status") as OrderStatus;
            const orders = await this.orderService.getOrdersByStatus(status);
            return c.json(orders);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async getOrdersByTicketNumber(c: Context) {
        try {
            const ticketNumber = c.req.param("ticketNumber");
            const order = await this.orderService.getOrderByTicketNumber(
                ticketNumber
            );
            if (!order) {
                return c.json({ error: "Order not found" }, 404);
            }
            return c.json(order);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }

    async markOrderAsDelivered(c: Context) {
        try {
            const id = c.req.param("id");
            const orderTicket = await this.orderService.markOrderAsDelivered(
                id
            );
            return c.json(orderTicket);
        } catch (error) {
            return c.json(
                {
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error",
                },
                500
            );
        }
    }
}
