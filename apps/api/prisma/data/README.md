# Valuation samples

`valuation-samples.json` holds real listings read from portals and Facebook to calibrate the sector table of the
price estimator (`ValuationCity` / `ValuationSector`). Each entry follows `ValuationSample`
(`apps/api/src/services/valuation-calibration.ts`).

- Only data of the property: platform, public URL, capture date, type, operation, price, area, sector, year.
- No names, phones or profile links. Prices are asking prices, not closing prices.
- The calibration is a pure function over this file; the data migration is generated from it.
