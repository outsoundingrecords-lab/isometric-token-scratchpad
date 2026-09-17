/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TokenItem, AlertState } from '../types';

export interface SharedBreakdownState {
  v: 1;
  scenarioId?: string;
  customPrompt?: string;
  bufferLimit: number;
  speedMs: number;
  tokens: TokenItem[];
  paperCount: number;
  alertCategory?: AlertState['category'];
  timestamp?: number;
}

/**
 * Encodes breakdown state into a URL-safe base64 string
 */
export function serializeStateToHash(state: SharedBreakdownState): string {
  try {
    const jsonStr = JSON.stringify(state);
    // Safe UTF-8 to Base64
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    utf8Bytes.forEach((b) => (binary += String.fromCharCode(b)));
    const base64 = btoa(binary);
    // Replace URL-sensitive characters
    const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return urlSafe;
  } catch (err) {
    console.error('Failed to serialize breakdown state:', err);
    return '';
  }
}

/**
 * Decodes breakdown state from URL hash or query string
 */
export function deserializeStateFromHash(hashOrString: string): SharedBreakdownState | null {
  try {
    let clean = hashOrString.trim();
    if (clean.startsWith('#state=')) {
      clean = clean.slice(7);
    } else if (clean.startsWith('#')) {
      clean = clean.slice(1);
    } else if (clean.includes('state=')) {
      const match = clean.match(/state=([^&]+)/);
      if (match) clean = match[1];
    }

    if (!clean) return null;

    // Convert from URL-safe back to standard base64
    let base64 = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const jsonStr = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(jsonStr) as SharedBreakdownState;

    if (parsed && Array.isArray(parsed.tokens)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('Failed to deserialize breakdown state from URL:', err);
    return null;
  }
}
