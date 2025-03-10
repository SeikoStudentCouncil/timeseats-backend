import type { ID } from "../types/id.js";
import type { SalesSlot } from "../models/sales-slot.js";
import type { ProductInventory } from "../models/index.js";

/**
 * SalesSlotService - 販売枠サービスのインターフェース
 */
export interface SalesSlotService {
    /**
     * 全販売枠を取得します
     */
    getAllSalesSlots(): Promise<SalesSlot[]>;

    /**
     * IDによって販売枠を取得します
     */
    getSalesSlotById(id: ID): Promise<SalesSlot | null>;

    /**
     * 有効な（アクティブな）販売枠のみを取得します
     */
    getActiveSalesSlots(): Promise<SalesSlot[]>;

    /**
     * 特定の時間範囲の販売枠を取得します
     */
    getSalesSlotsByTimeRange(start: Date, end: Date): Promise<SalesSlot[]>;

    /**
     * 新しい販売枠を作成します
     */
    createSalesSlot(
        salesSlot: Omit<SalesSlot, "id" | "createdAt" | "updatedAt">
    ): Promise<SalesSlot>;

    /**
     * 既存の販売枠を更新します
     */
    updateSalesSlot(
        id: ID,
        salesSlot: Partial<Omit<SalesSlot, "id" | "createdAt" | "updatedAt">>
    ): Promise<SalesSlot>;

    /**
     * 販売枠を削除します
     */
    deleteSalesSlot(id: ID): Promise<boolean>;

    /**
     * 販売枠のアクティブ状態を切り替えます
     */
    toggleSalesSlotActive(id: ID, isActive: boolean): Promise<SalesSlot>;

    /**
     * 販売枠の在庫情報をすべて取得します
     */
    getSalesSlotInventory(salesSlotId: ID): Promise<ProductInventory[]>;

    /**
     * 現在アクティブな（現在時刻に該当する）販売枠を取得します
     */
    getCurrentSalesSlot(): Promise<SalesSlot | null>;

    /**
     * 次の販売枠を取得します
     */
    getNextSalesSlot(): Promise<SalesSlot | null>;
}
