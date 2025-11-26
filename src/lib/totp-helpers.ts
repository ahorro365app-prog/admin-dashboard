import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Configuración TOTP
 */
const TOTP_ISSUER = 'Ahorro365 Admin';
const TOTP_LABEL = 'Ahorro365';

/**
 * Genera un secreto TOTP para un usuario
 * @param email Email del usuario admin
 * @returns Objeto con el secreto y la URL para generar el QR
 */
export async function generateTOTPSecret(email: string): Promise<{
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}> {
  // Generar secreto
  const secret = speakeasy.generateSecret({
    name: `${TOTP_LABEL} (${email})`,
    issuer: TOTP_ISSUER,
    length: 32,
  });

  if (!secret.base32) {
    throw new Error('Error generando secreto TOTP');
  }

  // Generar URL para QR code
  const otpauthUrl = secret.otpauth_url;
  if (!otpauthUrl) {
    throw new Error('Error generando URL TOTP');
  }

  // Generar QR code como data URL
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    width: 300,
    margin: 1,
  });

  return {
    secret: secret.base32,
    otpauthUrl: otpauthUrl,
    qrCodeDataUrl: qrCodeDataUrl,
  };
}

/**
 * Verifica un código TOTP
 * @param token Código de 6 dígitos ingresado por el usuario
 * @param secret Secreto TOTP almacenado
 * @returns true si el código es válido
 */
export function verifyTOTPToken(token: string, secret: string): boolean {
  // Validar formato del token (6 dígitos)
  if (!/^\d{6}$/.test(token)) {
    return false;
  }

  // Verificar token con ventana de tiempo (permite tokens anteriores/posteriores)
  // window: 1 = permite tokens de 30 segundos antes y después
  const verified = speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1, // Permite tokens de ±30 segundos
  });

  return verified === true;
}

/**
 * Genera códigos de respaldo (backup codes)
 * @param count Número de códigos a generar (por defecto 10)
 * @returns Array de códigos de respaldo
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generar código de 8 caracteres alfanuméricos
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
}

/**
 * Hashea un código de respaldo para almacenarlo de forma segura
 * @param code Código de respaldo en texto plano
 * @returns Hash del código
 */
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Verifica un código de respaldo
 * @param code Código ingresado por el usuario
 * @param hashedCodes Array de códigos hasheados almacenados
 * @returns true si el código es válido
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const hashedCode = hashBackupCode(code.toUpperCase());
  return hashedCodes.includes(hashedCode);
}

/**
 * Elimina un código de respaldo usado
 * @param code Código usado
 * @param hashedCodes Array de códigos hasheados
 * @returns Nuevo array sin el código usado
 */
export function removeUsedBackupCode(code: string, hashedCodes: string[]): string[] {
  const hashedCode = hashBackupCode(code.toUpperCase());
  return hashedCodes.filter(h => h !== hashedCode);
}

