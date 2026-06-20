// =============================================================================
// SECTION: CSV Parsing Utility
// Pure, side-effect-free parsing + validation for the activity CSV bulk import.
// Extracted from LogActivityPage so the logic is unit-testable in isolation.
//
// Expected CSV format (header row required):
//   category,subtype,quantity,unit,carbon_kg,notes,logged_date
// =============================================================================

/** Required columns every CSV must contain. */
export const REQUIRED_CSV_COLUMNS = ['category', 'subtype', 'quantity', 'unit', 'carbon_kg'];

/**
 * Parse activity CSV text into structured rows.
 *
 * @param {string} text - raw CSV file contents
 * @returns {{
 *   rows: Array<object>,        // valid, normalised activity objects
 *   skipped: number,            // count of rows missing required fields
 *   error: string|null,         // fatal error (e.g. missing header columns)
 * }}
 */
export function parseActivitiesCsv(text) {
  if (!text || !text.trim()) {
    return { rows: [], skipped: 0, error: 'CSV file is empty.' };
  }

  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  const missingHeaders = REQUIRED_CSV_COLUMNS.filter((r) => !headers.includes(r));
  if (missingHeaders.length) {
    return { rows: [], skipped: 0, error: `CSV missing columns: ${missingHeaders.join(', ')}` };
  }

  const rows = [];
  let skipped = 0;
  const today = new Date().toISOString().split('T')[0];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // ignore blank lines
    const cols = lines[i].split(',').map((c) => c.trim());
    const raw = Object.fromEntries(headers.map((h, idx) => [h, cols[idx] ?? '']));

    if (!raw.category || !raw.subtype || !raw.quantity || !raw.unit) {
      skipped++;
      continue;
    }

    rows.push({
      category:    raw.category.toLowerCase(),
      subtype:     raw.subtype.toLowerCase(),
      quantity:    parseFloat(raw.quantity) || 0,
      unit:        raw.unit,
      carbon_kg:   parseFloat(raw.carbon_kg) || 0,
      notes:       raw.notes || '',
      logged_date: raw.logged_date || today,
    });
  }

  return { rows, skipped, error: null };
}
