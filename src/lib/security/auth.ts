/**
 * Security & Hashing utilities for PIN protection
 * Uses Web Crypto API SHA-256 hashing with salt
 */

const PIN_SALT = 'aradhana_cafe_secure_salt_2026';

export async function hashPin(pin: string): Promise<string> {
  const cleanPin = pin.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(`${PIN_SALT}_${cleanPin}`);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback simple fast deterministic hash for non-subtle contexts
  let hash = 0;
  const str = `${PIN_SALT}_${cleanPin}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash)}`;
}

export async function verifyPin(enteredPin: string, storedHash: string): Promise<boolean> {
  const enteredHash = await hashPin(enteredPin);
  return enteredHash === storedHash;
}
