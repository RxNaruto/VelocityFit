import crypto from 'crypto';
const SCRYPT_KEYLEN = 64;
/**
 * Lightweight password hashing using Node's built-in scrypt so we don't
 * need a native bcrypt dependency. Hash format: `scrypt$<saltHex>$<hashHex>`.
 */
export function hashPassword(password) {
    const salt = crypto.randomBytes(16);
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
    return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}
export function verifyPassword(password, stored) {
    if (typeof stored !== 'string')
        return false;
    const parts = stored.split('$');
    if (parts.length !== 3 || parts[0] !== 'scrypt')
        return false;
    const saltHex = parts[1];
    const expectedHex = parts[2];
    if (!saltHex || !expectedHex)
        return false;
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(expectedHex, 'hex');
    const derived = crypto.scryptSync(password, salt, expected.length);
    if (derived.length !== expected.length)
        return false;
    return crypto.timingSafeEqual(derived, expected);
}
export function generateToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}
//# sourceMappingURL=crypto.js.map