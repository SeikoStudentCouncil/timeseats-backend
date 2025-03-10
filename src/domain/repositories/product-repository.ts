import type { Repository } from "./repository.js";
import type { Product } from "../models/product.js";
import type { ProductInventory } from "@/domain/models/index.js";
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
     * 特定の商品と販売枠の在庫情報を取得
     * @param productId 商品ID
     * @param salesSlotId 販売枠ID
     */
    findInventoryByProductAndSalesSlot(
        productId: ID,
        salesSlotId: ID
    ): Promise<ProductInventory | null>;

    /**
     * 在庫情報を更新
     * @param id 在庫情報ID
     * @param inventory 更新する在庫情報
     */
    updateInventory(
        id: ID,
        inventory: Partial<
            Omit<
                ProductInventory,
                "id" | "productId" | "salesSlotId" | "createdAt" | "updatedAt"
            >
        >
    ): Promise<ProductInventory>;

    /**
     * 在庫情報を作成
     * @param inventory 作成する在庫情報
     */
    createInventory(
        inventory: Omit<ProductInventory, "id" | "createdAt" | "updatedAt">
    ): Promise<ProductInventory>;

    /**
     * 特定の販売枠の在庫情報を全て取得
     * @param salesSlotId 販売枠ID
     */
    findInventoryBySalesSlot(salesSlotId: ID): Promise<ProductInventory[]>;

    /**
     * 特定の商品の在庫情報を全て取得
     * @param productId 商品ID
     */
    findInventoryByProduct(productId: ID): Promise<ProductInventory[]>;

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
