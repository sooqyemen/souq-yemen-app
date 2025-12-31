// rates doc example:
// { usdToYer: 1632, sarToYer: 425 }

export function convertPrice(price, baseCurrency, rates) {
  if (!price || !rates) return null;

  let yer = 0;
  if (baseCurrency === 'YER') {
    yer = price;
  } else if (baseCurrency === 'USD') {
    yer = price * rates.usdToYer;
  } else if (baseCurrency === 'SAR') {
    yer = price * rates.sarToYer;
  } else {
    return null;
  }

  const usd = yer / rates.usdToYer;
  const sar = yer / rates.sarToYer;

  const base = { code: baseCurrency, value: price };

  return {
    base,
    yer: { code: 'YER', value: yer },
    usd: { code: 'USD', value: usd },
    sar: { code: 'SAR', value: sar }
  };
}
