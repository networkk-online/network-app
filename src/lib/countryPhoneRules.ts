// Country phone rules: national number length (digits after country code, excluding leading 0 trunk prefix where applicable)
// `nationalLength` = total digits the user types locally (including leading 0 trunk for countries that use it)
// `e164Length` = digits after the + country code (no leading 0)
export interface CountryPhoneRule {
  code: string;        // ISO code
  name: string;        // English name
  nameAr: string;      // Arabic name
  dial: string;        // dial code without + (e.g. "964")
  nationalLength: number | number[]; // length when typed locally (e.g. Iraq: 11 -> 07xxxxxxxxx)
  trunkPrefix?: string; // local trunk prefix to strip (e.g. "0")
  example: string;
}

export const COUNTRY_PHONE_RULES: CountryPhoneRule[] = [
  { code: 'IQ', name: 'Iraq',          nameAr: 'العراق',         dial: '964', nationalLength: 11, trunkPrefix: '0', example: '07xxxxxxxxx' },
  { code: 'SA', name: 'Saudi Arabia',  nameAr: 'السعودية',       dial: '966', nationalLength: 10, trunkPrefix: '0', example: '05xxxxxxxx' },
  { code: 'AE', name: 'UAE',           nameAr: 'الإمارات',       dial: '971', nationalLength: 10, trunkPrefix: '0', example: '05xxxxxxxx' },
  { code: 'EG', name: 'Egypt',         nameAr: 'مصر',            dial: '20',  nationalLength: 11, trunkPrefix: '0', example: '01xxxxxxxxx' },
  { code: 'JO', name: 'Jordan',        nameAr: 'الأردن',         dial: '962', nationalLength: 10, trunkPrefix: '0', example: '07xxxxxxxx' },
  { code: 'KW', name: 'Kuwait',        nameAr: 'الكويت',         dial: '965', nationalLength: 8,                    example: '5xxxxxxx' },
  { code: 'QA', name: 'Qatar',         nameAr: 'قطر',            dial: '974', nationalLength: 8,                    example: '3xxxxxxx' },
  { code: 'BH', name: 'Bahrain',       nameAr: 'البحرين',        dial: '973', nationalLength: 8,                    example: '3xxxxxxx' },
  { code: 'OM', name: 'Oman',          nameAr: 'عُمان',          dial: '968', nationalLength: 8,                    example: '9xxxxxxx' },
  { code: 'LB', name: 'Lebanon',       nameAr: 'لبنان',          dial: '961', nationalLength: [7, 8], trunkPrefix: '0', example: '7xxxxxxx' },
  { code: 'SY', name: 'Syria',         nameAr: 'سوريا',          dial: '963', nationalLength: 10, trunkPrefix: '0', example: '09xxxxxxxx' },
  { code: 'TR', name: 'Turkey',        nameAr: 'تركيا',          dial: '90',  nationalLength: 11, trunkPrefix: '0', example: '05xxxxxxxxx' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', dial: '1', nationalLength: 10,                   example: '5551234567' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'بريطانيا',      dial: '44',  nationalLength: [10, 11], trunkPrefix: '0', example: '07xxxxxxxxx' },
  { code: 'DE', name: 'Germany',       nameAr: 'ألمانيا',        dial: '49',  nationalLength: [10, 11, 12], trunkPrefix: '0', example: '015xxxxxxxxx' },
  { code: 'FR', name: 'France',        nameAr: 'فرنسا',          dial: '33',  nationalLength: 10, trunkPrefix: '0', example: '06xxxxxxxx' },
];

export const DEFAULT_COUNTRY_CODE = 'IQ';

export const getCountryRule = (code: string) =>
  COUNTRY_PHONE_RULES.find((c) => c.code === code) ?? COUNTRY_PHONE_RULES[0];

// Convert localized Arabic digits to ASCII
export const normalizeDigits = (input: string) =>
  input.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

export const onlyDigits = (input: string) => normalizeDigits(input).replace(/\D/g, '');

export const validateNationalNumber = (rule: CountryPhoneRule, raw: string) => {
  const digits = onlyDigits(raw);
  const lens = Array.isArray(rule.nationalLength) ? rule.nationalLength : [rule.nationalLength];
  return lens.includes(digits.length);
};

export const toE164 = (rule: CountryPhoneRule, raw: string) => {
  let digits = onlyDigits(raw);
  if (rule.trunkPrefix && digits.startsWith(rule.trunkPrefix)) {
    digits = digits.slice(rule.trunkPrefix.length);
  }
  return `+${rule.dial}${digits}`;
};
