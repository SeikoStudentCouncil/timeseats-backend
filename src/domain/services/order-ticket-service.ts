import type { ID } from "../types/id.js";
import type { OrderTicket } from "../models/order-ticket.js";
import type { PaymentMethod } from "../types/payment-method.js";

/**
 * OrderTicketService - 伝票サービスのインターフェース
 */
export interface OrderTicketService {
    /**
     * 全ての伝票を取得します
     */
    getAllTickets(): Promise<OrderTicket[]>;

    /**
     * IDによって伝票を取得します
     */
    getTicketById(id: ID): Promise<OrderTicket | null>;

    /**
     * 伝票番号によって伝票を取得します
     */
    getTicketByNumber(ticketNumber: string): Promise<OrderTicket | null>;

    /**
     * 注文IDによって伝票を取得します
     */
    getTicketByOrderId(orderId: ID): Promise<OrderTicket | null>;

    /**
     * 新しい伝票を作成します
     */
    createTicket(
        orderId: ID,
        paymentMethod: PaymentMethod,
        transactionId?: string
    ): Promise<OrderTicket>;

    /**
     * 伝票の支払い状態を更新します
     */
    updatePaymentStatus(id: ID, isPaid: boolean): Promise<OrderTicket>;

    /**
     * 伝票の商品引き渡し状態を更新します
     */
    updateDeliveryStatus(id: ID, isDelivered: boolean): Promise<OrderTicket>;

    /**
     * 伝票を削除します（通常は使用しません、特殊ケース用）
     */
    deleteTicket(id: ID): Promise<boolean>;

    /**
     * 支払い済みの伝票一覧を取得します
     */
    getPaidTickets(): Promise<OrderTicket[]>;

    /**
     * 未払いの伝票一覧を取得します
     */
    getUnpaidTickets(): Promise<OrderTicket[]>;

    /**
     * 引き渡し済みの伝票一覧を取得します
     */
    getDeliveredTickets(): Promise<OrderTicket[]>;

    /**
     * 未引き渡しの伝票一覧を取得します
     */
    getUndeliveredTickets(): Promise<OrderTicket[]>;
}
