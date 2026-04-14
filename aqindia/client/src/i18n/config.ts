export type Language = 
  | 'en'
  | 'hi'
  | 'ta'
  | 'bn'
  | 'mr'
  | 'gu'
  | 'te'
  | 'kn'
  | 'ml'
  | 'pa'
  | 'ur';

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳' },
];

export const DEFAULT_LANGUAGE: Language = 'en';

const translationCache: Record<string, any> = {};

export async function loadTranslations(lang: Language): Promise<any> {
  if (translationCache[lang]) {
    return translationCache[lang];
  }

  try {
    const module = await import(`./${lang}.json`);
    translationCache[lang] = module.default;
    return module.default;
  } catch (error) {
    console.warn(`[i18n] Failed to load translations for ${lang}, falling back to English`);
    const fallback = await import('./en.json');
    translationCache[lang] = fallback.default;
    return fallback.default;
  }
}

/**
 * Get nested value from translation object
 */
function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let value = obj;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return path; // Return key if not found
    }
  }
  
  return typeof value === 'string' ? value : path;
}

/**
 * Translate a key
 */
export function translate(key: string, lang: Language, fallback?: string): string {
  const translations = translationCache[lang] || translationCache['en'];
  
  if (!translations) {
    return fallback || key;
  }
  
  return getNestedValue(translations, key) || fallback || key;
}

/**
 * Format number according to locale
 */
export function formatNumber(value: number, lang: Language): string {
  const localeMap: Record<Language, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
    ur: 'ur-IN',
  };
  
  return new Intl.NumberFormat(localeMap[lang] || 'en-IN').format(value);
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date, lang: Language): string {
  const localeMap: Record<Language, string> = {
    en: 'en-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
    bn: 'bn-IN',
    mr: 'mr-IN',
    gu: 'gu-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
    pa: 'pa-IN',
    ur: 'ur-IN',
  };
  
  return new Intl.DateTimeFormat(localeMap[lang] || 'en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
