// Payment gateway logo mapping — returns a public logo URL for known providers.
// Uses stable CDN logos (wikimedia/simpleicons). Falls back to null if unknown.
export type GatewayLogo = { url: string; bg?: string; alt: string };

const M: Record<string, GatewayLogo> = {
  zaincash: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Zain_logo.svg/512px-Zain_logo.svg.png', bg: '#ffffff', alt: 'Zain Cash' },
  zain_cash: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Zain_logo.svg/512px-Zain_logo.svg.png', bg: '#ffffff', alt: 'Zain Cash' },
  asiahawala: { url: 'https://play-lh.googleusercontent.com/hE1Zj5BJ8sVfrhOKmC0vxHhTJXWgHkQ2iN6WrqjBQXLZlS6JzGgvC1yWy3-2n5g=w480-h960', bg: '#0b3d2e', alt: 'Asia Hawala' },
  asia_hawala: { url: 'https://play-lh.googleusercontent.com/hE1Zj5BJ8sVfrhOKmC0vxHhTJXWgHkQ2iN6WrqjBQXLZlS6JzGgvC1yWy3-2n5g=w480-h960', bg: '#0b3d2e', alt: 'Asia Hawala' },
  qicard: { url: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Qi_Card_Logo.png/240px-Qi_Card_Logo.png', bg: '#ffffff', alt: 'Qi Card' },
  qi_card: { url: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Qi_Card_Logo.png/240px-Qi_Card_Logo.png', bg: '#ffffff', alt: 'Qi Card' },
  rafidain: { url: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1a/Qi_Card_Logo.png/240px-Qi_Card_Logo.png', bg: '#ffffff', alt: 'Rafidain / Qi Card' },
  binance: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Binance_logo.svg/512px-Binance_logo.svg.png', bg: '#000000', alt: 'Binance Pay' },
  binance_pay: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Binance_logo.svg/512px-Binance_logo.svg.png', bg: '#000000', alt: 'Binance Pay' },
  visa: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/512px-Visa_Inc._logo.svg.png', bg: '#ffffff', alt: 'Visa' },
  mastercard: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/512px-Mastercard-logo.svg.png', bg: '#ffffff', alt: 'Mastercard' },
  paypal: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/512px-PayPal.svg.png', bg: '#ffffff', alt: 'PayPal' },
  usdt: { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Tether_Logo.svg/512px-Tether_Logo.svg.png', bg: '#ffffff', alt: 'USDT' },
};

export function getGatewayLogo(key?: string | null, nameEn?: string | null): GatewayLogo | null {
  const norm = (s?: string | null) => (s || '').toLowerCase().replace(/[\s\-]/g, '_');
  const k = norm(key);
  const n = norm(nameEn);
  return M[k] || M[n] || null;
}
