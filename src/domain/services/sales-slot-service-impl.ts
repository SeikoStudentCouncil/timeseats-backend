import type { ID } from "../types/id.js";
import type { SalesSlot } from "../models/sales-slot.js";
import type { ProductInventory } from "../models/index.js";
import type { SalesSlotService } from "./sales-slot-service.js";
import type { SalesSlotRepository } from "../repositories/sales-slot.js";
import type { ProductRepository } from "../repositories/product-repository.js";

/**
 * SalesSlotServiceImpl - 販売枠サービスの実装クラス
 */
export class SalesSlotServiceImpl implements SalesSlotService {
    constructor(
        private readonly salesSlotRepository: SalesSlotRepository,
        private readonly productRepository: ProductRepository
    ) {}

    async getAllSalesSlots(): Promise<SalesSlot[]> {
        return this.salesSlotRepository.findAll();
    }

    async getSalesSlotById(id: ID): Promise<SalesSlot | null> {
        return this.salesSlotRepository.findById(id);
    }

    async getActiveSalesSlots(): Promise<SalesSlot[]> {
        return this.salesSlotRepository.findActive();
    }

    async getSalesSlotsByTimeRange(
        start: Date,
        end: Date
    ): Promise<SalesSlot[]> {
        if (end <= start) {
            throw new Error("End time must be after start time");
        }
        return this.salesSlotRepository.findByTimeRange(start, end);
    }

    private async validateTimeSlot(
        startTime: Date,
        endTime: Date,
        excludeId?: ID
    ): Promise<void> {
        // 基本的な時間の整合性チェック
        if (endTime <= startTime) {
            throw new Error("End time must be after start time");
        }

        // 30分単位のチェック
        if (
            startTime.getMinutes() % 30 !== 0 ||
            endTime.getMinutes() % 30 !== 0
        ) {
            throw new Error(
                "Time slots must be aligned to 30-minute intervals"
            );
        }

        // 重複する時間枠のチェック
        const overlapping = await this.salesSlotRepository.findByTimeRange(
            startTime,
            endTime
        );

        const conflicts = overlapping.filter((slot) => slot.id !== excludeId);
        if (conflicts.length > 0) {
            throw new Error(
                "Time slot overlaps with existing slots: " +
                    conflicts
                        .map(
                            (s) =>
                                `${s.startTime.toISOString()} - ${s.endTime.toISOString()}`
                        )
                        .join(", ")
            );
        }
    }

    async createSalesSlot(
        salesSlot: Omit<SalesSlot, "id" | "createdAt" | "updatedAt">
    ): Promise<SalesSlot> {
        // 時間枠の検証
        await this.validateTimeSlot(salesSlot.startTime, salesSlot.endTime);

        // 販売枠を作成
        await this.salesSlotRepository.create({
            ...salesSlot,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // 作成された販売枠を取得
        const slots = await this.salesSlotRepository.findByTimeRange(
            salesSlot.startTime,
            salesSlot.endTime
        );
        const created = slots.find(
            (s) =>
                s.startTime.getTime() === salesSlot.startTime.getTime() &&
                s.endTime.getTime() === salesSlot.endTime.getTime()
        );

        if (!created) {
            throw new Error("Failed to create sales slot");
        }

        return created;
    }

    async updateSalesSlot(
        id: ID,
        salesSlot: Partial<Omit<SalesSlot, "id" | "createdAt" | "updatedAt">>
    ): Promise<SalesSlot> {
        // 既存の販売枠を取得
        const existing = await this.salesSlotRepository.findById(id);
        if (!existing) {
            throw new Error(`Sales slot with ID ${id} not found`);
        }

        // 時間が更新される場合は検証
        if (salesSlot.startTime || salesSlot.endTime) {
            await this.validateTimeSlot(
                salesSlot.startTime ?? existing.startTime,
                salesSlot.endTime ?? existing.endTime,
                id
            );
        }

        // 販売枠を更新
        await this.salesSlotRepository.update(id, {
            ...salesSlot,
            updatedAt: new Date(),
        });

        // 更新された販売枠を取得
        const updated = await this.salesSlotRepository.findById(id);
        if (!updated) {
            throw new Error("Failed to update sales slot");
        }

        return updated;
    }

    async deleteSalesSlot(id: ID): Promise<boolean> {
        const slot = await this.salesSlotRepository.findById(id);
        if (!slot) {
            throw new Error(`Sales slot with ID ${id} not found`);
        }

        // 関連する在庫情報があるかチェック
        const inventory = await this.productRepository.findInventoryBySalesSlot(
            id
        );
        if (inventory.length > 0) {
            const hasActiveInventory = inventory.some(
                (inv) => inv.soldQuantity > 0 || inv.reservedQuantity > 0
            );
            if (hasActiveInventory) {
                throw new Error(
                    "Cannot delete sales slot with active inventory"
                );
            }
        }

        await this.salesSlotRepository.delete(id);
        return true;
    }

    async toggleSalesSlotActive(id: ID, isActive: boolean): Promise<SalesSlot> {
        const slot = await this.salesSlotRepository.findById(id);
        if (!slot) {
            throw new Error(`Sales slot with ID ${id} not found`);
        }

        // アクティブにする場合は時間の整合性をチェック
        if (isActive) {
            const now = new Date();
            if (slot.endTime <= now) {
                throw new Error("Cannot activate past time slot");
            }
        }

        return this.salesSlotRepository.updateActiveStatus(id, isActive);
    }

    async getSalesSlotInventory(salesSlotId: ID): Promise<ProductInventory[]> {
        const slot = await this.salesSlotRepository.findById(salesSlotId);
        if (!slot) {
            throw new Error(`Sales slot with ID ${salesSlotId} not found`);
        }

        return this.productRepository.findInventoryBySalesSlot(salesSlotId);
    }

    async getCurrentSalesSlot(): Promise<SalesSlot | null> {
        const now = new Date();
        const currentSlots = await this.salesSlotRepository.findByTime(now);

        // アクティブなスロットのみをフィルタリング
        const activeSlots = currentSlots.filter(
            (slot: SalesSlot) => slot.isActive
        );

        return activeSlots.length > 0 ? activeSlots[0] : null;
    }

    async getNextSalesSlot(): Promise<SalesSlot | null> {
        const now = new Date();
        const nextTime = new Date(now.getTime() + 30 * 60 * 1000); // 30分後

        const slots = await this.salesSlotRepository.findByTimeRange(
            now,
            nextTime
        );
        const activeSlots = slots
            .filter((slot: SalesSlot) => slot.isActive && slot.startTime > now)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        return activeSlots.length > 0 ? activeSlots[0] : null;
    }
}
