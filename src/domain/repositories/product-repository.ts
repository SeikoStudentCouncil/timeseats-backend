import type { Repository } from "./repository.js";
import type { Product } from "../models/product.js";
import type { ProductInventory } from "../models/product-inventory.js";
import type { ID } from "../types/id.js";

/**
 * 商品リポジトリのインターフェース
 * 基本的なCRUD操作に加え、商品特有の検索機能を提供します
 */
export interface ProductRepository extends Repository<Product> {
    /**
     * 在庫情報を含めた商品情報の取得
     * @param id 商品ID
     */
    findWithInventory(id: ID): Promise<{
        product: Product;
        inventory: ProductInventory[];
    } | null>;

    /**
     * 特定の販売枠での商品一覧を取得
     * @param salesSlotId 販売枠ID
     */
    findBySalesSlot(salesSlotId: ID): Promise<
        Array<{
            product: Product;
            inventory: ProductInventory;
        }>
    >;

    /**
     * 在庫がある商品のみを取得
     * @param salesSlotId 販売枠ID
     * @param includeReserved 予約済み在庫を含めるかどうか
     */
    findAvailable(
        salesSlotId: ID,
        includeReserved?: boolean
    ): Promise<
        Array<{
            product: Product;
            inventory: ProductInventory;
        }>
    >;

    /**
     * 商品の在庫サマリーを取得
     * @param productId 商品ID
     */
    getInventorySummary(productId: ID): Promise<
        Array<{
            salesSlotId: ID;
            initialQuantity: number;
            reservedQuantity: number;
            soldQuantity: number;
            availableQuantity: number;
        }>
    >;

    /**
     * 商品名による検索
     * @param query 検索クエリ
     */
    searchByName(query: string): Promise<Product[]>;
}
