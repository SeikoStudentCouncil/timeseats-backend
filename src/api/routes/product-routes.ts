import { Hono } from "hono";
import type { Context } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import type { ProductController } from "../../application/controllers/product-controller.js";
import {
    createProductSchema,
    updateProductSchema,
    productIdSchema,
    searchProductSchema,
} from "../../application/validators/product-validator.js";
import { z } from "zod";

// APIレスポンススキーマの定義
const productResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    imageUrl: z.string().url().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

const productsResponseSchema = z.array(productResponseSchema);

export const createProductRoutes = (controller: ProductController) => {
    const router = new Hono();

    // 商品一覧の取得
    router.get(
        "/",
        describeRoute({
            description: "商品一覧を取得します",
            tags: ["products"],
            parameters: [
                {
                    name: "name",
                    in: "query",
                    description: "商品名での絞り込み",
                    required: false,
                    schema: { type: "string" },
                },
                {
                    name: "minPrice",
                    in: "query",
                    description: "最小価格での絞り込み",
                    required: false,
                    schema: { type: "integer" },
                },
                {
                    name: "maxPrice",
                    in: "query",
                    description: "最大価格での絞り込み",
                    required: false,
                    schema: { type: "integer" },
                },
                {
                    name: "page",
                    in: "query",
                    description: "ページ番号",
                    required: false,
                    schema: { type: "integer", default: 1 },
                },
                {
                    name: "limit",
                    in: "query",
                    description: "1ページあたりの件数",
                    required: false,
                    schema: { type: "integer", default: 10 },
                },
            ],
            responses: {
                200: {
                    description: "商品一覧の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(productsResponseSchema),
                        },
                    },
                },
            },
        }),
        zValidator("query", searchProductSchema),
        (c: Context) => controller.getAllProducts(c)
    );

    // 商品の取得
    router.get(
        "/:id",
        describeRoute({
            description: "指定されたIDの商品を取得します",
            tags: ["products"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "商品ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                200: {
                    description: "商品の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(productResponseSchema),
                        },
                    },
                },
                404: {
                    description: "商品が見つかりません",
                },
            },
        }),
        zValidator("param", productIdSchema),
        (c: Context) => controller.getProductById(c)
    );

    // 商品の作成
    router.post(
        "/",
        describeRoute({
            description: "新しい商品を作成します",
            tags: ["products"],
            requestBody: {
                description: "作成する商品の情報",
                required: true,
                content: {
                    "application/json": {
                        schema: resolver(createProductSchema),
                    },
                },
            },
            responses: {
                201: {
                    description: "商品の作成に成功",
                    content: {
                        "application/json": {
                            schema: resolver(productResponseSchema),
                        },
                    },
                },
                400: {
                    description: "入力値が不正です",
                },
            },
        }),
        zValidator("json", createProductSchema),
        (c: Context) => controller.createProduct(c)
    );

    // 商品の更新
    router.put(
        "/:id",
        describeRoute({
            description: "商品情報を更新します",
            tags: ["products"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "商品ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            requestBody: {
                description: "更新する商品の情報",
                required: true,
                content: {
                    "application/json": {
                        schema: resolver(updateProductSchema),
                    },
                },
            },
            responses: {
                200: {
                    description: "商品の更新に成功",
                    content: {
                        "application/json": {
                            schema: resolver(productResponseSchema),
                        },
                    },
                },
                404: {
                    description: "商品が見つかりません",
                },
            },
        }),
        zValidator("param", productIdSchema),
        zValidator("json", updateProductSchema),
        (c: Context) => controller.updateProduct(c)
    );

    // 商品の削除
    router.delete(
        "/:id",
        describeRoute({
            description: "商品を削除します",
            tags: ["products"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "商品ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                204: {
                    description: "商品の削除に成功",
                },
                404: {
                    description: "商品が見つかりません",
                },
            },
        }),
        zValidator("param", productIdSchema),
        (c: Context) => controller.deleteProduct(c)
    );

    // 商品在庫の設定
    router.post(
        "/:id/inventory",
        describeRoute({
            description: "商品の在庫を設定します",
            tags: ["products"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "商品ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            requestBody: {
                description: "在庫設定情報",
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                quantity: {
                                    type: "integer",
                                    description: "在庫数",
                                    minimum: 0,
                                },
                                salesSlotId: {
                                    type: "string",
                                    format: "uuid",
                                    description: "販売枠ID",
                                },
                            },
                            required: ["quantity", "salesSlotId"],
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "在庫設定に成功",
                },
                404: {
                    description: "商品または販売枠が見つかりません",
                },
            },
        }),
        (c: Context) => controller.setProductInventory(c)
    );

    return router;
};
