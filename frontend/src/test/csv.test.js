// =============================================================================
// SECTION: CSV Parser Tests
// Full coverage of parseActivitiesCsv — the activity bulk-import logic.
// =============================================================================

import { describe, it, expect } from 'vitest';
import { parseActivitiesCsv, REQUIRED_CSV_COLUMNS } from '../utils/csv';

const HEADER = 'category,subtype,quantity,unit,carbon_kg,notes,logged_date';

describe('parseActivitiesCsv', () => {
  it('returns an error for empty input', () => {
    expect(parseActivitiesCsv('').error).toMatch(/empty/i);
    expect(parseActivitiesCsv('   ').error).toMatch(/empty/i);
  });

  it('returns an error when required columns are missing', () => {
    const csv = 'category,subtype\ntransport,bus';
    const result = parseActivitiesCsv(csv);
    expect(result.error).toMatch(/missing columns/i);
    expect(result.error).toContain('quantity');
    expect(result.rows).toHaveLength(0);
  });

  it('parses a single valid row', () => {
    const csv = `${HEADER}\ntransport,bus,10,km,0.89,commute,2026-06-16`;
    const { rows, skipped, error } = parseActivitiesCsv(csv);
    expect(error).toBeNull();
    expect(skipped).toBe(0);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      category: 'transport',
      subtype: 'bus',
      quantity: 10,
      unit: 'km',
      carbon_kg: 0.89,
      notes: 'commute',
      logged_date: '2026-06-16',
    });
  });

  it('lowercases category and subtype', () => {
    const csv = `${HEADER}\nTRANSPORT,Bus,5,km,0.5,,`;
    const { rows } = parseActivitiesCsv(csv);
    expect(rows[0].category).toBe('transport');
    expect(rows[0].subtype).toBe('bus');
  });

  it('skips rows missing required fields and counts them', () => {
    const csv = [
      HEADER,
      'transport,bus,10,km,0.89,,',   // valid
      'diet,,2,serving,6.6,,',         // missing subtype → skipped
      ',beef,1,serving,6.6,,',         // missing category → skipped
      'energy,elec,3,kWh,0.7,,',       // valid
    ].join('\n');
    const { rows, skipped } = parseActivitiesCsv(csv);
    expect(rows).toHaveLength(2);
    expect(skipped).toBe(2);
  });

  it('defaults missing numeric values to 0', () => {
    const csv = `${HEADER}\ntransport,bus,abc,km,xyz,,`;
    const { rows } = parseActivitiesCsv(csv);
    expect(rows[0].quantity).toBe(0);
    expect(rows[0].carbon_kg).toBe(0);
  });

  it('defaults logged_date to today when absent', () => {
    const today = new Date().toISOString().split('T')[0];
    const csv = `${HEADER}\ntransport,bus,10,km,0.89,,`;
    const { rows } = parseActivitiesCsv(csv);
    expect(rows[0].logged_date).toBe(today);
  });

  it('ignores blank lines between rows', () => {
    const csv = `${HEADER}\ntransport,bus,10,km,0.89,,\n\n\nenergy,elec,3,kWh,0.7,,`;
    const { rows } = parseActivitiesCsv(csv);
    expect(rows).toHaveLength(2);
  });

  it('accepts headers in any order / casing', () => {
    const csv = 'Carbon_KG,UNIT,Quantity,Subtype,Category\n0.89,km,10,bus,transport';
    const { rows, error } = parseActivitiesCsv(csv);
    expect(error).toBeNull();
    expect(rows[0]).toMatchObject({ category: 'transport', carbon_kg: 0.89, quantity: 10 });
  });

  it('exposes the required column list', () => {
    expect(REQUIRED_CSV_COLUMNS).toEqual(
      expect.arrayContaining(['category', 'subtype', 'quantity', 'unit', 'carbon_kg'])
    );
  });
});
