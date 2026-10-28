# Admin testing guide

Click **Demo Admin** in the top navigation or open `/admin` on the running local site. The visible Local Demo Admin banner is an operating boundary, not an access control.

## Workspace map

| Module | Working controls |
| --- | --- |
| Dashboard | Counts of configured records, draft issue list, links to editors/test planner |
| Brand & Content | Brand/copy/theme, bundled logo/art choices, validated persistent raster uploads |
| Destinations & Bases | Enabled state, numeric minimum/maximum stay days, descriptions, interests/categories, route order, minimum nights, check-in/out |
| Journeys | Departure origin/time, fixed route mode, outbound/return minutes, included/extra breaks, buffers, return time, optional fares; immediate sample dates |
| Zones & Travel Times | Zones, endpoints, minutes/km, symmetry, break treatment and enabled connections |
| Activities | Search/filter, full timing/season/age/price/condition/fallback editor, customer-card preview |
| Accommodation | Fictional hotels, rates/date overrides, occupancy, adult supervision, included breakfast |
| Vehicles & Transfers | Seats, daily rates, allowances/overages, transfer capacity and independent allowance |
| Meals & Pricing | Meal plans, individual rates, child bands, optional named percentage fee |
| Planning Rules | Day and meal times, rest/pace buffers, young-child threshold, max visits, scores and bounded candidate count |
| Test Planner | Applied/saved draft source, seed scenarios, editable preferences, generation, baseline delta table, diagnostics, PDF/JSON |
| Data Backup | Versioned active/draft export, staged validated import, backup, confirmed apply and restores |

## Duration: days are entered by the customer

The day field is a number input in the form, guided chat and Test Planner. 4 days means 3 hotel nights. Overnight coach travel adds separate dates and never reduces those three nights. The input accepts any whole number within destination limits, not predefined durations.

Go to **Destinations & Bases**, select the destination and edit **Minimum stay days** / **Maximum stay days**. The minimum must fit its required base nights and useful stay; Kerala starts at four days because its route needs three nights. After changing limits, Save Draft → Validate → Preview Draft → Apply.

## Suggested client demonstration

1. In Test Planner, load **Coastal couple** and run applied data. Inspect nights, activities, vehicle assignments and the ledger.
2. In Accommodation, choose the Panaji comfort hotel, raise its nightly rate by INR 500 and Save Draft. Do not apply yet.
3. Preview Draft, load Coastal couple and run. Accommodation increases by INR 500 × rooms × hotel nights. Other components remain the same for unchanged preferences.
4. Return to the editor, Validate, and Apply to This Browser. Open the customer form; its estimate now uses the new data. Existing generated snapshots keep their old total.
5. Data Backup → Export Applied Configuration. Revert Previous Revision to restore the prior working values. Restore Supplied Defaults resets to the packaged data with confirmation.

## Destination and graph editing

Create/duplicate generates a fresh stable ID. New enabled-capable records start disabled. You can edit the ID's references through selects, but not rename the ID itself. Archive a referenced destination/activity/hotel/vehicle instead of deleting it; unarchive and enable separately when ready. Journey, base and zone records are structural and have no delete button. Disable connections/transfers instead of deleting them.

Order controls apply to destinations and base route order. Changing a base's order changes hotel allocation and relocation. Activity ties use stable ID; activity `order` is informational only in this version. Connection lists show up to 200 search matches; refine by destination or endpoints for a larger graph.

To add a new destination, create it disabled and add its journey, zones, bases, hotels in every category, enabled vehicle, activities, transfers and connections. The baseline local model is road travel. Essential connections are gateway → first base, each ordered base relocation, last base → gateway, and each activity's base link. If a candidate activity-to-activity connection is absent, that combination is skipped; essential missing data blocks validation/generation. No missing edge becomes zero minutes. Validate before enabling/applying.

New activity records need base/zone references and an explicit base travel connection. A duplicate starts disabled to avoid accidental duplicate attractions. Setting two records to the same real-world attraction would still create two logical activities; keep one canonical record per attraction.

## Drafts and navigation

Editor values live in memory until saved. Browser refresh/closing the tab and anchor navigation warn on unsaved changes. Browser Back/Forward and internal route changes also prompt before discarding unsaved edits. Saved draft data persists separately from active data. Preview validates and saves current editor data before opening the test page.

Validation reports field paths and cross-record errors. Invalid imports/applications leave the last applied revision intact. Quota errors explain how to recover. Drafts can contain incomplete records for later work; application requires a valid complete configuration. Successful apply increments revision and stores the previous active revision in the same localStorage write.

## Import and assets

Export excludes customer preferences and generated results. Test results have their own explicit export. Import accepts a full configuration or the app's export envelope, checks format/size/version/IDs/references/ranges, and stages it without applying. Review record counts/brand, download the offered backup, then confirm replacement. It does not merge records.

Raster uploads accept PNG/JPEG/WebP only, ≤500 KB and ≤6000 pixels per side, with MIME/magic-byte/decode checks. Their data URLs are part of the saved/exported configuration. User SVG/HTML uploads and external image URLs are rejected. Supplied SVG paths are explicitly allowlisted. Configuration imports have a 4 MB cap; browser storage quotas can be lower, especially when storing active + previous + draft. Keep uploads small. `data:` bytes are retained in old snapshots so their artwork is not looked up from changed records.

## Test scenarios

Coastal couple, solo Jaipur, young Manali family, eight friends, mountain adventure, shortest feasible Manali trip and Kerala base relocation are supplied. The test planner runs the same engine as the customer site. Baseline uses active data with identical test preferences. If active preferences are no longer valid, baseline comparison is unavailable rather than invented. Results can be exported as JSON and customer-style PDF. Changing test controls requires Run Test again; the visible result is a snapshot of the last run.

## Public form versus admin fixtures

The public form begins blank and has no assumed price or customer answers. Test Planner alone uses labelled complete demo scenarios for quick client testing. A customer must explicitly enter child count (0 if none), child ages, activity-selection method and meals as well as the other fields. The public flow is `/plan-your-vacation` → `/review` → `/itinerary`; chat enters the same review page. Both final screen and PDF show the chosen hotel/rooms, party, transport, meal plan, interests, requested/skipped activities, the feasible daily plan and calculated cost.

The admin edits rate tables and rules rather than entering a fixed customer quote. Hotel rate changes affect the accommodation component; traveller/room/transport/activity/meal changes affect matching components only. Incomplete customer inputs produce no current estimate. Customer progress remains separate from configuration exports, and no customer contact information is collected.
