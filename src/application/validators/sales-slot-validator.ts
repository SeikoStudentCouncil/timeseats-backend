import { z } from "zod";

// 販売枠作成用のバリデーションスキーマ
export const createSalesSlotSchema = z.object({
    startTime: z
        .string()
        .datetime({ message: "有効な日時形式で入力してください" }),
    endTime: z
        .string()
        .datetime({ message: "有効な日時形式で入力してください" }),
    isActive: z.boolean().optional().default(false),
});

// 販売枠更新用のバリデーションスキーマ
export const updateSalesSlotSchema = createSalesSlotSchema.partial();

// 販売枠IDのバリデーションスキーマ
export const salesSlotIdSchema = z.object({
    id: z.string().uuid("有効なUUID形式ではありません"),
});

// 販売枠検索用のバリデーションスキーマ
export const searchSalesSlotSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isActive: z.boolean().optional(),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().optional().default(10),
});

// 在庫登録用のバリデーションスキーマ
export const addInventorySchema = z.object({
    salesSlotId: z.string().uuid("有効なUUID形式ではありません"),
    productId: z.string().uuid("有効なUUID形式ではありません"),
    quantity: z.number().int().positive("数量は正の整数で入力してください"),
});

// バリデーション関数
export const validateCreateSalesSlot = (data: unknown) => {
    return createSalesSlotSchema.parse(data);
};

export const validateUpdateSalesSlot = (data: unknown) => {
    return updateSalesSlotSchema.parse(data);
};

export const validateSalesSlotId = (data: unknown) => {
    return salesSlotIdSchema.parse(data);
};

export const validateSearchSalesSlot = (data: unknown) => {
    return searchSalesSlotSchema.parse(data);
};

export const validateAddInventory = (data: unknown) => {
    return addInventorySchema.parse(data);
};
