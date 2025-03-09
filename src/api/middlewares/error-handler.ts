import type { Context, Next } from "hono";
import { ZodError } from "zod";

export const errorHandler = async (c: Context, next: Next) => {
    try {
        await next();
    } catch (error) {
        console.error("エラーが発生しました:", error);

        if (error instanceof ZodError) {
            return c.json(
                {
                    success: false,
                    error: error.errors,
                },
                400
            );
        }

        // カスタムエラーの処理
        if (error instanceof Error) {
            const statusCode = error instanceof NotFoundError ? 404 : 500;
            return c.json(
                {
                    success: false,
                    error: error.message,
                },
                statusCode
            );
        }

        // 未知のエラーの処理
        return c.json(
            {
                success: false,
                error: "予期せぬエラーが発生しました",
            },
            500
        );
    }
};

// カスタムエラークラス
export class NotFoundError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "NotFoundError";
    }
}
