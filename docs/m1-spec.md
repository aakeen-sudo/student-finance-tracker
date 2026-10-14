# M1: Spec and wireframes

**Theme:** Student Finance Tracker

## Data model

Each record has an id, description, amount, currency, category, date, createdAt and updatedAt.

```js
{
  id: "rec_0001",
  description: "Lunch at cafeteria",
  amount: 12.5,
  currency: "USD",
  category: "Food",
  date: "2026-10-13",
  createdAt: "2026-10-13T12:30:00.000Z",
  updatedAt: "2026-10-13T12:30:00.000Z"
}
```

Settings (saved separately): base currency, two other currencies with manual rates, spending cap, category list.

## Pages

About, Dashboard, Records, Add, Settings. Only one is shown at a time, chosen from the nav bar.

## Wireframes (text sketches)

Phone (about 360px):

```
+------------------------+
| Student Finance Tracker|
| [About][Dash][Rec]...  |
+------------------------+
| Records                |
| Search: [___________]  |
| Sort:   [Date v]       |
| +--------------------+ |
| | Date      2026-10-13|
| | Description  Lunch  |
| | Category     Food   |
| | Amount     12.50 USD|
| |        [Edit][Del]  |
| +--------------------+ |
+------------------------+
```

Desktop (1024px and wider):

```
+----------------------------------------------------+
| Student Finance Tracker   About Dashboard Records..|
+----------------------------------------------------+
| Records                                            |
| Search [______________] Sort [Date v] [x] ignore   |
| Date       | Description | Category | Amount |Actions|
| 2026-10-13 | Lunch ...   | Food     | 12.50  |Edit.. |
+----------------------------------------------------+
```

Add your own hand-drawn sketch photo to `assets/` and mention it here.

## Accessibility plan

- Landmarks: header, nav, main, section, footer; one h1, then h2/h3 in order.
- Skip link first in the page; labels bound to every input.
- Visible focus ring; everything works with the keyboard only.
- Errors next to fields (`aria-invalid`, `aria-live`); status messages in `role="status"`; cap overage in `role="alert"`.
- Colours chosen for WCAG AA contrast; animation off for "reduce motion".
- Breakpoints: 360px (base), 768px, 1024px (plus a small tweak at 480px).

## Regex plan

Description spacing, amount, date, category, plus two advanced rules (repeated word with a back-reference, letter-required with a lookahead), a currency code check and a rate check with a negative lookahead.
