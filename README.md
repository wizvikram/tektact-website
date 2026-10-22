# Tektact Painting Calculator & Quotation Studio

A responsive static web app for measuring painting surfaces and preparing Tektact-branded quotations. No dependencies, server, tracking, or database are required. All draft information is stored in the current browser only.

## Get started

Open `docs/index.html` in a modern browser. Enter measurement dimensions in feet and deductions in SFT. Click **Add to quotation**, check or edit the rates and scope, enter client details, then click **Print / Save PDF** and select the browser's **Save as PDF** option. Choose A4 paper. Export a JSON backup for storage or for transferring drafts to another device.

### Features
- Measurement rows: length × height/width × count − deduction; manually add as many rooms/surfaces as needed.
- Editable service specifications, SFT quantities and rates, live quote preview, print-ready A4.
- Discount in rupees or percentage; optional tax percentage (0 by default, because applicability varies).
- Indian number formatting and amount in words; integer-paise calculation with half-up rounding.
- Reference template with 7 items from the February 14, 2026 quotation totaling ₹3,77,784 (client name anonymized).
- Tektact logo extracted from the reference PDF; optional replacement with a smaller image.
- Automatic saving in browser storage, JSON export/import backup, no data transmitted anywhere.

**Important**: Reference sample prices are from February 2026 and are not verified current prices. Service material performance descriptions are reference wording, not warranties. Always confirm measurements, market prices, applicable GST and client terms before issuing a real quotation. No GST registration number is asserted because it was not supplied.

## Code & tests

- `core.js` pure calculation functions (also supports Node CommonJS)
- `app.js` UI, persistence, validation and PDF print workflow
- `styles.css` desktop/mobile and print styles
- `test.js` arithmetic regression tests

Run `node docs/test.js` from the repository root to verify calculations. Open the app locally, load reference sample and verify the sample quotation preview and PDF print.

## Deployment

This repository keeps the quotation app in `docs/`, leaving the root available for future Tektact website development. To publish on GitHub Pages: open **Settings → Pages → Build and deployment → Deploy from a branch**, choose **main** and **/docs**, then click **Save**. Once GitHub confirms the site is deployed, the expected URL is `https://wizvikram.github.io/tektact-website/`. GitHub Pages must be enabled by the repository owner; committing code alone does not automatically enable it.


### Excel quotation export (October 2026)
The quotation maker includes **Download Excel (.xlsx)**, with editable client data, service descriptions, quantities, rates, discount, tax, formula-driven totals and a separate measurements sheet. The registered office/contact block appears at the bottom of the quotation sheet. **Update amount in words manually when amounts change.** Excel export on the hosted website loads SheetJS from its official CDN and therefore needs an internet connection for that feature; the main calculator and PDF preview do not.
