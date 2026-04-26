/**
 * Lightweight password hashing using Node's built-in scrypt so we don't
 * need a native bcrypt dependency. Hash format: `scrypt$<saltHex>$<hashHex>`.
 */
export declare function hashPassword(password: string): string;
export declare function verifyPassword(password: string, stored: string): boolean;
export declare function generateToken(bytes?: number): string;
//# sourceMappingURL=crypto.d.ts.map