export type NumberFormat =
  | 'number'
  | 'numberWithCommas'
  | 'percent'
  | 'currencyYen'
  | 'currencyINR'
  | 'currencyCNY'
  | 'currencyUSD'
  | 'currencyEUR'
  | 'currencyGBP';

const currency = (currency: string): Intl.NumberFormatOptions => ({
  style: 'currency',
  currency,
  currencyDisplay: 'symbol',
  minimumFractionDigits: 2,
});

// FIXME: locales
const numberFormatConfig: Record<NumberFormat, Intl.NumberFormatOptions> = {
  number: {},
  numberWithCommas: { style: 'decimal', useGrouping: true },
  percent: { style: 'percent', useGrouping: false },
  currencyINR: currency('INR'),
  currencyYen: currency('JPY'),
  currencyCNY: currency('CNY'),
  currencyUSD: currency('USD'),
  currencyEUR: currency('EUR'),
  currencyGBP: currency('GBP'),
};

const formatters = Object.fromEntries(
  Object.entries(numberFormatConfig).map(([type, opts]) => [
    type,
    new Intl.NumberFormat('en-US', opts),
  ])
) as Record<NumberFormat, Intl.NumberFormat>;

export function formatNumber(value: number, format: NumberFormat) {
  if (format === 'number') return value.toString();
  const formatter = formatters[format];
  return formatter.format(value);
}
