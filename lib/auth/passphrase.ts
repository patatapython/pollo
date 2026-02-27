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
