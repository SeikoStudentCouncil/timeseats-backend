import { Hono } from "hono";
import { createProductRoutes } from "./product-routes.js";
import { createOrderRoutes } from "./order-routes.js";
import { createOrderTicketRoutes } from "./order-ticket-routes.js";
import { createSalesSlotRoutes } from "./sales-slot-routes.js";
import { errorHandler } from "../middlewares/index.js";
import { loggerMiddleware } from "../middlewares/logger.js";
import { openAPISpecs } from "hono-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import type { ProductController } from "../../application/controllers/index.js";
import type { OrderController } from "../../application/controllers/index.js";
import type { OrderTicketController } from "../../application/controllers/index.js";
import type { SalesSlotController } from "../../application/controllers/index.js";

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
        "/openapi.json",
        openAPISpecs(app, {
            documentation: {
                info: {
                    title: "TimesEats API",
                    version: API_VERSION,
                    description: "TimesEats Backend API",
                },
                servers: [
                    {
                        url: "http://localhost:3000",
                        description: "TimesEats API Server",
                    },
                ],
            },
        })
    );

    // API ドキュメントUI
    app.get(
        "/docs",
        apiReference({
            theme: "alternate",
            url: "/openapi.json",
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
                message: err,
            },
            500
        );
    });

    return app;
};
