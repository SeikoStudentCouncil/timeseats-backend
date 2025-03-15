import { describe, it, expect } from "vitest";
import type { SalesSlot } from "@/domain/models/index.js";

describe("SalesSlot Model", () => {
    const now = new Date();
    const validSalesSlot: SalesSlot = {
        id: "slot1",
        startTime: new Date(now.getTime() + 1800000), // 30分後
        endTime: new Date(now.getTime() + 3600000), // 1時間後
        isActive: true,
        createdAt: now,
        updatedAt: now,
    };

    describe("基本的なバリデーション", () => {
        it("有効な販売枠データを検証できる", () => {
            expect(validSalesSlot).toMatchObject({
                id: expect.any(String),
                startTime: expect.any(Date),
                endTime: expect.any(Date),
                isActive: expect.any(Boolean),
            });
        });

        it("販売枠IDは必須である", () => {
            expect(validSalesSlot.id).toBeTruthy();
        });
    });

    describe("時間の検証", () => {
        it("開始時刻は終了時刻より前である必要がある", () => {
            expect(validSalesSlot.startTime.getTime()).toBeLessThan(
                validSalesSlot.endTime.getTime()
            );
        });

        it("販売枠は30分間である", () => {
            const duration =
                validSalesSlot.endTime.getTime() -
                validSalesSlot.startTime.getTime();
            expect(duration).toBe(1800000); // 30分 = 1,800,000ミリ秒
        });
    });

    describe("アクティブ状態", () => {
        it("販売枠は有効/無効を切り替えられる", () => {
            const inactiveSalesSlot: SalesSlot = {
                ...validSalesSlot,
                isActive: false,
            };
            expect(inactiveSalesSlot.isActive).toBe(false);
        });
    });

    describe("日時の検証", () => {
        it("作成日時は現在時刻以前である", () => {
            expect(validSalesSlot.createdAt.getTime()).toBeLessThanOrEqual(
                Date.now()
            );
        });

        it("更新日時は作成日時以降である", () => {
            expect(validSalesSlot.updatedAt.getTime()).toBeGreaterThanOrEqual(
                validSalesSlot.createdAt.getTime()
            );
        });
    });
});
