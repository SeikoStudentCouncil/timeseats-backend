import type { ID } from "../types/id.js";
import type { Product } from "../models/product.js";
import type { ProductInventory } from "../models/product-inventory.js";
import type { ProductService } from "./product-service.js";
import type { ProductRepository } from "../repositories/product-repository.js";

/**
 * ProductServiceImpl - 商品サービスの実装クラス
 */
export class ProductServiceImpl implements ProductService {
    constructor(private readonly productRepository: ProductRepository) {}

    async getAllProducts(): Promise<Product[]> {
        return this.productRepository.findAll();
    }

    async getProductById(id: ID): Promise<Product | null> {
        return this.productRepository.findById(id);
    }

    async createProduct(
        product: Omit<Product, "id" | "createdAt" | "updatedAt">
    ): Promise<Product> {
        await this.productRepository.create({
            ...product,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 作成した商品を検索して返す
        const products = await this.productRepository.findAll();
        const created = products[products.length - 1];
        if (!created) {
            throw new Error("Failed to create product");
        }

        return created;
    }

    async updateProduct(
        id: ID,
        product: Partial<Omit<Product, "id" | "createdAt" | "updatedAt">>
    ): Promise<Product> {
        await this.productRepository.update(id, {
            ...product,
            updatedAt: new Date(),
        });

        const updated = await this.productRepository.findById(id);
        if (!updated) {
            throw new Error("Failed to update product");
        }

        return updated;
    }

    async deleteProduct(id: ID): Promise<boolean> {
        // 商品の存在確認
        const product = await this.productRepository.findById(id);
        if (!product) {
            throw new Error(`Product with ID ${id} not found`);
        }

        // 在庫情報の確認
        const inventory = await this.productRepository.findInventoryByProduct(
            id
        );
        if (inventory.length > 0) {
            const hasActiveInventory = inventory.some(
                (inv) => inv.soldQuantity > 0 || inv.reservedQuantity > 0
            );
            if (hasActiveInventory) {
                throw new Error("Cannot delete product with active inventory");
            }
        }

        await this.productRepository.delete(id);
        return true;
    }

    async setProductInventory(
        salesSlotId: ID,
        productId: ID,
        quantity: number
    ): Promise<ProductInventory> {
        // 商品が存在するか確認
        const product = await this.productRepository.findById(productId);
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }

        // 既存の在庫情報を検索
        const existingInventory =
            await this.productRepository.findInventoryByProductAndSalesSlot(
                productId,
                salesSlotId
            );

        if (existingInventory) {
            // 既存の在庫情報を更新
            return this.productRepository.updateInventory(
                existingInventory.id,
                {
                    initialQuantity: quantity,
                    // 既存の予約・販売数は保持
                    reservedQuantity: existingInventory.reservedQuantity,
                    soldQuantity: existingInventory.soldQuantity,
                }
            );
        } else {
            // 新規在庫情報を作成
            return this.productRepository.createInventory({
                productId,
                salesSlotId,
                initialQuantity: quantity,
                reservedQuantity: 0,
                soldQuantity: 0,
            });
        }
    }

    async getProductInventory(
        salesSlotId: ID,
        productId: ID
    ): Promise<ProductInventory | null> {
        return this.productRepository.findInventoryByProductAndSalesSlot(
            productId,
            salesSlotId
        );
    }

    async getInventoryForSalesSlot(
        salesSlotId: ID
    ): Promise<ProductInventory[]> {
        return this.productRepository.findInventoryBySalesSlot(salesSlotId);
    }

    async getInventoryForProduct(productId: ID): Promise<ProductInventory[]> {
        return this.productRepository.findInventoryByProduct(productId);
    }
}
