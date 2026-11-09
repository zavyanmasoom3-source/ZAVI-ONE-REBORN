# 12-image owner reference — initial real-code implementation

Branch: dev, 2026-11-09. Scope: ZAVI ONE and ZAVI ONE ADMIN.

* New final light/dark visual tokens and dedicated ONE/ADMIN presentation layers.
* ONE: dashboard, mobile navigation, forms including actual 3-step order UI, accounting cards, modal and print CSS.
* ADMIN: dark navy responsive sidebar, blue active menu, collapsible extra pages, compact KPI cards, real tables, settings and dialogs.
* All new files are loaded after legacy CSS from both real app entrypoints and precached in service workers under new cache keys.
* No accounting records, server permissions, subscription statuses or financial functionality deleted. Old CSS remains because live forms depend on it; final layer replaces its appearance.

**Not certified as 100% screenshot parity.** Still requires same-size screenshots of all actual routes in light/dark, Android, tablet, desktop, Dari/Pashto/English and real workflow tests. No release APK built.
