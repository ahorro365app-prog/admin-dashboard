import bcrypt from 'bcryptjs';

/**
 * Número de rounds para el hash bcrypt (10 es un buen balance entre seguridad y velocidad)
 */
const BCRYPT_ROUNDS = 10;

/**
 * Hashea una contraseña usando bcrypt
 * @param password - Contraseña en texto plano
 * @returns Hash de la contraseña
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano con un hash bcrypt
 * @param password - Contraseña en texto plano
 * @param hash - Hash bcrypt almacenado
 * @returns true si la contraseña coincide, false en caso contrario
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Verifica si un string es un hash bcrypt válido
 * Los hashes bcrypt siempre empiezan con $2a$, $2b$, o $2y$
 * @param hash - String a verificar
 * @returns true si parece ser un hash bcrypt válido
 */
export function isBcryptHash(hash: string): boolean {
  return /^\$2[ayb]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash);
}

/**
 * Migra una contraseña de texto plano a bcrypt
 * Útil para migrar contraseñas existentes
 * @param plainPassword - Contraseña en texto plano
 * @returns Hash bcrypt de la contraseña
 */
export async function migratePasswordToBcrypt(plainPassword: string): Promise<string> {
  return hashPassword(plainPassword);
}

