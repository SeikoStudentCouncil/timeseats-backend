import { z } from "zod";
import { PaymentMethod } from "../../domain/types/index.js";

export const createTicketSchema = z.object({
    orderId: z.string().min(1, "注文IDは必須です"),
    paymentMethod: z.nativeEnum(PaymentMethod, {
        errorMap: () => ({ message: "無効な支払い方法です" }),
    }),
    transactionId: z.string().optional(),
});

export const updatePaymentStatusSchema = z.object({
    isPaid: z.boolean({
        required_error: "支払い状態は必須です",
    }),
});

export const updateDeliveryStatusSchema = z.object({
    isDelivered: z.boolean({
        required_error: "引き渡し状態は必須です",
    }),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdatePaymentStatusInput = z.infer<
    typeof updatePaymentStatusSchema
>;
export type UpdateDeliveryStatusInput = z.infer<
    typeof updateDeliveryStatusSchema
>;

export const OrderTicketValidator = {
    validateCreate: (input: unknown) => createTicketSchema.parse(input),
    validateUpdatePayment: (input: unknown) =>
        updatePaymentStatusSchema.parse(input),
    validateUpdateDelivery: (input: unknown) =>
        updateDeliveryStatusSchema.parse(input),
};
