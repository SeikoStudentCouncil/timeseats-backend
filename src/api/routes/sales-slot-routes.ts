import { Hono } from "hono";
import type { Context } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import type { SalesSlotController } from "../../application/controllers/index.js";
import {
    createSalesSlotSchema,
    updateSalesSlotSchema,
    searchSalesSlotSchema,
} from "../../application/validators/index.js";
import { z } from "zod";
import { inventoryResponseSchema } from "./product-routes.js";

// APIレスポンススキーマの定義
const salesSlotResponseSchema = z.object({
    id: z.string().uuid(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

const salesSlotsResponseSchema = z.array(salesSlotResponseSchema);

const inventoriesResponseSchema = z.array(inventoryResponseSchema);

const errorResponseSchema = z.object({
    error: z.string(),
});

export const createSalesSlotRoutes = (controller: SalesSlotController) => {
    const router = new Hono();

    // 販売枠一覧の取得
    router.get(
        "/",
        describeRoute({
            description: "販売枠一覧を取得します",
            tags: ["sales-slots"],
            parameters: [
                {
                    name: "startDate",
                    in: "query",
                    description: "開始日時での絞り込み",
                    required: false,
                    schema: { type: "string", format: "date-time" },
                },
                {
                    name: "endDate",
                    in: "query",
                    description: "終了日時での絞り込み",
                    required: false,
                    schema: { type: "string", format: "date-time" },
                },
                {
                    name: "isActive",
                    in: "query",
                    description: "有効/無効状態での絞り込み",
                    required: false,
                    schema: { type: "boolean" },
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
                    description: "販売枠一覧の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(salesSlotsResponseSchema),
                        },
                    },
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        zValidator("query", searchSalesSlotSchema),
        (c: Context) => controller.getAllSalesSlots(c)
    );

    // 販売枠の取得
    router.get(
        "/:id",
        describeRoute({
            description: "指定されたIDの販売枠を取得します",
            tags: ["sales-slots"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "販売枠ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                200: {
                    description: "販売枠の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(salesSlotResponseSchema),
                        },
                    },
                },
                404: {
                    description: "販売枠が見つかりません",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        (c: Context) => controller.getSalesSlotById(c)
    );

    // 販売枠の作成
    router.post(
        "/",
        describeRoute({
            description: "新しい販売枠を作成します",
            tags: ["sales-slots"],
            requestBody: {
                description: "作成する販売枠の情報",
                required: true,
                content: {
                    "application/json": {
                        schema: resolver(createSalesSlotSchema),
                    },
                },
            },
            responses: {
                201: {
                    description: "販売枠の作成に成功",
                    content: {
                        "application/json": {
                            schema: resolver(salesSlotResponseSchema),
                        },
                    },
                },
                400: {
                    description: "入力値が不正です",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        zValidator("json", createSalesSlotSchema),
        (c: Context) => controller.createSalesSlot(c)
    );

    // 販売枠の更新
    router.put(
        "/:id",
        describeRoute({
            description: "販売枠を更新します",
            tags: ["sales-slots"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "販売枠ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            requestBody: {
                description: "更新する販売枠の情報",
                required: true,
                content: {
                    "application/json": {
                        schema: resolver(updateSalesSlotSchema),
                    },
                },
            },
            responses: {
                200: {
                    description: "販売枠の更新に成功",
                    content: {
                        "application/json": {
                            schema: resolver(salesSlotResponseSchema),
                        },
                    },
                },
                404: {
                    description: "販売枠が見つかりません",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        zValidator("json", updateSalesSlotSchema),
        (c: Context) => controller.updateSalesSlot(c)
    );

    // 販売枠の削除
    // アクティブな販売枠の取得
    router.get(
        "/active",
        describeRoute({
            description: "現在アクティブな販売枠を取得します",
            tags: ["sales-slots"],
            responses: {
                200: {
                    description: "アクティブな販売枠の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(salesSlotsResponseSchema),
                        },
                    },
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        (c: Context) => controller.getActiveSalesSlots(c)
    );

    // 現在の販売枠の取得
    router.get(
        "/current",
        describeRoute({
            description: "現在時刻に該当する販売枠を取得します",
            tags: ["sales-slots"],
            responses: {
                200: {
                    description: "現在の販売枠の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(salesSlotResponseSchema),
                        },
                    },
                },
                404: {
                    description: "該当する販売枠が見つかりません",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        (c: Context) => controller.getCurrentSalesSlot(c)
    );

    // 次の販売枠の取得
    router.get(
        "/next",
        describeRoute({
            description: "次の販売枠を取得します",
            tags: ["sales-slots"],
            responses: {
                200: {
                    description: "次の販売枠の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(salesSlotResponseSchema),
                        },
                    },
                },
                404: {
                    description: "該当する販売枠が見つかりません",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        (c: Context) => controller.getNextSalesSlot(c)
    );

    // 販売枠のアクティブ状態の切り替え
    router.post(
        "/:id/toggle",
        describeRoute({
            description: "販売枠のアクティブ状態を切り替えます",
            tags: ["sales-slots"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "販売枠ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            requestBody: {
                description: "アクティブ状態",
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                isActive: {
                                    type: "boolean",
                                    description: "アクティブにするかどうか",
                                },
                            },
                            required: ["isActive"],
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "アクティブ状態の切り替えに成功",
                    content: {
                        "application/json": {
                            schema: resolver(salesSlotResponseSchema),
                        },
                    },
                },
                404: {
                    description: "販売枠が見つかりません",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        (c: Context) => controller.toggleSalesSlotActive(c)
    );

    // 販売枠の在庫情報の取得
    router.get(
        "/:id/inventory",
        describeRoute({
            description: "指定された販売枠の在庫情報をすべて取得します",
            tags: ["sales-slots"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "販売枠ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                200: {
                    description: "在庫情報の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(inventoriesResponseSchema),
                        },
                    },
                },
                404: {
                    description: "販売枠が見つかりません",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        (c: Context) => controller.getSalesSlotInventory(c)
    );

    router.delete(
        "/:id",
        describeRoute({
            description: "販売枠を削除します",
            tags: ["sales-slots"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "販売枠ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                204: {
                    description: "販売枠の削除に成功",
                },
                500: {
                    description: "サーバーエラー",
                    content: {
                        "application/json": {
                            schema: resolver(errorResponseSchema),
                        },
                    },
                },
            },
        }),
        (c: Context) => controller.deleteSalesSlot(c)
    );

    return router;
};
