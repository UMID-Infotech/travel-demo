# Rovea — Complete Local Travel Planner

Version 1.2.0. A complete React + Vite website and browser-based demo admin for UMID Infotech. All code, original local artwork, destination data, automated tests, guides, sample exports and a production build are supplied. No deployment was performed.

## Install and run

Requires **Node.js 22.12+** and npm. Extract the ZIP, open a terminal inside its `rovea` folder containing `package.json`, then:

```bash
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

```bash
npm test
npm run build
npm run preview
```

The preview command serves the production build, normally on port 4173. Use Vite's actual printed URL if a port is busy. Stop with Ctrl+C. The included `dist/` is the production build; do not open it with `file://`.

Node/npm are installation, development and build tools. **There is no Node/Express application backend**, database, paid AI model, API key or supplier service. Scheduling, costs, PDF generation and persistence run in the browser.

## Customer flow

1. `/plan-your-vacation`: blank form. No destination, date, days, travellers, child count/ages, group, hotel, rooms, interests, activity method, transport or meals are chosen in advance. Customers enter all required choices. Enter 0 children explicitly when applicable.
2. `/review`: a separate review page showing all selected preferences and the calculated estimate. Edit links return to the matching form section. Incomplete forms cannot generate an itinerary.
3. `/itinerary`: final schedule, selected preferences, actual hotel nights, transport/meal participation, conditions and itemised **Estimated Trip Cost**, with a working browser-side PDF action.

The guided chat asks the same questions through the same input components and shared state. Continue stays disabled until the current answer is valid. It opens the same review route before final generation. It is fixed-choice guidance, not AI or free-text chat.

Current answers persist after refresh; that is saved customer progress, not a preset. **Start a new blank plan** and chat Restart clear current answers with confirmation while preserving old itinerary snapshots. Old prefilled demo preferences from the earlier build are not imported into the new customer answer store.

## Duration and costs

Customers **type days in a number input**, not a dropdown. Four destination stay days means **three hotel nights**, including arrival and checkout dates. Overnight coach journeys add separate outbound/homeward calendar dates; they never deduct those hotel nights. Supplied Manali travel assumptions make a four-day/three-night stay span six dates door to door. All times are Asia/Kolkata.

Default feasible ranges are 2–30 stay days for Goa/Manali/Jaipur and 4–30 for Kerala's two-base route. Admin can change these safety bounds, up to the documented 60-day cap; they are not package choices. Longer stays use unique suitable attractions and leisure instead of repeating sights.

There is **no hardcoded customer quote or assumed day count**. Before inputs are complete, the site displays No estimate yet, without an INR total. Once choices are valid, the shared engine calculates the live estimate; review, final itinerary and PDF use the same schedule/pricing. Editing days, party, rooms, category, activities, transport or meals recalculates it. Clearing required values removes the matching total instead of retaining a stale quote.

Editable admin data necessarily supplies hotel/vehicle/meal/activity rates and operating times. Those are calculation inputs, not fixed customer totals. Configured departure origin/time/mode remain agency-controlled as specified in the original scope. All rates, hotels and schedules are demonstration assumptions requiring real-world verification.

## Admin — where to go and what to edit

Click **Demo Admin** in the top navigation, or append `/admin` to the running local site's URL. For the default dev port: `http://localhost:5173/admin`. No login/password is required or implied.

| Change | Module |
| --- | --- |
| Days allowed, destination content, bases | Destinations & Bases |
| Departure/time, journey hours, return rules | Journeys |
| Nearby travel connections and zones | Zones & Travel Times |
| Sightseeing, opening/season/age rules, activity rates | Activities |
| Hotel categories, room rates, occupancy, date overrides | Accommodation |
| Vehicle capacity/rates, overages and gateway legs | Vehicles & Transfers |
| Meal plans/rates, child bands and optional fee | Meals & Pricing |
| Daily pacing, rest, safety margins and scoring | Planning Rules |
| Applied vs draft itinerary/cost comparison | Test Planner |
| Backup, import, previous/default restoration | Data Backup |

Open a module → select a record → edit → **Save Draft → Validate → Preview Draft → Apply to This Browser**. Unsaved changes and saved drafts do not affect customer calculations until applied. The dashboard includes a quick-start guide. Admin seed scenarios are test fixtures; they never initialise the public form.

**Browser-only boundary:** admin changes apply only to this browser/origin. They do not write source files or update other visitors/devices. This demo is not secure, authenticated or multi-user administration. Clearing browser data/private browsing can lose state; export backups. Failed storage/apply operations preserve the last working configuration. Config JSON carries rates, rules and persistent uploaded raster assets, excluding customer answers/results by default.

## Handover guides

- `docs/ADMIN_GUIDE.md`: every admin module and edit/apply/backup workflow.
- `docs/DATA_SCHEMA.md`: schema, timing model, scheduling and cost formulas.
- `docs/HOW_ITINERARIES_ARE_CALCULATED.md`: concise English and Hinglish explanation.
- `docs/VERIFICATION.md`: actual checks and verification limits.
- `docs/ASSET_LICENSES.md`: original illustrations and bundled DejaVu font licences.
- `examples/`: valid configuration export, example result JSON and searchable sample PDF.

## Windows PowerShell

```powershell
cd "C:\Users\YourName\Downloads\rovea"
node --version
npm.cmd ci
npm.cmd run dev
```

Use `npm.cmd` if PowerShell blocks `npm.ps1`; no execution-policy change is required. Run inside the extracted folder containing `package.json`. `git install` does not install npm dependencies. For a busy port, use the URL Vite prints, or `npm.cmd run dev -- --port 5174`. Retry interrupted installation with `npm.cmd ci` after stopping running processes.

## Static hosting later

Upload `dist/` to a static host and configure unknown application routes to serve `index.html` with HTTP 200. Nginx example: `try_files $uri $uri/ /index.html;`. `/review`, `/itinerary` and nested admin routes need this SPA fallback. The baseline uses the origin root; subdirectory hosting requires coordinated Vite `base`, Router `basename` and asset-path changes. No publishing or hosting action is part of this delivery.

## Package validated admin data as new source defaults

Keep a source backup. Validate/export configuration, copy its `configuration` object into `src/data/packaged.json`, and replace `src/data/index.js` with:

```js
import packaged from './packaged.json';
export const defaults = structuredClone(packaged);
```

Alternatively edit the corresponding readable shared/destination source files. Run tests/build and review scenarios before distributing. Existing browser revisions continue to override packaged defaults until restored through Data Backup. The browser admin cannot write these source files itself.

## Operating limits

No live bookings, payments, availability, weather or real-world timetable validation. Taxes and intercity fares are excluded by default. Optional fares require complete configured values for both legs. Costs are estimates, not quotations or confirmations. A single stored road graph handles local movement. Illustrations are original local SVGs, not destination photographs or real hotel evidence. Detailed supported models are in DATA_SCHEMA.md.
