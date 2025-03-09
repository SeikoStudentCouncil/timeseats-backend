import { Hono } from "hono";
import type { Context } from "hono";
import type { OrderController } from "../../application/controllers/order-controller.js";

export const createOrderRoutes = (controller: OrderController) => {
    const router = new Hono();

    // 注文一覧の取得
    router.get("/", (c: Context) => controller.getAllOrders(c));

    // 注文の取得
    router.get("/:id", (c: Context) => controller.getOrderById(c));

    // 注文の作成（仮予約）
    router.post("/", (c: Context) => controller.createOrder(c));

    // 注文のキャンセル
    router.post("/:id/cancel", (c: Context) => controller.cancelOrder(c));

    // 注文の確定
    router.post("/:id/confirm", (c: Context) => controller.confirmOrder(c));

    // ステータスによる注文の取得
    router.get("/status/:status", (c: Context) =>
        controller.getOrdersByStatus(c)
    );

    // チケット番号による注文の取得
    router.get("/ticket/:ticketNumber", (c: Context) =>
        controller.getOrdersByTicketNumber(c)
    );

    // 注文の商品受け渡し完了
    router.post("/:id/delivered", (c: Context) =>
        controller.markOrderAsDelivered(c)
    );

    return router;
};
