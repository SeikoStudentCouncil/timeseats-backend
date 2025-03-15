import { SalesSlotRepositoryImpl } from "@/infrastructure/repositories/sales-slot-repository-impl.js";
import prisma from "@/infrastructure/database/index.js";
import { setupDatabase } from "../../utils.js";

describe("SalesSlotRepository Integration Test", () => {
    let salesSlotRepository: SalesSlotRepositoryImpl;

    beforeAll(async () => {
        salesSlotRepository = new SalesSlotRepositoryImpl(prisma);
    });

    beforeEach(async () => {
        await setupDatabase();
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe("基本的なCRUD操作", () => {
        it("販売枠を作成して取得できる", async () => {
            const now = new Date();
            const slotData = {
                startTime: new Date(now.getTime() + 1800000), // 30分後
                endTime: new Date(now.getTime() + 3600000), // 1時間後
                isActive: false,
                createdAt: now,
                updatedAt: now,
            };

            await salesSlotRepository.create(slotData);

            // 作成された販売枠を検索
            const slots = await salesSlotRepository.findByTimeRange(
                slotData.startTime,
                slotData.endTime
            );
            expect(slots).toHaveLength(1);
            const createdSlot = slots[0];
            expect(createdSlot.isActive).toBe(false);
            expect(createdSlot.startTime.getTime()).toBe(
                slotData.startTime.getTime()
            );
            expect(createdSlot.endTime.getTime()).toBe(
                slotData.endTime.getTime()
            );
        });

        it("販売枠の有効状態を更新できる", async () => {
            // 販売枠の作成
            const now = new Date();
            const slot = await prisma.salesSlot.create({
                data: {
                    startTime: new Date(now.getTime() + 1800000),
                    endTime: new Date(now.getTime() + 3600000),
                    isActive: true,
                },
            });

            // 無効化
            await salesSlotRepository.update(slot.id, { isActive: false });

            // 更新の確認
            const updatedSlot = await salesSlotRepository.findById(slot.id);
            expect(updatedSlot?.isActive).toBe(false);
        });
    });

    describe("検索機能", () => {
        it("時間範囲で販売枠を検索できる", async () => {
            const now = new Date();
            const baseTime = now.getTime();

            // 複数の販売枠を作成
            await Promise.all([
                prisma.salesSlot.create({
                    data: {
                        startTime: new Date(baseTime + 1800000), // 30分後
                        endTime: new Date(baseTime + 3600000), // 1時間後
                        isActive: true,
                    },
                }),
                prisma.salesSlot.create({
                    data: {
                        startTime: new Date(baseTime + 3600000), // 1時間後
                        endTime: new Date(baseTime + 5400000), // 1時間30分後
                        isActive: true,
                    },
                }),
            ]);

            // 最初の1時間の販売枠を検索
            const slots = await salesSlotRepository.findByTimeRange(
                new Date(baseTime + 1800000),
                new Date(baseTime + 3600000)
            );
            expect(slots).toHaveLength(1);
            expect(slots[0].startTime.getTime()).toBe(baseTime + 1800000);
        });

        it("アクティブな販売枠のみを検索できる", async () => {
            const now = new Date();
            const baseTime = now.getTime();

            // アクティブと非アクティブの販売枠を作成
            await Promise.all([
                prisma.salesSlot.create({
                    data: {
                        startTime: new Date(baseTime + 1800000),
                        endTime: new Date(baseTime + 3600000),
                        isActive: true,
                    },
                }),
                prisma.salesSlot.create({
                    data: {
                        startTime: new Date(baseTime + 3600000),
                        endTime: new Date(baseTime + 5400000),
                        isActive: false,
                    },
                }),
            ]);

            // アクティブな販売枠の検索
            const slots = await salesSlotRepository.findActive();
            expect(slots).toHaveLength(1);
            expect(slots[0].isActive).toBe(true);
        });

        it("指定時刻の販売枠を検索できる", async () => {
            const now = new Date();
            const baseTime = now.getTime();

            // 過去、現在、未来の販売枠を作成
            await Promise.all([
                prisma.salesSlot.create({
                    data: {
                        startTime: new Date(baseTime - 3600000), // 1時間前
                        endTime: new Date(baseTime - 1800000), // 30分前
                        isActive: true,
                    },
                }),
                prisma.salesSlot.create({
                    data: {
                        startTime: new Date(baseTime - 900000), // 15分前
                        endTime: new Date(baseTime + 900000), // 15分後
                        isActive: true,
                    },
                }),
                prisma.salesSlot.create({
                    data: {
                        startTime: new Date(baseTime + 1800000), // 30分後
                        endTime: new Date(baseTime + 3600000), // 1時間後
                        isActive: true,
                    },
                }),
            ]);

            // 現在時刻での販売枠の検索
            const currentTime = new Date(baseTime);
            const currentSlots = await salesSlotRepository.findByTime(
                currentTime
            );
            expect(currentSlots).toHaveLength(1);
            const currentSlot = currentSlots[0];
            expect(currentSlot.startTime.getTime()).toBe(baseTime - 900000);
            expect(currentSlot.endTime.getTime()).toBe(baseTime + 900000);
        });
    });
});
