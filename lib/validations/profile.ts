import { z } from "zod";
import { Occupation } from "@prisma/client";
import { nameSchema } from "@/lib/validations/auth";

/** Indian mobile numbers: 10 digits starting 6–9, optional +91 / 0 prefix. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s\-()]/g, ""))
  .refine((v) => /^(?:\+91|91|0)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number")
  .transform((v) => v.replace(/^(?:\+91|91|0)/, ""));

/**
 * The mobile number is optional: a trainee is never blocked from the portal for
 * not having one. A number that IS entered still has to be a valid Indian
 * mobile, so the field never fills with unusable data. Blank input becomes
 * `null` rather than `""` so the column stays genuinely unset.
 */
export const optionalPhoneSchema = z
  .union([phoneSchema, z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v === "" || v === undefined ? null : v));

export const occupationSchema = z.nativeEnum(Occupation, {
  errorMap: () => ({ message: "Select your occupation" }),
});

export const profileSchema = z.object({
  name: nameSchema,
  phone: optionalPhoneSchema,
  occupation: occupationSchema,
});

/** Occupation is locked once chosen — a user belongs to exactly one trade. */
export const profileUpdateSchema = z.object({
  name: nameSchema,
  phone: optionalPhoneSchema,
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
