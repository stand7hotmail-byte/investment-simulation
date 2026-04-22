import fs from 'fs';
import path from 'path';

const localesDir = path.join(process.cwd(), 'src/locales');
const languages = ['en', 'ja'];

function getKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getVariables(str: string): string[] {
  const matches = str.match(/{(\w+)}/g);
  return matches ? matches.sort() : [];
}

async function checkI18n() {
  const dictionaries: Record<string, any> = {};
  const allKeys: Record<string, string[]> = {};

  for (const lang of languages) {
    const filePath = path.join(localesDir, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.error(`Missing file: ${filePath}`);
      process.exit(1);
    }
    dictionaries[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    allKeys[lang] = getKeys(dictionaries[lang]).sort();
  }

  // Check key parity (I-007)
  const masterLang = 'en';
  const masterKeys = allKeys[masterLang];
  let hasError = false;

  for (const lang of languages) {
    if (lang === masterLang) continue;
    
    const currentKeys = allKeys[lang];
    
    const missingInCurrent = masterKeys.filter(k => !currentKeys.includes(k));
    const extraInCurrent = currentKeys.filter(k => !masterKeys.includes(k));

    if (missingInCurrent.length > 0) {
      console.error(`Locale '${lang}' is missing keys present in '${masterLang}':`, missingInCurrent);
      hasError = true;
    }
    if (extraInCurrent.length > 0) {
      console.error(`Locale '${lang}' has extra keys not present in '${masterLang}':`, extraInCurrent);
      hasError = true;
    }

    // Check variable synchronicity (I-011)
    for (const key of masterKeys) {
      if (currentKeys.includes(key)) {
        const masterVal = key.split('.').reduce((o, i) => o[i], dictionaries[masterLang]);
        const currentVal = key.split('.').reduce((o, i) => o[i], dictionaries[lang]);
        
        if (typeof masterVal === 'string' && typeof currentVal === 'string') {
          const masterVars = getVariables(masterVal);
          const currentVars = getVariables(currentVal);
          
          if (JSON.stringify(masterVars) !== JSON.stringify(currentVars)) {
            console.error(`Variable mismatch for key '${key}' in locale '${lang}':`);
            console.error(`  ${masterLang}: ${masterVars.join(', ')}`);
            console.error(`  ${lang}: ${currentVars.join(', ')}`);
            hasError = true;
          }
        }
      }
    }
  }

  if (hasError) {
    console.error('i18n check failed!');
    process.exit(1);
  } else {
    console.log('i18n check passed: All dictionaries are synchronized.');
  }
}

checkI18n();
