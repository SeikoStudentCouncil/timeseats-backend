import { Hono } from "hono";
import type { Context } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import type { SalesSlotController } from "../../application/controllers/sales-slot-controller.js";
import {
    createSalesSlotSchema,
    updateSalesSlotSchema,
    salesSlotIdSchema,
    searchSalesSlotSchema,
} from "../../application/validators/sales-slot-validator.js";
import { z } from "zod";

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
                },
            },
        }),
        zValidator("param", salesSlotIdSchema),
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
                },
            },
        }),
        zValidator("param", salesSlotIdSchema),
        zValidator("json", updateSalesSlotSchema),
        (c: Context) => controller.updateSalesSlot(c)
    );

    // 販売枠の削除
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
                404: {
                    description: "販売枠が見つかりません",
                },
            },
        }),
        zValidator("param", salesSlotIdSchema),
        (c: Context) => controller.deleteSalesSlot(c)
    );

    return router;
};
