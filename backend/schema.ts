import { z } from 'zod';

// User Schema for Auth
export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// OTP Schema
export const otpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z.string().min(6).optional(),
});

// Product Schema
export const productSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(3),
  category: z.string(),
  uom: z.string(),
  initialStock: z.number().default(0),
});

// Operation Schema (Receipts, Deliveries, Transfers, Adjustments)
export const operationSchema = z.object({
  type: z.enum(['Receipt', 'Delivery', 'Transfer', 'Adjustment']),
  productId: z.string(),
  quantity: z.number(),
  fromLocation: z.string().optional(),
  toLocation: z.string().optional(),
  status: z.enum(['Draft', 'Waiting', 'Ready', 'Done', 'Canceled']).default('Draft'),
});
