import type { MiddlewareHandler } from "hono";
import { pino } from "pino";

// ロガーインスタンスの作成
export const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport: {
        target: "pino-pretty",
        options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
        },
    },
});

// ミドルウェアの実装
export const loggerMiddleware: MiddlewareHandler = async (c, next) => {
    const start = performance.now();
    const { method, url } = c.req;

    // リクエストのログ
    logger.info({
        type: "request",
        method,
        url,
        userAgent: c.req.header("user-agent"),
    });

    try {
        await next();
    } catch (error) {
        // エラーのログ
        logger.error({
            type: "error",
            method,
            url,
            error: {
                message:
                    error instanceof Error ? error.message : "Unknown error",
                stack: error instanceof Error ? error.stack : undefined,
            },
        });
        throw error;
    }

    // レスポンスのログ
    const end = performance.now();
    const responseTime = end - start;

    logger.info({
        type: "response",
        method,
        url,
        status: c.res.status,
        responseTime: `${responseTime.toFixed(2)}ms`,
    });
};

// コンテキスト付きロガーの作成ヘルパー
export const createLogger = (context: string) => {
    return logger.child({ context });
};
