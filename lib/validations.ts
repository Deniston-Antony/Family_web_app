import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be less than 128 characters");

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be less than 30 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores");

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(50),
    username: usernameSchema,
    email: z.string().email("Invalid email address"),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  totpCode: z.string().optional(),
});

export const enableTwoFactorSchema = z.object({
  secret: z.string().min(16),
  code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit code"),
});

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, "Password is required"),
  code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit code"),
});

export const verifyTwoFactorSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit code"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: usernameSchema.optional(),
  bio: z.string().max(500).optional(),
  statusMessage: z.string().max(200).optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const sendMessageSchema = z.object({
  conversationId: z.string().cuid(),
  content: z.string().min(1, "Message cannot be empty").max(5000),
});

export const editMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(5000),
});

export const friendRequestSchema = z.object({
  receiverId: z.string().cuid(),
});

export const createGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters").max(50),
  memberIds: z
    .array(z.string().cuid())
    .min(1, "Add at least one friend")
    .max(49, "Too many members"),
});

export const updateGroupNameSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters").max(50),
});

export const addGroupMembersSchema = z.object({
  memberIds: z.array(z.string().cuid()).min(1).max(49),
});

export const removeGroupMemberSchema = z.object({
  memberId: z.string().cuid(),
});

export const searchSchema = z.object({
  query: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
