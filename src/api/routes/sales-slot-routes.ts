import { Hono } from "hono";
import type { Context } from "hono";
import type { SalesSlotController } from "../../application/controllers/sales-slot-controller.js";

export const createSalesSlotRoutes = (controller: SalesSlotController) => {
    const router = new Hono();

    // 販売枠一覧の取得
    router.get("/", (c: Context) => controller.getAllSalesSlots(c));

    // 販売枠の取得
    router.get("/:id", (c: Context) => controller.getSalesSlotById(c));

    // 販売枠の作成
    router.post("/", (c: Context) => controller.createSalesSlot(c));

    // 販売枠の更新
    router.put("/:id", (c: Context) => controller.updateSalesSlot(c));

    // 販売枠の削除
    router.delete("/:id", (c: Context) => controller.deleteSalesSlot(c));

    return router;
};
