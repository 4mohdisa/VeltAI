// Barcode lookup — Open Food Facts (mocked for now). This path is DELIBERATELY
// separate from the Gemini food-photo scan: a barcode is a database lookup, not
// an AI call, so it has its own handler and incurs NO AI cost.
export type BarcodeProduct = {
  name: string;
  brand?: string;
  kcalPer100: number;
  proteinPer100: number;
  carbsPer100: number;
  fatPer100: number;
  /** Per 100 g. null when Open Food Facts had no fibre figure for this product. */
  fibrePer100?: number | null;
  servingOptions: number[];
};

// Mock "Open Food Facts" database keyed by barcode.
const MOCK_DB: Record<string, BarcodeProduct> = {
  '9300605000000': {
    name: 'Greek Yoghurt, Plain',
    brand: 'Chobani',
    kcalPer100: 59,
    proteinPer100: 10,
    carbsPer100: 4,
    fatPer100: 0,
    servingOptions: [100, 150, 170, 200],
  },
};

const DEFAULT_CODE = '9300605000000';

/** Look up a scanned barcode against Open Food Facts (mock). Returns null when
 *  the product isn't found — the caller falls back to a label photo (AI path). */
export async function lookupBarcode(code: string): Promise<BarcodeProduct | null> {
  return MOCK_DB[code] ?? null;
}

/** The product the mock scanner "detects" — used by the confirm screen demo. */
export const exampleBarcodeProduct: BarcodeProduct = MOCK_DB[DEFAULT_CODE];
