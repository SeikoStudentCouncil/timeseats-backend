import { Hono } from "hono";
import { createProductRoutes } from "./product-routes.js";
import { createOrderRoutes } from "./order-routes.js";
import { createOrderTicketRoutes } from "./order-ticket-routes.js";
import { createSalesSlotRoutes } from "./sales-slot-routes.js";
import { errorHandler } from "../middlewares/error-handler.js";
import { loggerMiddleware } from "../middlewares/logger.js";
import { openAPISpecs } from "hono-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import type { ProductController } from "../../application/controllers/product-controller.js";
import type { OrderController } from "../../application/controllers/order-controller.js";
import type { OrderTicketController } from "../../application/controllers/order-ticket-controller.js";
import type { SalesSlotController } from "../../application/controllers/sales-slot-controller.js";

// 依存性のインターフェース
export interface ApiDependencies {
    productController: ProductController;
    orderController: OrderController;
    orderTicketController: OrderTicketController;
    salesSlotController: SalesSlotController;
}

// APIバージョン
const API_VERSION = "v1";

export const createApiRouter = (deps: ApiDependencies) => {
    // ベースとなるルーター
    const app = new Hono();

    // グローバルミドルウェアの適用
    app.use("/*", loggerMiddleware);
    app.use("/*", errorHandler);

    // APIバージョンのプレフィックス
    const v1 = app.basePath(`/api/${API_VERSION}`);

    // 各リソースのルートをマウント
    v1.route("/products", createProductRoutes(deps.productController));
    v1.route("/orders", createOrderRoutes(deps.orderController));
    v1.route("/tickets", createOrderTicketRoutes(deps.orderTicketController));
    v1.route("/sales-slots", createSalesSlotRoutes(deps.salesSlotController));

    // ヘルスチェックエンドポイント
    app.get("/health", (c) => c.json({ status: "ok" }));

    // サーバー情報を返す
    app.get("/info", (c) =>
        c.json({
            name: "timeseats-api",
            version: API_VERSION,
        })
    );

    // OpenAPI ドキュメント
    app.get(
        "/openapi",
        openAPISpecs(app, {
            documentation: {
                info: {
                    title: "TimeSeats API",
                    version: API_VERSION,
                    description: "TimeSeats バックエンドAPI",
                },
                servers: [
                    {
                        url: "http://localhost:3000",
                        description: "開発サーバー",
                    },
                ],
            },
        })
    );

    // API ドキュメントUI
    app.get(
        "/docs",
        apiReference({
            theme: "saturn",
            spec: { url: "/openapi" },
        })
    );

    // 404ハンドラー
    app.notFound((c) => {
        return c.json(
            {
                status: 404,
                message: "リソースが見つかりません",
            },
            404
        );
    });

    // エラーハンドラー
    app.onError((err, c) => {
        console.error("Unhandled error:", err);
        return c.json(
            {
                status: 500,
                message: "サーバーエラーが発生しました",
            },
            500
        );
    });

    return app;
};

// 共通のレスポンス型
export interface ApiResponse<T> {
    status: number;
    data?: T;
    error?: {
        message: string;
        details?: unknown;
    };
}

// ユーティリティ関数
export const success = <T>(data: T): ApiResponse<T> => ({
    status: 200,
    data,
});

export const error = (
    message: string,
    status = 500,
    details?: unknown
): ApiResponse<never> => ({
    status,
    error: {
        message,
        details,
    },
});
