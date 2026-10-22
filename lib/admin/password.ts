import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number; maxmem: number }) => Promise<Buffer>;

const N = 32768;
const R = 8;
const P = 1;
const LEN = 64;

/** Format : scrypt:N:r:p:sel:empreinte (base64). Le mot de passe n'est jamais conservé, seulement son empreinte. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, LEN, { N, r: R, p: P, maxmem: 128 * N * R * 2 });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join(":");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = stored.split(":");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const params = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Number.isInteger(params.N) || params.N < 16384 || params.N > 1 << 20 || params.r < 1 || params.p < 1) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(password, Buffer.from(salt, "base64"), expected.length, { ...params, maxmem: 256 * params.N * params.r });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export const MIN_PASSWORD_LENGTH = 12;
