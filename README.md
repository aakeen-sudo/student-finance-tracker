# Student Finance Tracker
A small web app to log spending, search it with regex and see simple stats. Made with plain HTML, CSS and JavaScript for the Building Responsive UI assignment.

- Theme: Student Finance Tracker
- Live site: https://aakeen-sudo.github.io/student-finance-tracker/
- Demo video: 
- Author: aakeen-sudo, a.akeen@alustudent.com

## Features

- Pages: About, Dashboard, Records, Add, Settings
- Records show as cards on phones and a table on bigger screens
- Add form with regex checks while you type
- Edit a row in place, delete with a confirm box
- Sort by date, description or amount
- Live regex search with a case toggle and highlighted matches
- Dashboard with total records, total spent, top category and a 7 day chart
- Spending cap with live messages for what is left or how much you are over
- Base currency plus 2 others with rates typed in Settings
- Saves to localStorage
- Import and export JSON with checks
- Sample data button that loads seed.json

## Run it

Open the GitHub Pages link. To run it on your computer, use the Live Server extension in VS Code, because the app uses ES modules and will not work from a double click.

## Run the tests

Open tests.html in the browser. Every check shows PASS or FAIL and the top line gives the totals.

## Data model

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

## Regex catalog

| Use | Pattern | Passes | Fails |
|-----|---------|--------|-------|
| No edge spaces | `/^\S(?:.*\S)?$/` | `Lunch` | ` Lunch` |
| No double spaces | `/\s{2,}/` | `Lunch at` | `Lunch  at` |
| Amount | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | `12.50` | `007` |
| Date | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | `2026-10-13` | `2026-13-01` |
| Category | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | `Eating-out` | `Food2` |
| Repeated word (back-reference) | `/\b(\w+)\s+\1\b/i` | `Coffee tea` | `the the` |
| Needs a letter (lookahead) | `/^(?=.*\p{L}).+$/u` | `Bus 42` | `12345` |
| Currency code | `/^[A-Z]{3}$/` | `USD` | `usd` |
| Rate (negative lookahead) | `/^(?!0+(?:\.0+)?$)(?:0\|[1-9]\d*)(?:\.\d{1,4})?$/` | `0.92` | `0` |

Search examples on the Records page: `\.(?!00\b)\d{2}\b` for real cents, `coffee|tea` for drinks and `\b(\w+)\s+\1\b` for repeated words.

## Keyboard map

| Key | Action |
|-----|--------|
| Tab and Shift Tab | Move between controls |
| Enter | Open a link, press a button or submit a form |
| Enter while editing a row | Save |
| Escape while editing a row | Cancel |
| Escape in the confirm box | Cancel |
| Arrow keys on the sort menu | Change the sort |

## Accessibility notes

- Landmarks: header, nav, main, section, footer
- Skip link and labels on every input
- Visible focus on everything
- Errors appear next to the field and are announced
- A polite status message and an assertive alert message
- The cap uses polite messages under the cap and assertive ones over it
- Matches use the mark tag
- The 7 day chart is a list with a number on every row
- Contrast checked with the WCAG formula, the lowest text ratio is 6.42 to 1
- Animations turn off for reduced motion

## Responsive design

Mobile first with Flexbox. Breakpoints at 480px, 768px and 1024px.

## Files

```
index.html
tests.html
seed.json
styles/main.css
scripts/main.js, state.js, storage.js, validators.js, search.js, stats.js, ui.js
docs/m1-spec.md
assets/
```
