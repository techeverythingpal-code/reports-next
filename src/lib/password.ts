import "server-only";
import bcrypt from "bcryptjs";

// Laravel stores bcrypt hashes with the "$2y$" prefix (PHP's variant).
// It is the same algorithm as "$2b$", so existing passwords keep working.
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  const normalized = hash.startsWith("$2y$") ? "$2b$" + hash.slice(4) : hash;
  try {
    return await bcrypt.compare(plain, normalized);
  } catch {
    return false;
  }
}

// Saved as "$2y$" so the Laravel app can still read passwords changed here
// while both apps run side by side.
export async function hashPassword(plain: string): Promise<string> {
  const hash = await bcrypt.hash(plain, 12);
  return "$2y$" + hash.slice(4);
}
