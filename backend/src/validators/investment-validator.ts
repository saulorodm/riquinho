import { InvestmentType } from "@prisma/client";
import { z } from "zod";

function isQuotaBased(assetType: InvestmentType) {
  return assetType !== InvestmentType.FIXED_INCOME && assetType !== InvestmentType.CASH_RESERVE;
}

export const investmentContributionPayloadSchema = z
  .object({
    name: z.string().min(2).max(120),
    assetType: z.nativeEnum(InvestmentType),
    investedAt: z.string().datetime(),
    amountInvested: z.coerce.number().positive().optional(),
    currentValue: z.coerce.number().positive().optional(),
    netCurrentValue: z.coerce.number().positive().optional(),
    quantity: z.coerce.number().positive().optional(),
    unitPrice: z.coerce.number().positive().optional(),
    notes: z.string().max(500).optional()
  })
  .superRefine((value, context) => {
    if (isQuotaBased(value.assetType)) {
      if (!value.quantity) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["quantity"],
          message: "Quantity is required for quota-based assets"
        });
      }

      if (!value.unitPrice) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["unitPrice"],
          message: "Unit price is required for quota-based assets"
        });
      }
    } else {
      if (!value.amountInvested) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amountInvested"],
          message: "Amount invested is required for fixed income or cash"
        });
      }

      if (value.assetType === InvestmentType.FIXED_INCOME) {
        if (!value.currentValue) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["currentValue"],
            message: "Current gross value is required for fixed income"
          });
        }

        if (!value.netCurrentValue) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["netCurrentValue"],
            message: "Current net value is required for fixed income"
          });
        }
      }

      if (value.assetType === InvestmentType.CASH_RESERVE) {
        if (!value.currentValue) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["currentValue"],
            message: "Current gross value is required for cash reserve"
          });
        }

        if (!value.netCurrentValue) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["netCurrentValue"],
            message: "Current net value is required for cash reserve"
          });
        }
      }
    }
  });

export const investmentPositionUpdatePayloadSchema = z.object({
  amountInvested: z.coerce.number().nonnegative().optional(),
  currentQuantity: z.coerce.number().nonnegative().optional(),
  currentValue: z.coerce.number().nonnegative().optional(),
  netCurrentValue: z.coerce.number().nonnegative().optional(),
  notes: z.string().max(500).optional()
}).superRefine((value, context) => {
  if (
    value.currentQuantity === undefined &&
    value.currentValue === undefined &&
    value.amountInvested === undefined
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["currentQuantity"],
      message: "Current quantity, current value, or amount invested is required"
    });
  }
});
