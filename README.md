# CeCe Store

Premium Nepali clothing brand website.

## Product Catalog JSON

Products can now be managed in a separate JSON file:

- [catalog/products.json](catalog/products.json)

### How to update products

1. Edit the `products` array in [catalog/products.json](catalog/products.json)
2. Change `catalogVersion` to a new value (example: `2026-03-28-v2`)
3. Reload the website

The app will sync local storage from this catalog when the version changes.

## Product Schema

Each product now supports category and new-drop controls:

- `category`: `hoodies` or `tshirts`
- `isNew`: `true` or `false`

Example fields:

- `name`, `price`, `status`, `sizes`, `img`, `category`, `isNew`

## Centralized Settings

Brand, order handle, contact, theme mode, analytics, and social links are managed in [js/data.js](js/data.js).

Key object:

- `DEFAULT_SETTINGS`

## Analytics

In [js/data.js](js/data.js), set:

- `analytics.provider` to `ga4` or `plausible`
- `gaMeasurementId` for GA4, or `plausibleDomain` for Plausible
