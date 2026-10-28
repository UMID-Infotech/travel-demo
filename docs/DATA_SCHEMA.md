# Data schema and calculation guide

Schema **2**, engine **1.2.0**. Source lives in `src/data/`. Each destination file declares meaningful visits, zones and ordered accommodation bases. `factory.js` expands that seed into explicit local graph, vehicle, hotel and transfer records; it is not a runtime routing API. Admin edits target the expanded records. `shared.js` owns brand, departure, rules, meals, optional fee and scenarios. Prices and operating values are fictional/illustrative, not sourced timetables or current quotations.

## Core records and units

| Record | Relationships and important fields |
| --- | --- |
| `destinations` | Stable ID, enabled/archived/order, name/description/image, `minStayDays` / `maxStayDays` bounding a free numeric stay-day input, categories/interests, `minStayMinutes` |
| `journeys` | Exactly one per enabled destination, gateway ID, fixed mode label, outbound/return minutes, included breaks flag/extra minutes, arrival/return buffers, `returnTime` HH:mm, optional complete two-leg fares per person |
| `bases` | Destination/zone, order, minimum nights, check-in/out HH:mm, luggage-drop assumption |
| `zones` | Destination and geographic label; zone membership alone never implies zero travel |
| `connections` | Destination, from/to IDs, road mode, minutes, km, symmetric flag, breaks-included/extra minutes, enabled. Directed unless explicitly symmetric |
| `activities` | Destination/base/zone, tags, preparation/visit/recovery minutes, preferred/open/close/lastStart HH:mm, closed weekdays 0 Sunday–6 Saturday, operating months 1–12, blackout ISO dates, intensity, ages, family suitability, person/group prices, child bands, condition/fallback IDs |
| `hotels` | Destination/base/category, nightly INR, exact-date override `{date, rate}`, room capacity, adult requirement, included breakfast and enabled/archive state |
| `vehicles` | Destination, seats including children, daily INR, included hours/km, per-hour/km overage, baseline fuel/driver/gateway/relocation inclusion |
| `transfers` | Destination, arrival/departure leg, seats per vehicle and flat INR per vehicle |
| `meals` | INR per breakfast/lunch/dinner, free/discount child age thresholds and multiplier, named plans selecting meal types |
| `rules` | Civil day/meal times, durations/rest/margins, maximum visits, young-child extra pace, interest/selection scores, travel penalty and bounded candidate limit |
| `fee` | Disabled initially; explicit name and percent of rounded pre-fee subtotal |
| `scenarios` | Editable source demo cases; used in admin, not customer analytics |

IDs are globally unique. Gateway IDs are unique route endpoints. References must stay within the same destination. Archive records rather than breaking IDs. Text is rendered through React, never executable HTML. Brand asset refs are allowlisted local SVGs or persisted raster data URLs. Unknown top-level import keys, unsafe executable content and incompatible versions are rejected.

## Time and hotel nights

All input times use Asia/Kolkata. Civil dates are mapped onto a numeric minute axis using UTC parsing/getters solely as arithmetic: they are **not UTC travel instants**. Host timezone and daylight savings cannot shift the trip's civil dates. Display labels say IST. `today()` uses Intl with Asia/Kolkata. Travel durations are minute offsets, not shorthand days.

Departure = start date + configured departure clock. Destination arrival = departure + outbound duration + extra breaks only when not already included. The customer enters destination stay days, including arrival and checkout: **4 days = 3 nights**. Return departure date = destination arrival date + (stay days - 1), at the configured return time. Home arrival = return departure + return duration. Total calendar dates = home-arrival date - initial departure date + 1. Overnight journeys add dates outside the stay. The UI labels stay dates “Stay day 1” onward, with separate outbound/homeward travel dates; it does not describe six travel-inclusive dates as a four-calendar-date trip.

The typed number must be an integer within destination min/max bounds. Default minimum is two days for single-base routes and four for Kerala; maximum is 30, editable up to the implementation cap of 60. Minima must satisfy base nights and minimum useful stay. There is no allowed-duration list or dropdown. Values such as 11, 13 or 23 are valid and produce 10, 12 or 22 hotel nights respectively; lack of unique suitable attractions creates leisure, not repeated visits.

Hotel nights are the dates from destination arrival date up to but excluding return departure date. These exclude coach nights. Initial base gets its minimum plus an even share of spare nights, then successive bases receive their shares in route order. For Kerala the sequence is Munnar (at least two nights) followed by Alleppey (at least one), with a single explicit relocation and Kochi gateway legs. A route that cannot accommodate these minima blocks generation.

Initial arrival reserves formalities/rest, gateway transfer, luggage drop/rest until check-in if early, then 30-minute check-in. It does not buy an early-check-in night. Relocations reserve 30-minute checkout before day start, travel, waiting until check-in and check-in. Final checkout happens no later than hotel deadline or gateway-leave time; scheduled sightseeing ends before checkout. Gateway reporting buffer is reserved before return departure. Meals overlapping transit/check-in are omitted and self-arranged.

## Scheduler

1. Validate configuration and preferences. Derive journeys, hotel nights and bases.
2. Reserve intercity travel, arrival rest, gateway movements, hotel events and relocations.
3. On each destination date, restrict to its actual base and useful local window.
4. Adventure-interest or explicitly selected heavy activities receive a bounded main-session attempt: outbound travel, preparation, main visit, recovery, a possibly delayed lunch, and return travel must all fit. Lunch can move after recovery within `lunchFlexMinutes` of the normal time. Recovery is at least the configured rest duration. No consecutive heavy dates when the pacing rule is on.
5. Reserve normal breakfast/lunch/dinner where they fit. Reserve post-lunch rest on non-heavy days. Normal sightseeing uses the remaining gaps, returning to base before each meal/rest deadline.
6. Filter disabled/archived, skipped, duplicate, wrong-base, closed/seasonal, blackout, age- or family-ineligible and intensity-ineligible candidates. Prioritise selected visits and matching tags, subtract travel penalty, tie-break by stable activity ID. The first main visit defines the date's zone; supporting visits must use that same zone and explicit stored links. No unbounded search.
7. Require outbound travel + preparation/opening wait + visit + recovery + return connection + safety margin to fit. Check last start and closing times. Never use an absent connection as zero.
8. Fill honestly with leisure when nothing fits. Explain every explicitly selected unscheduled visit, keep it uncharged, and show its configured alternative if available. Alternatives are suggestions to edit/regenerate, not separately booked/charged fallback scenarios. A fallback independently scheduled by normal rules is charged only once as its own actual visit.
9. Revalidate overlap/deadline invariants; calculate the ledger from actual scheduled blocks. Split cross-midnight journey blocks only for daily display.

Group pacing uses a reduced visit count and additional prep/recovery for any child below `youngChildAge`. Whole-party child ages are enforced; adult ages are not collected, so activities must accept the full illustrative adult age range of 18–90 to be scheduled. A narrower adult range remains unscheduled with an explanation. Adult-specific operator maximum-age/fitness clearance is **not established** by this demo and must be verified before actual travel. The planner does not split parties into parallel sessions. Weather/availability is never inferred.

## Pricing models

All totals are estimates in INR. Round each displayed ledger row to nearest rupee, then sum those rounded rows. Per-person average = total / (adults + all children, including infants), not a separate child fare. Taxes are excluded and not computed.

- **Hotels:** exact night's configured rate × requested rooms. Every base/category must have an enabled hotel. First matching hotel is used; this is fictional inventory, not supplier search. Included breakfast is deducted on the following date only if a breakfast event exists.
- **Private transport:** on dates with actual local/gateway/relocation travel, compare enabled vehicle options. Quantity = ceiling(group size / seats). Choose the least total cost for that date, tie-break by vehicle ID. Each vehicle's rate includes fuel/driver/gateway/relocation. Charge daily rate plus ceiling excess elapsed touring hours × hourly overage plus ceiling excess stored kilometres × km overage, multiplied by quantity. Touring hours span first travel departure to final travel arrival and include wait/visit time. Idle dates without any movement do not incur a private vehicle day.
- **Independent travel:** daily per-person local allowance on movement dates. Selected gateway legs are separate vehicles at capacity-based quantities. A required base relocation is a separate allowance of ceil(stored km × configured `relocationPerKmPerPerson`, initially INR 12) per traveller. The per-kilometre allowance is editable with independent transport pricing. Unselected gateway legs are self-arranged/excluded. Only one local transport model is charged.
- **Activities:** only scheduled visits. Group unit charges one adult/group price. Person unit charges every adult at adult price, each child free below `freeUnder`, at recorded child price below `childUnder`, otherwise adult price. Age suitability applies before charging.
- **Meals:** reserved events covered by the chosen plan. Adults plus child adult-equivalent portions × meal rate. Child portions are zero below free age, multiplier below discount age, otherwise one. Hotel-included breakfasts are zero-cost ledger rows. Travel-only meals are self-arranged.
- **Intercity:** excluded unless both outbound and return demo fare values exist and include-fares is enabled. Then all travellers use the same recorded fare per leg; the illustrative fare model has no infant discounts.
- **Agency fee:** optional named percentage of pre-fee rounded rows, shown separately. No hidden margin or universal GST rate.

## Deliberate baseline boundaries

Single fixed journey per destination, Asia/Kolkata only, road connections for local movement, one geographic zone per sightseeing date, base-anchored meals/rest, one heavy main session per day, optional rather than mandatory attractions, no paid early check-in, no live route/weather/operator/booking data. Advanced hotel meal bundles and driver cost exclusions are not exposed as unsupported controls. Luggage drop and private fuel/driver/gateway/relocation inclusion are required baseline assumptions. `optional` and activity `order` seed metadata do not change scoring; required visits are rejected by validation. Settings that cannot be disabled in this model are visibly disabled/read-only or validation-enforced.

## Persistence and snapshots

`rovea.configuration.v1` holds active, previous and saved draft in one localStorage value. `rovea.preferences.v3`, `rovea.result.v1` and `rovea.chat.v3` are separate. Parse failures fall back to defaults. Failed setItem does not replace the live configuration. Snapshots capture brand/artwork, preferences, timeline, night/hotel/rate records, complete scheduled activity records, conditions, vehicle/meal/transfer participation, ledger and versions. Export never resolves renamed/archived records from new active data. An older result is labelled and can be regenerated. Snapshot time/price data remains independent of later settings.

Form/chat share the same state and engine. Test Planner has independent test preferences but calls exactly that engine. Runtime calculations contain no AI or remote services.

## Upgrade compatibility

`migrateConfig` converts schema 1 / engine 1.0.0 configs to schema 2 / engine 1.2.0, preserving operational edits while replacing the old `durations` list with feasible numeric boundaries. `migratePreferences` converts old travel-inclusive days to destination stay days by subtracting outbound/return extra calendar-date offsets. It marks preferences with `durationMode: destination-stay` and asks the user to review. Snapshot preference version 1 remains historical; new snapshots use version 3. Old PDF/screen labels remain calendar-day labels; new ones use stay-day labels. Active configuration import/export and restoration use the new format.

## Customer input and screen contract

Public answers come only from `emptyPreferences` or previously saved v3 customer progress. All customer fields start as empty strings/arrays, including explicit child count; zero children is an answer, not a default. Child age fields appear blank. Admin-only `demoPreferences` and test scenarios never initialise the customer form. Day input is a number field and all choices validate before review. Interests require a choice or explicit Open to suggestions; activity selection requires explicit auto/custom choice; independent transport requires a gateway-arrangement choice. No sample total is returned for incomplete input.

The form navigates to `/review`, which repeats validation and provides per-field edit links. Only its Generate action stores a final snapshot and opens `/itinerary`. Chat reaches the same review route after nine validated questions. Current answers share one state; final snapshots carry input version 3, preference version 3, the frozen selected-option names (`selectionSummary`), full schedule and cost ledger. `/itinerary` and its PDF do not look up updated admin labels/rates. Plan another trip opens a fresh blank form while keeping the last generated snapshot stored.

Prior v1/v2 seeded customer answers are intentionally not auto-imported into the blank customer workflow. Legacy config migration remains supported, and old results remain renderable. Admin test fixtures are independently complete and include an explicit child count, activity-selection method and transfer choice.
