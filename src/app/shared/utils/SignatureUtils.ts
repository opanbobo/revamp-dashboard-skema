import { v4 as uuidv4 } from 'uuid';
import * as CryptoJS from 'crypto-js';

const SECRET_KEY = 'sk_9f3b7c2eA1KQx8N6M0pRZyWJ4DVaL5U7HBTmEoC';

export function generateNonce(): string {
  return uuidv4();
}

export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

export function generateSignature(
  params: {
    term: string;
    start_date: string;
    end_date: string;
    page: number;
    max_size: number;
    media_category: string;
    search_field: string;
  },
  timestamp: string,
  nonce: string
): string {

  const signatureFields: Record<string, string> = {
    end_date: params.end_date,
    max_size: String(params.max_size),
    media_category: params.media_category,
    nonce,
    page: String(params.page),
    search_field: params.search_field,
    start_date: params.start_date,
    term: params.term,
    timestamp
  };

  const canonicalString = Object.keys(signatureFields)
    .sort((a, b) => a.localeCompare(b))
    .map(key => `${key}=${signatureFields[key]}`)
    .join('&');

  return CryptoJS
    .HmacSHA256(canonicalString, SECRET_KEY)
    .toString(CryptoJS.enc.Hex);
}