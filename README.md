# CeCe Store

Premium Nepali clothing brand website.
Catalogue display with hidden admin panel.

---

## Project Structure

```
cece-store/
│
├── index.html              ← Main entry point (open this in browser)
│
├── css/
│   ├── base.css            ← Variables, reset, typography
│   ├── layout.css          ← Nav, hero, sections, footer
│   ├── components.css      ← Product cards, buttons, badges
│   └── animations.css      ← Keyframes, scroll reveal
│
├── js/
│   ├── data.js             ← All localStorage read/write (data layer)
│   ├── products.js         ← Renders public product grid
│   ├── animations.js       ← Scroll reveal, marquee
│   └── main.js             ← App entry point, boots everything
│
├── admin/
│   └── admin.js            ← All admin panel logic (login, CRUD, settings)
│
└── assets/
    └── images/             ← Put product images here
```

---

## How to Use

### Opening the site
Just open `index.html` in any browser. No server needed.

### Accessing Admin Panel
Triple-click the **CeCe** text in the footer.
Default password: `cece2024`
Change it inside the admin panel under Settings.

### Admin Features
- Add / edit / delete products
- Upload product photos
- Update Instagram and Facebook links
- Change admin password

---

## Deploying to GitHub Pages (Free Hosting)

1. Create account at github.com
2. Create new repository: `cece-store`
3. Upload all files (keep folder structure)
4. Go to Settings → Pages → select `main` branch → Save
5. Site goes live at: `yourusername.github.io/cece-store`

---

## Want to add a real backend later?

When ready, replace `js/data.js` with Firebase calls.
Everything else stays the same — only the data layer changes.

---

## Default Admin Password
`cece2024` — change this immediately after first login.
