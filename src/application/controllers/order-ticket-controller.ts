import type { Context } from "hono";
import type { OrderTicketService } from "../../domain/services/order-ticket-service.js";
import { OrderTicketValidator } from "../validators/index.js";
import { logger } from "../../api/middlewares/index.js";

export class OrderTicketController {
    constructor(private readonly orderTicketService: OrderTicketService) {}

    async getAllTickets(c: Context) {
        try {
            const tickets = await this.orderTicketService.getAllTickets();
            return c.json(tickets);
        } catch (error) {
            logger.error("Error getting all tickets:", error);
            return c.json({ error: "チケット一覧の取得に失敗しました" }, 500);
        }
    }

    async getTicketById(c: Context) {
        try {
            const id = c.req.param("id");
            const ticket = await this.orderTicketService.getTicketById(id);

            if (!ticket) {
                return c.json({ error: "チケットが見つかりません" }, 404);
            }

            return c.json(ticket);
        } catch (error) {
            logger.error("Error getting ticket:", error);
            return c.json({ error: "チケットの取得に失敗しました" }, 500);
        }
    }

    async getTicketByNumber(c: Context) {
        try {
            const ticketNumber = c.req.param("number");
            const ticket = await this.orderTicketService.getTicketByNumber(
                ticketNumber
            );

            if (!ticket) {
                return c.json({ error: "チケットが見つかりません" }, 404);
            }

            return c.json(ticket);
        } catch (error) {
            logger.error("Error getting ticket by number:", error);
            return c.json({ error: "チケットの取得に失敗しました" }, 500);
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
            logger.error("Error creating ticket:", error);
            return c.json({ error: "チケットの作成に失敗しました" }, 400);
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
            logger.error("Error updating payment status:", error);
            return c.json({ error: "支払い状態の更新に失敗しました" }, 400);
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
            logger.error("Error updating delivery status:", error);
            return c.json({ error: "引き渡し状態の更新に失敗しました" }, 400);
        }
    }

    async deleteTicket(c: Context) {
        try {
            const id = c.req.param("id");
            const result = await this.orderTicketService.deleteTicket(id);

            if (!result) {
                return c.json({ error: "チケットが見つかりません" }, 404);
            }

            return c.body(null, 204);
        } catch (error) {
            logger.error("Error deleting ticket:", error);
            return c.json({ error: "チケットの削除に失敗しました" }, 500);
        }
    }

    async getPaidTickets(c: Context) {
        try {
            const tickets = await this.orderTicketService.getPaidTickets();
            return c.json(tickets);
        } catch (error) {
            logger.error("Error getting paid tickets:", error);
            return c.json(
                { error: "支払い済みチケットの取得に失敗しました" },
                500
            );
        }
    }

    async getUnpaidTickets(c: Context) {
        try {
            const tickets = await this.orderTicketService.getUnpaidTickets();
            return c.json(tickets);
        } catch (error) {
            logger.error("Error getting unpaid tickets:", error);
            return c.json({ error: "未払いチケットの取得に失敗しました" }, 500);
        }
    }

    async getTicketByOrder(c: Context) {
        try {
            const orderId = c.req.param("orderId");
            const ticket = await this.orderTicketService.getTicketByOrderId(
                orderId
            );
            if (!ticket) {
                return c.json({ error: "チケットが見つかりません" }, 404);
            }
            return c.json(ticket);
        } catch (error) {
            logger.error("Error getting ticket by order:", error);
            return c.json({ error: "チケットの取得に失敗しました" }, 500);
        }
    }

    async getDeliveredTickets(c: Context) {
        try {
            const tickets = await this.orderTicketService.getDeliveredTickets();
            return c.json(tickets);
        } catch (error) {
            logger.error("Error getting delivered tickets:", error);
            return c.json(
                { error: "引き渡し済みチケットの取得に失敗しました" },
                500
            );
        }
    }

    async getUndeliveredTickets(c: Context) {
        try {
            const tickets =
                await this.orderTicketService.getUndeliveredTickets();
            return c.json(tickets);
        } catch (error) {
            logger.error("Error getting undelivered tickets:", error);
            return c.json(
                { error: "未引き渡しチケットの取得に失敗しました" },
                500
            );
        }
    }
}
