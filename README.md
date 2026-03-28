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
