import api from './api';

/* ── Types ── */

export interface ImportProductRow {
  name: string;
  category?: string;
  subcategory?: string;
  brand?: string;
  type?: string;
  shelfLifeAmbient?: number;
  shelfLifeRefrigerated?: number;
  shelfLifeFrozen?: number;
  ingredients?: string;
  allergens?: string;
}

export interface AiAnalyzedItem {
  originalName: string;
  correctedName: string;
  nameWasCorrected: boolean;
  suggestedCategory: { existingId: string } | { newName: string };
  suggestedSubcategory:
    | null
    | { existingId: string }
    | { newName: string };
  shelfLifeAmbient: number | null;
  shelfLifeRefrigerated: number | null;
  shelfLifeFrozen: number | null;
  type: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExistingCategory {
  id: string;
  name: string;
  parentId?: string;
}

export interface ImportBatchItem {
  name: string;
  type?: string;
  brand?: string;
  shelfLifeAmbient?: number;
  shelfLifeRefrigerated?: number;
  shelfLifeFrozen?: number;
  ingredients?: string;
  allergens?: string;
  categoryId?: string;
  newCategoryName?: string;
  newSubcategoryName?: string;
  parentCategoryId?: string;
}

export interface ImportBatchResult {
  batchId: string;
  productsCreated: number;
  categoriesCreated: number;
}

export interface RollbackResult {
  deletedProducts: number;
  deletedCategories: number;
}

/* ── API calls ── */

export async function analyzeProducts(
  products: ImportProductRow[],
  existingCategories?: ExistingCategory[],
): Promise<AiAnalyzedItem[]> {
  const { data } = await api.post('/ai/analyze-import', {
    products,
    existingCategories,
  });
  return data;
}

export async function importBatch(
  items: ImportBatchItem[],
  operationId?: string,
): Promise<ImportBatchResult> {
  const { data } = await api.post('/products/import-batch', {
    items,
    operationId,
  });
  return data;
}

export async function rollbackBatch(
  batchId: string,
): Promise<RollbackResult> {
  const { data } = await api.delete(`/products/import-batch/${batchId}`);
  return data;
}
