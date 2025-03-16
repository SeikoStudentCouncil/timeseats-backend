import { Hono } from "hono";
import type { Context } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import type { OrderController } from "../../application/controllers/index.js";
import {
    createOrderSchema,
    searchOrderSchema,
    confirmOrderSchema,
} from "../../application/validators/index.js";
import { z } from "zod";
import { OrderStatus } from "../../domain/types/index.js";

// APIレスポンススキーマの定義
const orderItemResponseSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    quantity: z.number(),
    price: z.number(),
});

const orderResponseSchema = z.object({
    id: z.string().uuid(),
    salesSlotId: z.string().uuid(),
    status: z.nativeEnum(OrderStatus),
    items: z.array(orderItemResponseSchema),
    totalAmount: z.number(),
    ticketNumber: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

const errorResponseSchema = z.object({
    error: z.string(),
});

const ordersResponseSchema = z.array(orderResponseSchema);

const orderTicketResponseSchema = z.object({
    id: z.string().uuid(),
    ticketNumber: z.string(),
    orderId: z.string().uuid(),
    paymentMethod: z.string(),
    transactionId: z.string().optional(),
    isPaid: z.boolean(),
    isDelivered: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

export const createOrderRoutes = (controller: OrderController) => {
    const router = new Hono();

    router.get(
        "/",
        describeRoute({
            description: "注文一覧を取得します",
            tags: ["orders"],
            parameters: [
                {
                    name: "salesSlotId",
                    in: "query",
                    description: "販売枠IDでの絞り込み",
                    required: false,
                    schema: { type: "string", format: "uuid" },
                },
                {
                    name: "status",
                    in: "query",
                    description: "注文ステータスでの絞り込み",
                    required: false,
                    schema: {
                        type: "string",
                        enum: Object.values(OrderStatus),
                    },
                },
                {
                    name: "startDate",
                    in: "query",
                    description: "開始日時",
                    required: false,
                    schema: { type: "string", format: "date-time" },
                },
                {
                    name: "endDate",
                    in: "query",
                    description: "終了日時",
                    required: false,
                    schema: { type: "string", format: "date-time" },
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
                    description: "注文一覧の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(ordersResponseSchema),
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
        zValidator("query", searchOrderSchema),
        (c: Context) => controller.getAllOrders(c)
    );

    router.get(
        "/:id",
        describeRoute({
            description: "指定されたIDの注文を取得します",
            tags: ["orders"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "注文ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                200: {
                    description: "注文の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderResponseSchema),
                        },
                    },
                },
                404: {
                    description: "注文が見つかりません",
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
        (c: Context) => controller.getOrderById(c)
    );

    router.post(
        "/",
        describeRoute({
            description: "新しい注文を作成します（仮予約）",
            tags: ["orders"],
            requestBody: {
                description: "作成する注文の情報",
                required: true,
                content: {
                    "application/json": {
                        schema: resolver(createOrderSchema),
                    },
                },
            },
            responses: {
                201: {
                    description: "注文の作成に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderResponseSchema),
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
        zValidator("json", createOrderSchema),
        (c: Context) => controller.createOrder(c)
    );

    router.post(
        "/:id/cancel",
        describeRoute({
            description: "注文をキャンセルします",
            tags: ["orders"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "注文ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                204: {
                    description: "注文のキャンセルに成功",
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
        (c: Context) => controller.cancelOrder(c)
    );

    router.post(
        "/:id/confirm",
        describeRoute({
            description: "注文を確定します",
            tags: ["orders"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "注文ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            requestBody: {
                description: "注文確定情報",
                required: true,
                content: {
                    "application/json": {
                        schema: resolver(confirmOrderSchema),
                    },
                },
            },
            responses: {
                200: {
                    description: "注文の確定に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketResponseSchema),
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
        zValidator("json", confirmOrderSchema),
        (c: Context) => controller.confirmOrder(c)
    );

    router.get(
        "/status/:status",
        describeRoute({
            description: "指定されたステータスの注文を取得します",
            tags: ["orders"],
            parameters: [
                {
                    name: "status",
                    in: "path",
                    description: "注文ステータス",
                    required: true,
                    schema: {
                        type: "string",
                        enum: Object.values(OrderStatus),
                    },
                },
            ],
            responses: {
                200: {
                    description: "注文の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(ordersResponseSchema),
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
        (c: Context) => controller.getOrdersByStatus(c)
    );

    router.get(
        "/ticket/:ticketNumber",
        describeRoute({
            description: "指定されたチケット番号の注文を取得します",
            tags: ["orders"],
            parameters: [
                {
                    name: "ticketNumber",
                    in: "path",
                    description: "チケット番号",
                    required: true,
                    schema: { type: "string" },
                },
            ],
            responses: {
                200: {
                    description: "注文の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderResponseSchema),
                        },
                    },
                },
                404: {
                    description: "注文が見つかりません",
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
        (c: Context) => controller.getOrdersByTicketNumber(c)
    );

    router.post(
        "/:id/delivered",
        describeRoute({
            description: "注文の商品受け渡しを完了としてマークします",
            tags: ["orders"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "注文ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                200: {
                    description: "商品受け渡し完了のマークに成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketResponseSchema),
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
        (c: Context) => controller.markOrderAsDelivered(c)
    );

    return router;
};
