import crypto from "crypto";

/**
 * Verifies a plain text password against a Django-style password hash.
 * Supports pbkdf2_sha256 and md5 algorithms.
 */
export function verifyPassword(password: string, djangoHash: string): boolean {
  if (!djangoHash) return false;

  const parts = djangoHash.split("$");
  const algorithm = parts[0];

  if (algorithm === "pbkdf2_sha256") {
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const storedHashBase64 = parts[3];

    if (isNaN(iterations) || !salt || !storedHashBase64) return false;

    // Compute key using the salt and iterations
    const computedKey = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
    const computedHashBase64 = computedKey.toString("base64");

    const storedBuffer = Buffer.from(storedHashBase64, "base64");
    const computedBuffer = Buffer.from(computedHashBase64, "base64");

    if (storedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedBuffer, computedBuffer);
  } else if (algorithm === "md5") {
    if (parts.length !== 3) return false;
    const salt = parts[1];
    const storedHashHex = parts[2];

    if (!salt || !storedHashHex) return false;

    const hasher = crypto.createHash("md5");
    hasher.update(salt + password);
    const computedHashHex = hasher.digest("hex");

    const storedBuffer = Buffer.from(storedHashHex, "hex");
    const computedBuffer = Buffer.from(computedHashHex, "hex");

    if (storedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(storedBuffer, computedBuffer);
  }

  return false;
}

/**
 * Hashes a password using Django-compatible pbkdf2_sha256 algorithm.
 */
export function hashPassword(password: string): string {
  const iterations = 600000;
  // Generate a 12-character alphanumeric salt
  const salt = crypto
    .randomBytes(9)
    .toString("base64")
    .replace(/\+/g, "a")
    .replace(/\//g, "b")
    .substring(0, 12);

  const key = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const hashBase64 = key.toString("base64");

  return `pbkdf2_sha256$${iterations}$${salt}$${hashBase64}`;
}
