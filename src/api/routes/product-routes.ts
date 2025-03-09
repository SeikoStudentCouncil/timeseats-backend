import { Hono } from "hono";
import type { Context } from "hono";
import type { ProductController } from "../../application/controllers/product-controller.js";

export const createProductRoutes = (controller: ProductController) => {
    const router = new Hono();

    // 商品一覧の取得
    router.get("/", (c: Context) => controller.getAllProducts(c));

    // 商品の取得
    router.get("/:id", (c: Context) => controller.getProductById(c));

    // 商品の作成
    router.post("/", (c: Context) => controller.createProduct(c));

    // 商品の更新
    router.put("/:id", (c: Context) => controller.updateProduct(c));

    // 商品の削除
    router.delete("/:id", (c: Context) => controller.deleteProduct(c));

    // 商品在庫の設定
    router.post("/:id/inventory", (c: Context) =>
        controller.setProductInventory(c)
    );

    // 特定の販売枠における商品在庫の取得
    router.get("/:id/inventory/:salesSlotId", (c: Context) =>
        controller.getProductInventory(c)
    );

    // 商品の全販売枠における在庫の取得
    router.get("/:id/inventory", (c: Context) =>
        controller.getInventoryForProduct(c)
    );

    return router;
};
