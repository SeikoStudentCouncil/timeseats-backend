import { Hono } from "hono";
import type { Context } from "hono";
import type { OrderTicketController } from "../../application/controllers/order-ticket-controller.js";

export const createOrderTicketRoutes = (controller: OrderTicketController) => {
    const router = new Hono();

    // 伝票一覧の取得
    router.get("/", (c: Context) => controller.getAllTickets(c));

    // 伝票の取得
    router.get("/:id", (c: Context) => controller.getTicketById(c));

    // 伝票番号による伝票の取得
    router.get("/number/:number", (c: Context) =>
        controller.getTicketByNumber(c)
    );

    // 伝票の作成
    router.post("/", (c: Context) => controller.createTicket(c));

    // 伝票の削除
    router.delete("/:id", (c: Context) => controller.deleteTicket(c));

    // 伝票の支払い状態を更新
    router.put("/:id/payment", (c: Context) =>
        controller.updatePaymentStatus(c)
    );

    // 伝票の受け取り状態を更新
    router.put("/:id/delivery", (c: Context) =>
        controller.updateDeliveryStatus(c)
    );

    // 支払い済み伝票の取得
    router.get("/status/paid", (c: Context) => controller.getPaidTickets(c));

    // 未払い伝票の取得
    router.get("/status/unpaid", (c: Context) =>
        controller.getUnpaidTickets(c)
    );

    return router;
};
