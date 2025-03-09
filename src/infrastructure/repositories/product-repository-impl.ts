import { PrismaClient } from "@prisma/client";
import type { ProductRepository } from "../../domain/repositories/product-repository.js";
import type { Product } from "../../domain/models/product.js";
import type { ProductInventory } from "../../domain/models/product-inventory.js";
import type { ID } from "../../domain/types/id.js";

export class ProductRepositoryImpl implements ProductRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findById(id: ID): Promise<Product | null> {
        return this.prisma.product.findUnique({
            where: { id },
        });
    }

    async findAll(): Promise<Product[]> {
        return this.prisma.product.findMany();
    }

    async create(entity: Omit<Product, "id">): Promise<void> {
        await this.prisma.product.create({
            data: entity,
        });
    }

    async update(id: ID, entity: Partial<Product>): Promise<void> {
        await this.prisma.product.update({
            where: { id },
            data: entity,
        });
    }

    async delete(id: ID): Promise<void> {
        await this.prisma.product.delete({
            where: { id },
        });
    }

    async findWithInventory(id: ID): Promise<{
        product: Product;
        inventory: ProductInventory[];
    } | null> {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                inventory: true,
            },
        });

        if (!product) return null;

        return {
            product,
            inventory: product.inventory,
        };
    }

    async findBySalesSlot(salesSlotId: ID): Promise<
        Array<{
            product: Product;
            inventory: ProductInventory;
        }>
    > {
        const inventories = await this.prisma.productInventory.findMany({
            where: { salesSlotId },
            include: {
                product: true,
            },
        });

        return inventories.map((inv) => ({
            product: inv.product,
            inventory: inv,
        }));
    }

    async findInventoryByProductAndSalesSlot(
        productId: ID,
        salesSlotId: ID
    ): Promise<ProductInventory | null> {
        return this.prisma.productInventory.findUnique({
            where: {
                salesSlotId_productId: {
                    salesSlotId,
                    productId,
                },
            },
        });
    }

    async updateInventory(
        id: ID,
        inventory: Partial<
            Omit<
                ProductInventory,
                "id" | "productId" | "salesSlotId" | "createdAt" | "updatedAt"
            >
        >
    ): Promise<ProductInventory> {
        return this.prisma.productInventory.update({
            where: { id },
            data: inventory,
        });
    }

    async createInventory(
        inventory: Omit<ProductInventory, "id" | "createdAt" | "updatedAt">
    ): Promise<ProductInventory> {
        return this.prisma.productInventory.create({
            data: inventory,
        });
    }

    async findInventoryBySalesSlot(
        salesSlotId: ID
    ): Promise<ProductInventory[]> {
        return this.prisma.productInventory.findMany({
            where: { salesSlotId },
        });
    }

    async findInventoryByProduct(productId: ID): Promise<ProductInventory[]> {
        return this.prisma.productInventory.findMany({
            where: { productId },
        });
    }

    async findAvailable(
        salesSlotId: ID,
        includeReserved: boolean = false
    ): Promise<
        Array<{
            product: Product;
            inventory: ProductInventory;
        }>
    > {
        const inventories = await this.prisma.productInventory.findMany({
            where: {
                salesSlotId,
            },
            include: {
                product: true,
            },
        });

        return inventories
            .filter((inv) => {
                const remainingQuantity = includeReserved
                    ? inv.initialQuantity - inv.soldQuantity
                    : inv.initialQuantity -
                      inv.soldQuantity -
                      inv.reservedQuantity;
                return remainingQuantity > 0;
            })
            .map((inv) => ({
                product: inv.product,
                inventory: inv,
            }));
    }

    async getInventorySummary(productId: ID): Promise<
        Array<{
            salesSlotId: ID;
            initialQuantity: number;
            reservedQuantity: number;
            soldQuantity: number;
            availableQuantity: number;
        }>
    > {
        const inventories = await this.prisma.productInventory.findMany({
            where: { productId },
            select: {
                salesSlotId: true,
                initialQuantity: true,
                reservedQuantity: true,
                soldQuantity: true,
            },
        });

        return inventories.map((inv) => ({
            ...inv,
            availableQuantity:
                inv.initialQuantity - inv.reservedQuantity - inv.soldQuantity,
        }));
    }

    async searchByName(query: string): Promise<Product[]> {
        return this.prisma.product.findMany({
            where: {
                name: {
                    contains: query,
                    mode: "insensitive",
                },
            },
        });
    }
}
