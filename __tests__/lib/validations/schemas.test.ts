import { describe, it, expect } from 'vitest';
import {
  PassphraseSchema,
  CreateListSchema,
  UpdateListSchema,
  CreateItemSchema,
  UpdateItemSchema,
  UUIDSchema,
  ListIdSchema,
  ItemIdSchema,
  AccessSchema,
} from '@/lib/validations/schemas';

describe('schemas', () => {
  describe('PassphraseSchema', () => {
    it('should accept valid passphrases', () => {
      const valid = 'mesa verde compra viernes lago';
      const result = PassphraseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject passphrases shorter than 15 characters', () => {
      const invalid = 'mesa verde lake';
      const result = PassphraseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject passphrases with fewer than 4 words', () => {
      const invalid = 'mesa verde compra';
      const result = PassphraseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject passphrases with numbers', () => {
      const invalid = 'mesa verde compra 123 lago';
      const result = PassphraseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept passphrases with special Spanish characters', () => {
      const valid = 'mañana niño café día único';
      const result = PassphraseSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('CreateListSchema', () => {
    it('should accept valid list creation data', () => {
      const valid = { name: 'Supermercado' };
      const result = CreateListSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty list names', () => {
      const invalid = { name: '' };
      const result = CreateListSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject list names longer than 255 characters', () => {
      const invalid = { name: 'a'.repeat(256) };
      const result = CreateListSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should trim whitespace from list names', () => {
      const input = { name: '  Supermercado  ' };
      const result = CreateListSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Supermercado');
      }
    });
  });

  describe('UpdateListSchema', () => {
    it('should accept valid list update data', () => {
      const valid = { name: 'Supermercado Updated' };
      const result = UpdateListSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject empty names', () => {
      const invalid = { name: '' };
      const result = UpdateListSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateItemSchema', () => {
    it('should accept valid item creation data', () => {
      const valid = { name: 'Manzanas' };
      const result = CreateItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept item with optional quantity', () => {
      const valid = { name: 'Manzanas', quantity: '5 kg' };
      const result = CreateItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept item with optional notes', () => {
      const valid = { name: 'Manzanas', notes: 'Preferir rojas' };
      const result = CreateItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject items with empty name', () => {
      const invalid = { name: '' };
      const result = CreateItemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject items with name longer than 500 characters', () => {
      const invalid = { name: 'a'.repeat(501) };
      const result = CreateItemSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateItemSchema', () => {
    it('should accept partial item update (only name)', () => {
      const valid = { name: 'Updated Item' };
      const result = UpdateItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept partial item update (only quantity)', () => {
      const valid = { quantity: '10 units' };
      const result = UpdateItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept is_purchased flag', () => {
      const valid = { is_purchased: true };
      const result = UpdateItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should accept all fields', () => {
      const valid = {
        name: 'Manzanas',
        quantity: '5 kg',
        notes: 'Rojas',
        is_purchased: true,
      };
      const result = UpdateItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('UUIDSchema', () => {
    it('should accept valid UUIDs', () => {
      const valid = '550e8400-e29b-41d4-a716-446655440000';
      const result = UUIDSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      const invalid = 'not-a-uuid';
      const result = UUIDSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('ListIdSchema', () => {
    it('should accept valid list ID object', () => {
      const valid = { id: '550e8400-e29b-41d4-a716-446655440000' };
      const result = ListIdSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID in id field', () => {
      const invalid = { id: 'not-a-uuid' };
      const result = ListIdSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('ItemIdSchema', () => {
    it('should accept valid item ID object', () => {
      const valid = { itemId: '550e8400-e29b-41d4-a716-446655440000' };
      const result = ItemIdSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID in itemId field', () => {
      const invalid = { itemId: 'not-a-uuid' };
      const result = ItemIdSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('AccessSchema', () => {
    it('should accept valid access request', () => {
      const valid = { passphrase: 'mesa verde compra viernes lago' };
      const result = AccessSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid passphrase in access request', () => {
      const invalid = { passphrase: 'short' };
      const result = AccessSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});
