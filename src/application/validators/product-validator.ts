import { z } from "zod";

// 商品作成用のバリデーションスキーマ
export const createProductSchema = z.object({
    name: z
        .string()
        .min(1, "商品名は必須です")
        .max(100, "商品名は100文字以内で入力してください"),
    description: z
        .string()
        .max(500, "説明は500文字以内で入力してください")
        .optional(),
    price: z.number().int().positive("価格は正の整数で入力してください"),
    imageUrl: z.string().url("有効なURLを入力してください").optional(),
});

// 商品更新用のバリデーションスキーマ
export const updateProductSchema = createProductSchema.partial();

// 商品IDのバリデーションスキーマ
export const productIdSchema = z.object({
    id: z.string().uuid("有効なUUID形式ではありません"),
});

// 商品検索用のバリデーションスキーマ
export const searchProductSchema = z.object({
    name: z.string().optional(),
    minPrice: z.number().int().optional(),
    maxPrice: z.number().int().optional(),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().optional().default(10),
});

// バリデーション関数
export const validateCreateProduct = (data: unknown) => {
    return createProductSchema.parse(data);
};

export const validateUpdateProduct = (data: unknown) => {
    return updateProductSchema.parse(data);
};

export const validateProductId = (data: unknown) => {
    return productIdSchema.parse(data);
};

export const validateSearchProduct = (data: unknown) => {
    return searchProductSchema.parse(data);
};
