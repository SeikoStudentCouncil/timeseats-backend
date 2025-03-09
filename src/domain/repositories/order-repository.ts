import type { Repository } from "./repository.js";
import type { Order } from "../models/order.js";
import type { OrderTicket } from "../models/order-ticket.js";
import type { ID } from "../types/id.js";
import type { OrderStatus } from "../types/order-status.js";

/**
 * 注文リポジトリのインターフェース
 * 基本的なCRUD操作に加え、注文特有の検索機能を提供します
 */
export interface OrderRepository extends Repository<Order> {
    /**
     * 販売枠IDによる注文検索
     * @param salesSlotId 販売枠ID
     */
    findBySalesSlotId(salesSlotId: ID): Promise<Order[]>;

    /**
     * 注文ステータスによる検索
     * @param status 注文ステータス
     */
    findByStatus(status: OrderStatus): Promise<Order[]>;

    /**
     * チケット情報を含む注文の取得
     * @param orderId 注文ID
     */
    findWithTicket(orderId: ID): Promise<{
        order: Order;
        ticket: OrderTicket | null;
    } | null>;

    /**
     * 特定の販売枠の注文をステータスで検索
     * @param salesSlotId 販売枠ID
     * @param status 注文ステータス
     */
    findBySalesSlotIdAndStatus(
        salesSlotId: ID,
        status: OrderStatus
    ): Promise<Order[]>;

    /**
     * 注文のステータスを更新
     * @param orderId 注文ID
     * @param status 新しい注文ステータス
     */
    updateStatus(orderId: ID, status: OrderStatus): Promise<Order>;

    /**
     * 特定の時間範囲の注文を取得
     * @param startTime 開始時間
     * @param endTime 終了時間
     */
    findByTimeRange(startTime: Date, endTime: Date): Promise<Order[]>;

    /**
     * 特定の販売枠の注文数を集計
     * @param salesSlotId 販売枠ID
     */
    countBySalesSlot(salesSlotId: ID): Promise<{
        total: number;
        byStatus: Record<OrderStatus, number>;
    }>;
}
