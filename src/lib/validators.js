import { z } from 'zod';

const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const signUpSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be at most 255 characters')
    .toLowerCase()
    .trim(),
  password: passwordRule,
});

export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Password is required'),
});

export const projectSchema = z.object({
  resumeText: z
    .string()
    .min(50, 'Resume text must be at least 50 characters')
    .max(50000, 'Resume text must be at most 50,000 characters'),
  jobDescription: z
    .string()
    .min(50, 'Job description must be at least 50 characters')
    .max(50000, 'Job description must be at most 50,000 characters'),
  jobTitle: z
    .string()
    .max(200, 'Job title must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  company: z
    .string()
    .max(200, 'Company name must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  tone: z.enum(['professional', 'confident', 'concise', 'fresh-graduate'], {
    errorMap: () => ({ message: 'Please select a valid tone' }),
  }),
  length: z.enum(['short', 'standard', 'detailed'], {
    errorMap: () => ({ message: 'Please select a valid length' }),
  }),
});

export const settingsSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be at most 255 characters')
    .toLowerCase()
    .trim(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordRule,
});
