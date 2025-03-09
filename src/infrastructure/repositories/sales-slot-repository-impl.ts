import { PrismaClient } from "@prisma/client";
import type { SalesSlotRepository } from "@/domain/repositories/sales-slot.js";
import type { SalesSlot } from "@/domain/models/sales-slot.js";
import type { ProductInventory } from "@/domain/models/product-inventory.js";
import type { ID } from "@/domain/types/id.js";

export class SalesSlotRepositoryImpl implements SalesSlotRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private mapToSalesSlot(data: any): SalesSlot {
        return {
            id: data.id,
            startTime: data.startTime,
            endTime: data.endTime,
            isActive: data.isActive,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    }

    private mapToProductInventory(data: any): ProductInventory {
        return {
            id: data.id,
            salesSlotId: data.salesSlotId,
            productId: data.productId,
            initialQuantity: data.initialQuantity,
            reservedQuantity: data.reservedQuantity,
            soldQuantity: data.soldQuantity,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        };
    }

    async findById(id: ID): Promise<SalesSlot | null> {
        const salesSlot = await this.prisma.salesSlot.findUnique({
            where: { id },
        });
        return salesSlot ? this.mapToSalesSlot(salesSlot) : null;
    }

    async findAll(): Promise<SalesSlot[]> {
        const salesSlots = await this.prisma.salesSlot.findMany();
        return salesSlots.map(this.mapToSalesSlot);
    }

    async create(entity: Omit<SalesSlot, "id">): Promise<void> {
        await this.prisma.salesSlot.create({
            data: entity,
        });
    }

    async update(id: ID, entity: Partial<SalesSlot>): Promise<void> {
        await this.prisma.salesSlot.update({
            where: { id },
            data: entity,
        });
    }

    async delete(id: ID): Promise<void> {
        await this.prisma.salesSlot.delete({
            where: { id },
        });
    }

    async findByTime(time: Date): Promise<SalesSlot[]> {
        const salesSlots = await this.prisma.salesSlot.findMany({
            where: {
                startTime: { lte: time },
                endTime: { gt: time },
            },
        });
        return salesSlots.map(this.mapToSalesSlot);
    }

    async findByTimeRange(
        startTime: Date,
        endTime: Date
    ): Promise<SalesSlot[]> {
        const salesSlots = await this.prisma.salesSlot.findMany({
            where: {
                startTime: { lt: endTime },
                endTime: { gt: startTime },
            },
        });
        return salesSlots.map(this.mapToSalesSlot);
    }

    async findActive(): Promise<SalesSlot[]> {
        const salesSlots = await this.prisma.salesSlot.findMany({
            where: { isActive: true },
        });
        return salesSlots.map(this.mapToSalesSlot);
    }

    async findWithInventory(id: ID): Promise<{
        salesSlot: SalesSlot;
        inventory: Array<{
            productId: ID;
            initialQuantity: number;
            reservedQuantity: number;
            soldQuantity: number;
        }>;
    } | null> {
        const salesSlot = await this.prisma.salesSlot.findUnique({
            where: { id },
            include: {
                productInventories: {
                    select: {
                        productId: true,
                        initialQuantity: true,
                        reservedQuantity: true,
                        soldQuantity: true,
                    },
                },
            },
        });

        if (!salesSlot) return null;

        return {
            salesSlot: this.mapToSalesSlot(salesSlot),
            inventory: salesSlot.productInventories,
        };
    }

    async findActiveWithInventory(): Promise<
        Array<{
            salesSlot: SalesSlot;
            inventory: Array<{
                productId: ID;
                initialQuantity: number;
                reservedQuantity: number;
                soldQuantity: number;
            }>;
        }>
    > {
        const salesSlots = await this.prisma.salesSlot.findMany({
            where: { isActive: true },
            include: {
                productInventories: {
                    select: {
                        productId: true,
                        initialQuantity: true,
                        reservedQuantity: true,
                        soldQuantity: true,
                    },
                },
            },
        });

        return salesSlots.map((slot) => ({
            salesSlot: this.mapToSalesSlot(slot),
            inventory: slot.productInventories,
        }));
    }

    async updateActiveStatus(id: ID, isActive: boolean): Promise<SalesSlot> {
        const salesSlot = await this.prisma.salesSlot.update({
            where: { id },
            data: { isActive },
        });
        return this.mapToSalesSlot(salesSlot);
    }
}
