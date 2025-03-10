import type { ID } from "../types/id.js";
import type { Product } from "../models/product.js";
import type { ProductInventory } from "../models/index.js";

/**
 * ProductService - 商品サービスのインターフェース
 */
export interface ProductService {
    /**
     * 全商品を取得します
     */
    getAllProducts(): Promise<Product[]>;

    /**
     * IDによって商品を取得します
     */
    getProductById(id: ID): Promise<Product | null>;

    /**
     * 新しい商品を作成します
     */
    createProduct(
        product: Omit<Product, "id" | "createdAt" | "updatedAt">
    ): Promise<Product>;

    /**
     * 既存の商品を更新します
     */
    updateProduct(
        id: ID,
        product: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>
    ): Promise<Product>;

    /**
     * 商品を削除します
     */
    deleteProduct(id: ID): Promise<boolean>;

    /**
     * 特定の販売枠における商品在庫を設定します
     */
    setProductInventory(
        salesSlotId: ID,
        productId: ID,
        quantity: number
    ): Promise<ProductInventory>;

    /**
     * 特定の販売枠における商品の在庫を取得します
     */
    getProductInventory(
        salesSlotId: ID,
        productId: ID
    ): Promise<ProductInventory | null>;

    /**
     * 特定の販売枠における全商品の在庫を取得します
     */
    getInventoryForSalesSlot(salesSlotId: ID): Promise<ProductInventory[]>;

    /**
     * 特定の商品の全販売枠における在庫を取得します
     */
    getInventoryForProduct(productId: ID): Promise<ProductInventory[]>;
}
