/**
 * Client-side API Key Management
 * Keys are stored in localStorage with AES-256 encryption
 * Keys are passed to the backend via x-api-keys header (base64 encoded)
 */

const STORAGE_KEY = "aqindia_api_keys_v2";
const ENCRYPTION_SALT = "aqindia_salt_2025";

// Simple XOR-based obfuscation (AES-256 requires crypto-js which we have)
import CryptoJS from "crypto-js";

export interface APIKeyEntry {
  id: string;
  provider: "waqi" | "openmeteo" | "nasa" | "gemini" | "cpcb";
  label: string;
  key: string; // plaintext in memory only
  isActive: boolean;
  addedAt: string;
  usageCount: number;
  lastUsed?: string;
  isValid?: boolean;
}

export interface APIKeyStore {
  waqi: APIKeyEntry[];
  openmeteo: APIKeyEntry[];
  nasa: APIKeyEntry[];
  gemini: APIKeyEntry[];
  cpcb: APIKeyEntry[];
}

const PASSPHRASE = "aqindia_secure_2025_v2";

function encrypt(text: string): string {
  return CryptoJS.AES.encrypt(text, PASSPHRASE).toString();
}

function decrypt(ciphertext: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, PASSPHRASE);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}

export function loadAPIKeys(): APIKeyStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const decrypted = decrypt(raw);
    if (!decrypted) return emptyStore();
    return JSON.parse(decrypted);
  } catch {
    return emptyStore();
  }
}

export function saveAPIKeys(store: APIKeyStore): void {
  const json = JSON.stringify(store);
  const encrypted = encrypt(json);
  localStorage.setItem(STORAGE_KEY, encrypted);
}

export function addAPIKey(provider: APIKeyEntry["provider"], key: string, label?: string): APIKeyEntry {
  const store = loadAPIKeys();
  const entry: APIKeyEntry = {
    id: `${provider}_${Date.now()}`,
    provider,
    label: label || `${provider.toUpperCase()} Key ${store[provider].length + 1}`,
    key,
    isActive: true,
    addedAt: new Date().toISOString(),
    usageCount: 0,
  };
  store[provider].push(entry);
  saveAPIKeys(store);
  return entry;
}

export function removeAPIKey(provider: APIKeyEntry["provider"], id: string): void {
  const store = loadAPIKeys();
  store[provider] = store[provider].filter(k => k.id !== id);
  saveAPIKeys(store);
}

export function toggleAPIKey(provider: APIKeyEntry["provider"], id: string): void {
  const store = loadAPIKeys();
  const key = store[provider].find(k => k.id === id);
  if (key) key.isActive = !key.isActive;
  saveAPIKeys(store);
}

export function getActiveKeys(provider: APIKeyEntry["provider"]): string[] {
  const store = loadAPIKeys();
  return store[provider].filter(k => k.isActive).map(k => k.key);
}

export function getAllActiveKeys(): Record<string, string[]> {
  const store = loadAPIKeys();
  return {
    waqi: store.waqi.filter(k => k.isActive).map(k => k.key),
    openmeteo: store.openmeteo.filter(k => k.isActive).map(k => k.key),
    nasa: store.nasa.filter(k => k.isActive).map(k => k.key),
    gemini: store.gemini.filter(k => k.isActive).map(k => k.key),
    cpcb: store.cpcb.filter(k => k.isActive).map(k => k.key),
  };
}

export function buildAPIKeyHeader(): string {
  const keys = getAllActiveKeys();
  return btoa(JSON.stringify(keys));
}

export function hasGeminiKey(): boolean {
  return getActiveKeys("gemini").length > 0;
}

export function hasWAQIKey(): boolean {
  return getActiveKeys("waqi").length > 0;
}

export function getKeyCount(): Record<string, number> {
  const store = loadAPIKeys();
  return {
    waqi: store.waqi.filter(k => k.isActive).length,
    openmeteo: store.openmeteo.filter(k => k.isActive).length,
    nasa: store.nasa.filter(k => k.isActive).length,
    gemini: store.gemini.filter(k => k.isActive).length,
    cpcb: store.cpcb.filter(k => k.isActive).length,
  };
}

function emptyStore(): APIKeyStore {
  return { waqi: [], openmeteo: [], nasa: [], gemini: [], cpcb: [] };
}

// Hook for React components
import { useState, useEffect, useCallback } from "react";

export function useAPIKeys() {
  const [store, setStore] = useState<APIKeyStore>(emptyStore);
  const [keyHeader, setKeyHeader] = useState<string>("");

  useEffect(() => {
    const loaded = loadAPIKeys();
    setStore(loaded);
    setKeyHeader(buildAPIKeyHeader());
  }, []);

  const refresh = useCallback(() => {
    const loaded = loadAPIKeys();
    setStore(loaded);
    setKeyHeader(buildAPIKeyHeader());
  }, []);

  const add = useCallback((provider: APIKeyEntry["provider"], key: string, label?: string) => {
    addAPIKey(provider, key, label);
    refresh();
  }, [refresh]);

  const remove = useCallback((provider: APIKeyEntry["provider"], id: string) => {
    removeAPIKey(provider, id);
    refresh();
  }, [refresh]);

  const toggle = useCallback((provider: APIKeyEntry["provider"], id: string) => {
    toggleAPIKey(provider, id);
    refresh();
  }, [refresh]);

  return { store, keyHeader, add, remove, toggle, refresh, hasGemini: hasGeminiKey(), hasWAQI: hasWAQIKey() };
}
