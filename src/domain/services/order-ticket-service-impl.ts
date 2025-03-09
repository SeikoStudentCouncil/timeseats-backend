import type { ID } from "../types/id.js";
import type { OrderTicket } from "../models/order-ticket.js";
import type { PaymentMethod } from "../types/payment-method.js";
import { OrderStatus } from "../types/order-status.js";
import type { OrderTicketService } from "./order-ticket-service.js";
import type { OrderTicketRepository } from "../repositories/order-ticket-repository.js";
import type { OrderRepository } from "../repositories/order-repository.js";

/**
 * OrderTicketServiceImpl - 伝票サービスの実装クラス
 */
export class OrderTicketServiceImpl implements OrderTicketService {
    constructor(
        private readonly orderTicketRepository: OrderTicketRepository,
        private readonly orderRepository: OrderRepository
    ) {}

    async getAllTickets(): Promise<OrderTicket[]> {
        return this.orderTicketRepository.findAll();
    }

    async getTicketById(id: ID): Promise<OrderTicket | null> {
        return this.orderTicketRepository.findById(id);
    }

    async getTicketByNumber(ticketNumber: string): Promise<OrderTicket | null> {
        return this.orderTicketRepository.findByTicketNumber(ticketNumber);
    }

    async getTicketByOrderId(orderId: ID): Promise<OrderTicket | null> {
        return this.orderTicketRepository.findByOrderId(orderId);
    }

    async createTicket(
        orderId: ID,
        paymentMethod: PaymentMethod,
        transactionId?: string
    ): Promise<OrderTicket> {
        // 注文が存在するか確認
        const order = await this.orderRepository.findById(orderId);
        if (!order) {
            throw new Error(`Order with ID ${orderId} not found`);
        }

        // 既存のチケットがないか確認
        const existingTicket = await this.orderTicketRepository.findByOrderId(
            orderId
        );
        if (existingTicket) {
            throw new Error(`Ticket already exists for order ${orderId}`);
        }

        // チケット番号を生成
        const ticketNumber = this.generateTicketNumber();

        // チケットを作成
        await this.orderTicketRepository.create({
            ticketNumber,
            orderId,
            paymentMethod,
            transactionId,
            isPaid: true, // デフォルトで支払い済みとして作成（必要に応じて変更可）
            isDelivered: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 作成されたチケットを取得して返す
        const ticket = await this.orderTicketRepository.findByOrderId(orderId);
        if (!ticket) {
            throw new Error("Failed to create ticket");
        }

        return ticket;
    }

    async updatePaymentStatus(id: ID, isPaid: boolean): Promise<OrderTicket> {
        const ticket = await this.orderTicketRepository.findById(id);
        if (!ticket) {
            throw new Error(`Ticket with ID ${id} not found`);
        }

        // 支払い状態を更新
        await this.orderTicketRepository.update(id, {
            isPaid,
            updatedAt: new Date(),
        });

        // 更新後のチケットを取得して返す
        const updatedTicket = await this.orderTicketRepository.findById(id);
        if (!updatedTicket) {
            throw new Error("Failed to update ticket");
        }

        return updatedTicket;
    }

    async updateDeliveryStatus(
        id: ID,
        isDelivered: boolean
    ): Promise<OrderTicket> {
        const ticket = await this.orderTicketRepository.findById(id);
        if (!ticket) {
            throw new Error(`Ticket with ID ${id} not found`);
        }

        // 商品引き渡し状態を更新
        await this.orderTicketRepository.update(id, {
            isDelivered,
            updatedAt: new Date(),
        });

        // 更新後のチケットを取得
        const updatedTicket = await this.orderTicketRepository.findById(id);
        if (!updatedTicket) {
            throw new Error("Failed to update ticket");
        }

        // 関連する注文のステータスも更新（引き渡し完了時）
        if (isDelivered) {
            await this.orderRepository.updateStatus(
                ticket.orderId,
                OrderStatus.CONFIRMED
            );
        }

        return updatedTicket;
    }

    async deleteTicket(id: ID): Promise<boolean> {
        const ticket = await this.orderTicketRepository.findById(id);
        if (!ticket) {
            throw new Error(`Ticket with ID ${id} not found`);
        }

        // 基本的に伝票は削除せず、無効化する処理が望ましい
        // ここでは特殊ケース用に削除機能を提供
        await this.orderTicketRepository.delete(id);
        return true;
    }

    async getPaidTickets(): Promise<OrderTicket[]> {
        return this.orderTicketRepository.findByPaymentStatus(true);
    }

    async getUnpaidTickets(): Promise<OrderTicket[]> {
        return this.orderTicketRepository.findByPaymentStatus(false);
    }

    async getDeliveredTickets(): Promise<OrderTicket[]> {
        return this.orderTicketRepository.findByDeliveryStatus(true);
    }

    async getUndeliveredTickets(): Promise<OrderTicket[]> {
        return this.orderTicketRepository.findByDeliveryStatus(false);
    }

    /**
     * チケット番号を生成する補助メソッド
     */
    private generateTicketNumber(): string {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, "0");
        return `T${timestamp}${random}`;
    }
}
