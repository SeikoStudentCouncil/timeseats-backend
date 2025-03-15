import { describe, it, expect } from "vitest";
import type { OrderTicket } from "@/domain/models/index.js";
import { PaymentMethod } from "@/domain/types/index.js";

describe("OrderTicket Model", () => {
    const validOrderTicket: OrderTicket = {
        id: "ticket1",
        orderId: "order1",
        ticketNumber: "TKT-001",
        paymentMethod: PaymentMethod.CASH,
        isPaid: false,
        isDelivered: false,
        transactionId: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    describe("基本的なバリデーション", () => {
        it("有効な伝票データを検証できる", () => {
            expect(validOrderTicket).toMatchObject({
                id: expect.any(String),
                orderId: expect.any(String),
                ticketNumber: expect.any(String),
                paymentMethod: expect.any(String),
            });
        });

        it("伝票番号は必須である", () => {
            expect(validOrderTicket.ticketNumber).toBeTruthy();
        });

        it("注文IDは必須である", () => {
            expect(validOrderTicket.orderId).toBeTruthy();
        });
    });

    describe("支払い方法", () => {
        it("現金支払いの場合、トランザクションIDはundefinedである", () => {
            const cashTicket: OrderTicket = {
                ...validOrderTicket,
                paymentMethod: PaymentMethod.CASH,
                transactionId: undefined,
            };
            expect(cashTicket.transactionId).toBeUndefined();
        });

        it("PayPay支払いの場合、トランザクションIDは必須である", () => {
            const paypayTicket: OrderTicket = {
                ...validOrderTicket,
                paymentMethod: PaymentMethod.PAYPAY,
                transactionId: "PAYPAY-TX-001",
            };
            expect(paypayTicket.transactionId).toBeTruthy();
        });

        it("Square支払いの場合、トランザクションIDは必須である", () => {
            const squareTicket: OrderTicket = {
                ...validOrderTicket,
                paymentMethod: PaymentMethod.SQUARE,
                transactionId: "SQUARE-TX-001",
            };
            expect(squareTicket.transactionId).toBeTruthy();
        });
    });

    describe("ステータスの検証", () => {
        it("新規伝票は未払いである", () => {
            expect(validOrderTicket.isPaid).toBe(false);
        });

        it("新規伝票は未受け取りである", () => {
            expect(validOrderTicket.isDelivered).toBe(false);
        });
    });

    describe("日時の検証", () => {
        it("作成日時は現在時刻以前である", () => {
            expect(validOrderTicket.createdAt.getTime()).toBeLessThanOrEqual(
                Date.now()
            );
        });

        it("更新日時は作成日時以降である", () => {
            expect(validOrderTicket.updatedAt.getTime()).toBeGreaterThanOrEqual(
                validOrderTicket.createdAt.getTime()
            );
        });
    });
});
