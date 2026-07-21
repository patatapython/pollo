import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { SPANISH_WORDS } from '@/diccionario/palabras';

/**
 * Diccionario español para passphrases
 * 7776 palabras del estándar Diceware español
 * Máxima entropía: ~12.9 bits/palabra
 * Total con 5 palabras: ~64 bits de entropía
 */
const WORD_LIST = SPANISH_WORDS;

/**
 * Generar índice aleatorio usando crypto.getRandomValues()
 * con rejection sampling para eliminar sesgo de módulo.
 * Criptográficamente seguro (no predecible).
 */
function getSecureRandomIndex(max: number): number {
  const bytesNeeded = Math.ceil(Math.log2(max) / 8);
  const maxValid = Math.pow(256, bytesNeeded);
  const limit = maxValid - (maxValid % max); // Mayor múltiplo de max que cabe

  // Rejection sampling: descartar valores que introducen sesgo
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const randomBytes = crypto.getRandomValues(new Uint8Array(bytesNeeded));
    let value = 0;
    for (let i = 0; i < bytesNeeded; i++) {
      value = (value << 8) | randomBytes[i];
    }
    if (value < limit) {
      return value % max;
    }
    // Valor sesgado, reintentar (probabilidad de rechazo < 12% con 7776 palabras)
  }
}

/**
 * Generar una passphrase de 5 palabras aleatorias
 * Ejemplo: "mesa verde compra viernes lago"
 * Garantías:
 * - 5 palabras reales y memorables del diccionario español
 * - Seleccionadas con crypto.getRandomValues() (CRIPTOGRÁFICAMENTE SEGURO)
 * - ~12.9 bits de entropía por palabra
 * - Total ~64.5 bits de entropía
 * - No usa seed, cada ejecución es completamente aleatoria
 *
 * Fuente de aleatoriedad:
 * - Node.js: crypto.getRandomValues() → /dev/urandom del SO
 * - Navegador: crypto.getRandomValues() → Web Crypto API
 */
export function generate(): string {
  if (WORD_LIST.length === 0) {
    throw new Error('Word list is empty');
  }

  const words: string[] = [];
  for (let i = 0; i < 5; i++) {
    const randomIndex = getSecureRandomIndex(WORD_LIST.length);
    words.push(WORD_LIST[randomIndex]);
  }

  const passphrase = words.join(' ');

  // Validación: minimo 15 caracteres, minimo 4 palabras
  if (passphrase.length < 15 || passphrase.split(' ').length < 4) {
    // Reintentar (extremadamente improbable con palabras de 3+ caracteres)
    return generate();
  }

  return passphrase;
}

/**
 * Hashear passphrase con bcrypt (12 rounds)
 * Retorna el hash para almacenar en DB (para verificación segura)
 */
export async function hash(passphrase: string): Promise<string> {
  return bcrypt.hash(passphrase, 12);
}

/**
 * Computar lookup HMAC-SHA256 para búsqueda O(1) en DB
 * Determinista: mismo input = mismo output
 * Requiere SERVER_SECRET como env var
 */
export function computeLookup(passphrase: string): string {
  const secret = process.env.SERVER_SECRET;
  if (!secret) {
    throw new Error('SERVER_SECRET env var not configured');
  }
  return crypto
    .createHmac('sha256', secret)
    .update(passphrase)
    .digest('hex');
}

/**
 * Verificar passphrase contra hash bcrypt
 * Usado para validación segura después de lookup HMAC
 */
export async function verify(passphrase: string, hash: string): Promise<boolean> {
  return bcrypt.compare(passphrase, hash);
}

/**
 * Repair key: lowercase + strip combining diacritics (NFD).
 * "Año" -> "ano", "José" -> "jose", "vergüenza" -> "verguenza".
 */
// Normaliza a proposito, y eso NO viola la prohibicion de normalizar: solo
// indexa el diccionario, su salida nunca llega a hash/verify/computeLookup.
// Ver docs/auth-invariants.md antes de tocarla o borrarla.
export function repairKey(word: string): string {
  return word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

let repairMap: Map<string, string[]> | null = null;

/**
 * Lazily builds and caches, for the process lifetime, a map from repair-key
 * to the dictionary words that share it (see `repairKey`).
 */
function getRepairMap(): Map<string, string[]> {
  if (!repairMap) {
    repairMap = new Map();
    for (const w of WORD_LIST) {
      const key = repairKey(w);
      const existing = repairMap.get(key);
      if (existing) {
        if (!existing.includes(w)) existing.push(w);
      } else {
        repairMap.set(key, [w]);
      }
    }
  }
  return repairMap;
}

// Caps how many candidate phrases are HMAC-looked-up and bcrypt-verified per
// request, bounding work per call; real passphrases need far fewer since only
// ~18 dictionary keys have collisions, all 2-way.
const MAX_CANDIDATES = 64;

/**
 * Given typed input, return every plausible original passphrase:
 * per word, the dictionary entries sharing its repair key (or the word
 * as typed when the key is unknown). The as-typed phrase is always
 * included first, so current behavior is preserved as a subset.
 * Bounded: at most MAX_CANDIDATES results.
 */
export function candidatePassphrases(input: string): string[] {
  const typed = input.trim().replace(/\s+/g, ' ');
  const words = typed.split(' ');

  // Defensive bound: never recurse on pathological input, even if a future
  // caller skips PassphraseSchema. Real passphrases are <= 12 tokens.
  if (words.length > 12) return [typed];

  const map = getRepairMap();

  const perWord: string[][] = words.map((w) => {
    const candidates = map.get(repairKey(w)) ?? [];
    return candidates.length > 0 ? candidates : [w];
  });

  const phrases: string[] = [typed];
  const build = (idx: number, acc: string[]) => {
    if (phrases.length >= MAX_CANDIDATES) return;
    if (idx === words.length) {
      const phrase = acc.join(' ');
      if (!phrases.includes(phrase)) phrases.push(phrase);
      return;
    }
    for (const c of perWord[idx]) build(idx + 1, [...acc, c]);
  };
  build(0, []);
  return phrases;
}
