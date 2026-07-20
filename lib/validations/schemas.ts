import { z } from 'zod';

/**
 * PASSPHRASE SCHEMA
 * Validación para passphrases (crear lista / acceder a lista)
 */
export const PassphraseSchema = z
  .string()
  .min(15, 'Passphrase must be at least 15 characters')
  .refine(
    (val) => {
      const words = val.trim().split(/\s+/);
      return words.length >= 4;
    },
    'Passphrase must contain at least 4 words separated by spaces'
  )
  .refine(
    (val) => {
      // Validación: palabras válidas (sin números aleatorios, solo caracteres)
      const words = val.trim().split(/\s+/);
      return words.every((word) => /^[a-záéíóúñü_]+$/i.test(word));
    },
    'Each word must contain only letters'
  );

export type Passphrase = z.infer<typeof PassphraseSchema>;

/**
 * CREATE LIST SCHEMA
 * Validación para crear una nueva lista
 */
export const CreateListSchema = z.object({
  name: z
    .string()
    .min(1, 'List name is required')
    .max(255, 'List name must be 255 characters or less')
    .trim(),
});

export type CreateList = z.infer<typeof CreateListSchema>;

/**
 * UPDATE LIST SCHEMA
 * Validación para actualizar nombre de lista
 */
export const UpdateListSchema = z.object({
  name: z
    .string()
    .min(1, 'List name is required')
    .max(255, 'List name must be 255 characters or less')
    .trim(),
});

export type UpdateList = z.infer<typeof UpdateListSchema>;

/**
 * CREATE ITEM SCHEMA
 * Validación para agregar item a lista
 */
export const CreateItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Item name is required')
    .max(500, 'Item name must be 500 characters or less')
    .trim(),
  quantity: z
    .string()
    .max(50, 'Quantity must be 50 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),
});

export type CreateItem = z.infer<typeof CreateItemSchema>;

/**
 * UPDATE ITEM SCHEMA
 * Validación para actualizar item (nombre, cantidad, notas, estado)
 */
export const UpdateItemSchema = z.object({
  name: z
    .string()
    .min(1, 'Item name cannot be empty')
    .max(500, 'Item name must be 500 characters or less')
    .trim()
    .optional(),
  quantity: z
    .string()
    .max(50, 'Quantity must be 50 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .transform((val) => (val ? val.trim() : undefined)),
  is_completed: z.boolean().optional(),
});

export type UpdateItem = z.infer<typeof UpdateItemSchema>;

/**
 * UUID SCHEMA
 * Validación para UUIDs
 */
export const UUIDSchema = z
  .string()
  .uuid('Invalid UUID format');

export type UUID = z.infer<typeof UUIDSchema>;

/**
 * LIST ID SCHEMA
 * Validación de parámetro list_id en rutas
 */
export const ListIdSchema = z.object({
  id: UUIDSchema,
});

export type ListId = z.infer<typeof ListIdSchema>;

/**
 * ITEM ID SCHEMA
 * Validación de parámetro item_id en rutas
 */
export const ItemIdSchema = z.object({
  itemId: UUIDSchema,
});

export type ItemId = z.infer<typeof ItemIdSchema>;

/**
 * QUERY SCHEMA - Items filter
 * Validación de query parameters en GET /api/lists/[id]/items
 */
export const ItemsQuerySchema = z.object({
  status: z
    .enum(['all', 'active', 'purchased'])
    .default('all'),
});

export type ItemsQuery = z.infer<typeof ItemsQuerySchema>;

/**
 * ACCESS SCHEMA
 * Validación para acceder a lista con passphrase
 */
export const AccessSchema = z.object({
  passphrase: PassphraseSchema,
});

export type Access = z.infer<typeof AccessSchema>;
