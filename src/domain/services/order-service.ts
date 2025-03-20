import type { ID } from "../types/id.js";
import type { Order } from "../models/order.js";
import type { OrderStatus } from "../types/order-status.js";
import type { OrderTicket } from "../models/order-ticket.js";
import type { PaymentMethod } from "../types/payment-method.js";

/**
 * OrderService - 注文サービスのインターフェース
 */
export interface OrderService {
    /**
     * 全注文を取得します
     */
    getAllOrders(): Promise<Order[]>;

    /**
     * IDによって注文を取得します
     */
    getOrderById(id: ID): Promise<Order | null>;

    /**
     * 特定のステータスの注文を取得します
     */
    getOrdersByStatus(status: OrderStatus): Promise<Order[]>;

    /**
     * 特定の販売枠の注文を取得します
     */
    getOrdersBySalesSlot(salesSlotId: ID): Promise<Order[]>;

    /**
     * 仮予約（注文）を作成します
     * @param salesSlotId 販売枠ID
     * @param items 注文商品の配列 [{productId: ID, quantity: number}]
     * @returns 作成された注文
     */
    createReservation(
        salesSlotId: ID,
        items: Array<{ productId: ID; quantity: number }>
    ): Promise<Order>;

    /**
     * 仮予約を確定注文に変更します（決済完了時）
     * @param orderId 注文ID
     * @param paymentMethod 支払い方法
     * @param ticketNumber 伝票番号
     * @param transactionId 決済トランザクションID（電子決済の場合）
     * @returns 作成された伝票
     */
    confirmOrder(
        orderId: ID,
        paymentMethod: PaymentMethod,
        ticketNumber: string,
        transactionId?: string
    ): Promise<OrderTicket>;

    /**
     * 仮予約をキャンセルします
     * @param orderId 注文ID
     * @returns キャンセル成功したかどうか
     */
    cancelReservation(orderId: ID): Promise<boolean>;

    /**
     * 伝票番号から注文を検索します
     * @param ticketNumber 伝票番号
     * @returns 該当する注文
     */
    getOrderByTicketNumber(ticketNumber: string): Promise<Order | null>;

    /**
     * 注文の商品受け渡し完了を記録します
     * @param ticketId 伝票ID
     * @returns 更新された伝票
     */
    markOrderAsDelivered(ticketId: ID): Promise<OrderTicket>;
}
