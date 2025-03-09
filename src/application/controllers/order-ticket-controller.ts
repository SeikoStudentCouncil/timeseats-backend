import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { OrderTicketService } from "../../domain/services/order-ticket-service.js";
import { OrderTicketValidator } from "../validators/order-ticket-validator.js";
import { logger } from "../../api/middlewares/logger.js";

export class OrderTicketController {
    constructor(private readonly orderTicketService: OrderTicketService) {}

    async getAllTickets(c: Context) {
        try {
            const tickets = await this.orderTicketService.getAllTickets();
            return c.json(tickets);
        } catch (error) {
            logger.error("Error getting all tickets:", error);
            throw new HTTPException(500, {
                message: "チケット一覧の取得に失敗しました",
            });
        }
    }

    async getTicketById(c: Context) {
        try {
            const id = c.req.param("id");
            const ticket = await this.orderTicketService.getTicketById(id);

            if (!ticket) {
                throw new HTTPException(404, {
                    message: "チケットが見つかりません",
                });
            }

            return c.json(ticket);
        } catch (error) {
            if (error instanceof HTTPException) throw error;
            logger.error("Error getting ticket:", error);
            throw new HTTPException(500, {
                message: "チケットの取得に失敗しました",
            });
        }
    }

    async getTicketByNumber(c: Context) {
        try {
            const ticketNumber = c.req.param("number");
            const ticket = await this.orderTicketService.getTicketByNumber(
                ticketNumber
            );

            if (!ticket) {
                throw new HTTPException(404, {
                    message: "チケットが見つかりません",
                });
            }

            return c.json(ticket);
        } catch (error) {
            if (error instanceof HTTPException) throw error;
            logger.error("Error getting ticket by number:", error);
            throw new HTTPException(500, {
                message: "チケットの取得に失敗しました",
            });
        }
    }

    async createTicket(c: Context) {
        try {
            const input = await c.req.json();
            const validatedData = OrderTicketValidator.validateCreate(input);

            const ticket = await this.orderTicketService.createTicket(
                validatedData.orderId,
                validatedData.paymentMethod,
                validatedData.transactionId
            );

            return c.json(ticket, 201);
        } catch (error) {
            if (error instanceof HTTPException) throw error;
            logger.error("Error creating ticket:", error);
            throw new HTTPException(400, {
                message: "チケットの作成に失敗しました",
            });
        }
    }

    async updatePaymentStatus(c: Context) {
        try {
            const id = c.req.param("id");
            const input = await c.req.json();
            const validatedData =
                OrderTicketValidator.validateUpdatePayment(input);

            const ticket = await this.orderTicketService.updatePaymentStatus(
                id,
                validatedData.isPaid
            );

            return c.json(ticket);
        } catch (error) {
            if (error instanceof HTTPException) throw error;
            logger.error("Error updating payment status:", error);
            throw new HTTPException(400, {
                message: "支払い状態の更新に失敗しました",
            });
        }
    }

    async updateDeliveryStatus(c: Context) {
        try {
            const id = c.req.param("id");
            const input = await c.req.json();
            const validatedData =
                OrderTicketValidator.validateUpdateDelivery(input);

            const ticket = await this.orderTicketService.updateDeliveryStatus(
                id,
                validatedData.isDelivered
            );

            return c.json(ticket);
        } catch (error) {
            if (error instanceof HTTPException) throw error;
            logger.error("Error updating delivery status:", error);
            throw new HTTPException(400, {
                message: "引き渡し状態の更新に失敗しました",
            });
        }
    }

    async deleteTicket(c: Context) {
        try {
            const id = c.req.param("id");
            const result = await this.orderTicketService.deleteTicket(id);

            if (!result) {
                throw new HTTPException(404, {
                    message: "チケットが見つかりません",
                });
            }

            return c.json({ success: true });
        } catch (error) {
            if (error instanceof HTTPException) throw error;
            logger.error("Error deleting ticket:", error);
            throw new HTTPException(500, {
                message: "チケットの削除に失敗しました",
            });
        }
    }

    async getPaidTickets(c: Context) {
        try {
            const tickets = await this.orderTicketService.getPaidTickets();
            return c.json(tickets);
        } catch (error) {
            logger.error("Error getting paid tickets:", error);
            throw new HTTPException(500, {
                message: "支払い済みチケットの取得に失敗しました",
            });
        }
    }

    async getUnpaidTickets(c: Context) {
        try {
            const tickets = await this.orderTicketService.getUnpaidTickets();
            return c.json(tickets);
        } catch (error) {
            logger.error("Error getting unpaid tickets:", error);
            throw new HTTPException(500, {
                message: "未払いチケットの取得に失敗しました",
            });
        }
    }
}
