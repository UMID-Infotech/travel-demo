# Verification report — complete rebuild, version 1.2.0

Completed 27 October 2026. Environment: Linux, Node 24.22.1, npm 11.9.0, Vite 7.1.3 and Chromium cloud preview. No publication/deployment.

## Automated checks

- `npm ci --no-audit --no-fund`: clean locked dependency installation completed in the fresh project folder.
- `npm test`: **31 tests passed**, zero failures.
- The matrix generates **560 itineraries**: four destinations × five typed lengths including each destination maximum × seven start weekdays × four party types. It asserts correct nights, separate travel calendar dates, no overlap, no repeated attraction, opening/season/closed-day compliance, young-family limits and exact ledger sums.
- Additional checks cover year/month/leap-day/host-timezone boundaries, four typed days = three nights for every destination, Manali overnight travel dates, arbitrary nonpreset lengths, Kerala base relocation, minimum feasibility, missing essential graph links, whole-party age suitability, adventure prep/recovery/pacing, fallback exclusivity, room/vehicle boundaries, child/infant pricing, included meal/transfer deductions, optional complete fares/fees, deterministic shared calculations, drafts/revisions/restore, invalid imports and quota failures.
- Blank input tests confirm that every public answer starts empty, zero children must be explicitly supplied, child ages cannot default, seeded legacy answers do not populate a new form, each chat question needs a valid answer, and incomplete edits return no stale cost.
- Changing typed days, hotel category or traveller/room count changes the computed total. Engine calculations are shared by customer form, review, final itinerary, guided chat and admin Test Planner.
- `npm run build`: passed; static production `dist/` included. Customer code and PDF code are separate chunks. No remote runtime image/font/API service or application backend is required.

## Browser observations

The rebuilt planner was opened with the new customer preference store. Destination/date/days/adults/child count/group/hotel/rooms/interests/activity method/transport/meals were visibly blank. No INR total appeared. After entering explicit Manali choices, hotel and meal choices were still required before an estimate appeared. Completing them produced a calculated INR 28,100 example estimate.

Continue navigated to the actual `/review` URL. The review retained the typed four days/three nights, two adults/zero children, chosen hotel/rooms, explicitly selected Open to suggestions, automatic activity selection, private transport and meal plan. Its Generate action navigated to `/itinerary`. The final itinerary showed the matching estimate, three hotel nights, Stay day 1–4 and separate overnight travel dates. Download PDF and editing controls were present. These are test values, not public defaults or a fixed quote.

The rebuilt form, top navigation, progress indicator, saved-progress estimate and full-screen shared chat were visually checked at a 390×844 CSS-pixel iframe viewport. Earlier checks on the retained admin implementation verified hotel-rate draft comparison, cancellation of unsaved navigation, apply and previous-revision restore. The rebuilt engine 1.2.0 admin root `/admin` was verified to resolve Dashboard with its quick-start instructions, and the top navigation exposes Demo Admin. Physical phones, mobile browser engines and accessibility certification are not claimed.

## PDF checks

Browser-side PDF code uses the frozen snapshot and embedded local DejaVu fonts. The included example result supplies a searchable multi-page A4 PDF with illustration/logo, selected preferences, dates/day labels, nights, transport, ledger/formulas, conditions and page numbers. PDF text extraction checks dates, labels and the exact snapshot total; all nine rendered pages were visually inspected for pagination and clipping.

A prior browser run reached “PDF prepared. Check your browser downloads.” The cloud download-event observer did not expose completed storage, so completed browser download delivery is not claimed as verified. A local generated sample PDF is included and independently checked. Browser file-picker import and raster-upload workflows were not exercised end to end; their format/validation/storage logic has code and automated configuration coverage.

## Operating boundaries

All journey times, access assumptions, rates and fictional hotels require verification before real travel. There is no weather, supplier availability, real authentication, multi-user admin, payment, booking or analytics service. Browser storage is per origin and may be cleared/lost. Read the admin/data guides for exact supported models. No live timetable accuracy, physical-device testing or accessibility certification is claimed.
