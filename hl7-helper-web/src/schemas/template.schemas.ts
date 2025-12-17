/**
 * Zod schemas for Template types
 */
import { z } from 'zod';

/**
 * Schema for Template
 * Matches src/types/template.ts
 */
export const TemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  messageType: z.string(),
  content: z.string(),
  createdAt: z.number(),
});

/**
 * Schema for array of Templates
 */
export const TemplateArraySchema = z.array(TemplateSchema);
