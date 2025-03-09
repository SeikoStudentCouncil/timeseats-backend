import type { Repository } from "./repository.js";
import type { OrderTicket } from "../models/order-ticket.js";
import type { ID } from "../types/id.js";
import type { PaymentMethod } from "../types/payment-method.js";

/**
 * 注文チケットリポジトリのインターフェース
 * 基本的なCRUD操作に加え、チケット特有の検索・更新機能を提供します
 */
export interface OrderTicketRepository extends Repository<OrderTicket> {
    /**
     * チケット番号による検索
     * @param ticketNumber チケット番号
     */
    findByTicketNumber(ticketNumber: string): Promise<OrderTicket | null>;

    /**
     * 注文IDによる検索
     * @param orderId 注文ID
     */
    findByOrderId(orderId: ID): Promise<OrderTicket | null>;

    /**
     * 支払い方法による検索
     * @param paymentMethod 支払い方法
     */
    findByPaymentMethod(paymentMethod: PaymentMethod): Promise<OrderTicket[]>;

    /**
     * 支払い状態による検索
     * @param isPaid 支払い済みかどうか
     */
    findByPaymentStatus(isPaid: boolean): Promise<OrderTicket[]>;

    /**
     * 商品引渡し状態による検索
     * @param isDelivered 引渡し済みかどうか
     */
    findByDeliveryStatus(isDelivered: boolean): Promise<OrderTicket[]>;

    /**
     * 支払い状態を更新
     * @param id チケットID
     * @param isPaid 支払い状態
     * @param transactionId 決済トランザクションID（電子決済の場合）
     */
    updatePaymentStatus(
        id: ID,
        isPaid: boolean,
        transactionId?: string
    ): Promise<OrderTicket>;

    /**
     * 商品引渡し状態を更新
     * @param id チケットID
     * @param isDelivered 引渡し状態
     */
    updateDeliveryStatus(id: ID, isDelivered: boolean): Promise<OrderTicket>;

    /**
     * 特定の時間範囲のチケットを取得
     * @param startTime 開始時間
     * @param endTime 終了時間
     */
    findByTimeRange(startTime: Date, endTime: Date): Promise<OrderTicket[]>;

    /**
     * チケットの集計情報を取得
     * @param date 集計日
     */
    getDailySummary(date: Date): Promise<{
        total: number;
        byPaymentMethod: Record<PaymentMethod, number>;
        paid: number;
        delivered: number;
    }>;
}
