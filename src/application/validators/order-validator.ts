import { z } from "zod";
import { OrderStatus } from "../../domain/types/index.js";
import { PaymentMethod } from "../../domain/types/index.js";

// 注文アイテム用のバリデーションスキーマ
const orderItemSchema = z.object({
    productId: z.string().uuid("有効なUUID形式ではありません"),
    quantity: z.number().int().positive("数量は正の整数で入力してください"),
});

// 注文作成用のバリデーションスキーマ
export const createOrderSchema = z.object({
    salesSlotId: z.string().uuid("有効なUUID形式ではありません"),
    items: z.array(orderItemSchema).min(1, "少なくとも1つのアイテムが必要です"),
});

// 注文更新用のバリデーションスキーマ
export const updateOrderSchema = z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    items: z.array(orderItemSchema).optional(),
});

// 注文IDのバリデーションスキーマ
export const orderIdSchema = z.object({
    id: z.string().uuid("有効なUUID形式ではありません"),
});

// 注文検索用のバリデーションスキーマ
export const searchOrderSchema = z.object({
    salesSlotId: z.string().uuid("有効なUUID形式ではありません").optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().optional().default(10),
});

// 注文確定用のバリデーションスキーマ
export const confirmOrderSchema = z.object({
    transactionId: z.string(),
    ticketNumber: z.string().min(1, "伝票番号は必須です"),
    paymentMethod: z.nativeEnum(PaymentMethod),
});