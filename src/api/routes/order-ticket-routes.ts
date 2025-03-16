import { Hono } from "hono";
import type { Context } from "hono";
import { describeRoute } from "hono-openapi";
import { resolver, validator as zValidator } from "hono-openapi/zod";
import type { OrderTicketController } from "../../application/controllers/index.js";
import {
    createTicketSchema,
    updatePaymentStatusSchema,
    updateDeliveryStatusSchema,
} from "../../application/validators/index.js";
import { z } from "zod";
import { PaymentMethod } from "../../domain/types/index.js";

// APIレスポンススキーマの定義
const orderTicketResponseSchema = z.object({
    id: z.string().uuid(),
    orderId: z.string().uuid(),
    ticketNumber: z.string(),
    paymentMethod: z.nativeEnum(PaymentMethod),
    isPaid: z.boolean(),
    isDelivered: z.boolean(),
    transactionId: z.string().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

const orderTicketsResponseSchema = z.array(orderTicketResponseSchema);

const errorResponseSchema = z.object({
    error: z.string(),
});

export const createOrderTicketRoutes = (controller: OrderTicketController) => {
    const router = new Hono();

    // 伝票一覧の取得
    router.get(
        "/",
        describeRoute({
            description: "伝票一覧を取得します",
            tags: ["tickets"],
            parameters: [
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
                    description: "伝票一覧の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketsResponseSchema),
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
        (c: Context) => controller.getAllTickets(c)
    );

    // 伝票の取得
    router.get(
        "/:id",
        describeRoute({
            description: "指定されたIDの伝票を取得します",
            tags: ["tickets"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "伝票ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                200: {
                    description: "伝票の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketResponseSchema),
                        },
                    },
                },
                404: {
                    description: "伝票が見つかりません",
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
        (c: Context) => controller.getTicketById(c)
    );

    // 伝票番号による伝票の取得
    router.get(
        "/number/:number",
        describeRoute({
            description: "指定された番号の伝票を取得します",
            tags: ["tickets"],
            parameters: [
                {
                    name: "number",
                    in: "path",
                    description: "伝票番号",
                    required: true,
                    schema: { type: "string" },
                },
            ],
            responses: {
                200: {
                    description: "伝票の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketResponseSchema),
                        },
                    },
                },
                404: {
                    description: "伝票が見つかりません",
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
        (c: Context) => controller.getTicketByNumber(c)
    );

    // 伝票の作成
    router.post(
        "/",
        describeRoute({
            description: "新しい伝票を作成します",
            tags: ["tickets"],
            requestBody: {
                description: "作成する伝票の情報",
                required: true,
                content: {
                    "application/json": {
                        schema: resolver(createTicketSchema),
                    },
                },
            },
            responses: {
                201: {
                    description: "伝票の作成に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketResponseSchema),
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
        zValidator("json", createTicketSchema),
        (c: Context) => controller.createTicket(c)
    );

    // 伝票の削除
    router.delete(
        "/:id",
        describeRoute({
            description: "伝票を削除します",
            tags: ["tickets"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "伝票ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                204: {
                    description: "伝票の削除に成功",
                },
                404: {
                    description: "伝票が見つかりません",
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
        (c: Context) => controller.deleteTicket(c)
    );

    // 伝票の支払い状態を更新
    router.put(
        "/:id/payment",
        describeRoute({
            description: "伝票の支払い状態を更新します",
            tags: ["tickets"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "伝票ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            requestBody: {
                description: "支払い状態の更新情報",
                required: true,
                content: {
                    "application/json": {
                        schema: resolver(updatePaymentStatusSchema),
                    },
                },
            },
            responses: {
                200: {
                    description: "支払い状態の更新に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketResponseSchema),
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
        zValidator("json", updatePaymentStatusSchema),
        (c: Context) => controller.updatePaymentStatus(c)
    );

    // 伝票の受け取り状態を更新
    router.put(
        "/:id/delivery",
        describeRoute({
            description: "伝票の受け取り状態を更新します",
            tags: ["tickets"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    description: "伝票ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            requestBody: {
                description: "受け取り状態の更新情報",
                required: true,
                content: {
                    "application/json": {
                        schema: resolver(updateDeliveryStatusSchema),
                    },
                },
            },
            responses: {
                200: {
                    description: "受け取り状態の更新に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketResponseSchema),
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
        zValidator("json", updateDeliveryStatusSchema),
        (c: Context) => controller.updateDeliveryStatus(c)
    );

    // 支払い済み伝票の取得
    router.get(
        "/status/paid",
        describeRoute({
            description: "支払い済みの伝票一覧を取得します",
            tags: ["tickets"],
            responses: {
                200: {
                    description: "支払い済み伝票の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketsResponseSchema),
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
        (c: Context) => controller.getPaidTickets(c)
    );

    // 未払い伝票の取得
    // 注文IDによる伝票の取得
    router.get(
        "/order/:orderId",
        describeRoute({
            description: "指定された注文IDの伝票を取得します",
            tags: ["tickets"],
            parameters: [
                {
                    name: "orderId",
                    in: "path",
                    description: "注文ID",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            responses: {
                200: {
                    description: "伝票の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketResponseSchema),
                        },
                    },
                },
                404: {
                    description: "伝票が見つかりません",
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
        (c: Context) => controller.getTicketByOrder(c)
    );

    // 引き渡し済み伝票の取得
    router.get(
        "/status/delivered",
        describeRoute({
            description: "引き渡し済みの伝票一覧を取得します",
            tags: ["tickets"],
            responses: {
                200: {
                    description: "引き渡し済み伝票の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketsResponseSchema),
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
        (c: Context) => controller.getDeliveredTickets(c)
    );

    // 未引き渡し伝票の取得
    router.get(
        "/status/undelivered",
        describeRoute({
            description: "未引き渡しの伝票一覧を取得します",
            tags: ["tickets"],
            responses: {
                200: {
                    description: "未引き渡し伝票の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketsResponseSchema),
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
        (c: Context) => controller.getUndeliveredTickets(c)
    );

    router.get(
        "/status/unpaid",
        describeRoute({
            description: "未払いの伝票一覧を取得します",
            tags: ["tickets"],
            responses: {
                200: {
                    description: "未払い伝票の取得に成功",
                    content: {
                        "application/json": {
                            schema: resolver(orderTicketsResponseSchema),
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
        (c: Context) => controller.getUnpaidTickets(c)
    );

    return router;
};
