/**
 * i18n utility functions
 */

/**
 * Translates a key using the provided dictionary.
 * Supports dot notation (e.g., 'common.save') and variable replacement (e.g., '{name}').
 */
export function translate(
  dictionary: any,
  key: string,
  variables: Record<string, string | number> = {}
): string {
  const keys = key.split('.');
  let value = dictionary;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Fallback to key if not found
    }
  }

  if (typeof value !== 'string') {
    return key;
  }

  // Variable replacement
  return value.replace(/{(\w+)}/g, (_, name) => {
    return variables[name]?.toString() ?? `{${name}}`;
  });
}

/**
 * Loads the dictionary for the specified locale.
 * In a Next.js App Router context, this is typically called in a Server Component.
 */
export async function getDictionary(locale: string) {
  try {
    const dictionary = await import(`@/locales/${locale}.json`);
    return dictionary.default;
  } catch (error) {
    console.error(`Failed to load dictionary for locale: ${locale}`, error);
    // Fallback to English
    const fallback = await import(`@/locales/en.json`);
    return fallback.default;
  }
}

/**
 * Formats a financial value with specific currency rules.
 * I-008: Currency precision is invariant across locales.
 * I-012: Currency code determines precision, locale determines separators.
 */
export function formatFinancialValue(
  value: number,
  currency: string,
  locale: string
): string {
  // Use a map for common currency precisions, or default to 2
  const precisionMap: Record<string, number> = {
    'JPY': 0,
    'KRW': 0,
    'CLP': 0,
    'VND': 0,
    'USD': 2,
    'EUR': 2,
    'GBP': 2,
  };
  
  const currencyCode = currency.toUpperCase();
  const fractionDigits = precisionMap[currencyCode] ?? 2;

  try {
    return new Intl.NumberFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(value);
  } catch (error) {
    console.error('Formatting error:', error);
    // Fallback simple formatting with basic thousands separator
    const formattedNum = value.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US', {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
    return `${currencyCode} ${formattedNum}`;
  }
}
