import type { Repository } from "./repository.js";
import type { SalesSlot } from "../models/sales-slot.js";
import type { ID } from "../types/id.js";

/**
 * 販売枠リポジトリのインターフェース
 * 基本的なCRUD操作に加え、販売枠特有の検索機能を提供します
 */
export interface SalesSlotRepository extends Repository<SalesSlot> {
    /**
     * 指定された時間帯に該当する販売枠を取得
     * @param time 検索する時間
     */
    findByTime(time: Date): Promise<SalesSlot[]>;

    /**
     * 指定された期間内の販売枠を取得
     * @param startTime 期間開始時間
     * @param endTime 期間終了時間
     */
    findByTimeRange(startTime: Date, endTime: Date): Promise<SalesSlot[]>;

    /**
     * アクティブな販売枠を取得
     * isActiveがtrueの販売枠のみを返します
     */
    findActive(): Promise<SalesSlot[]>;

    /**
     * 在庫情報を含む販売枠を取得
     * @param id 販売枠ID
     */
    findWithInventory(id: ID): Promise<{
        salesSlot: SalesSlot;
        inventory: Array<{
            productId: ID;
            initialQuantity: number;
            reservedQuantity: number;
            soldQuantity: number;
        }>;
    } | null>;

    /**
     * 在庫情報を含むアクティブな販売枠を全て取得
     */
    findActiveWithInventory(): Promise<
        Array<{
            salesSlot: SalesSlot;
            inventory: Array<{
                productId: ID;
                initialQuantity: number;
                reservedQuantity: number;
                soldQuantity: number;
            }>;
        }>
    >;

    /**
     * 販売枠のアクティブ状態を更新
     * @param id 販売枠ID
     * @param isActive アクティブ状態
     */
    updateActiveStatus(id: ID, isActive: boolean): Promise<SalesSlot>;
}
