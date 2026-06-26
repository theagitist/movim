# Local patches (Telaris instance)

Status: as of the **v0.34** upgrade (2026-06-22) there were no source patches. **One UX
patch is now active** (notification permission on launch, section 3 below). The two locale patches below were workarounds for genuine upstream bugs in
**v0.33.1**; both are **fixed in v0.34**, so they were dropped during the upgrade and are
NOT re-applied. They are kept here as history in case of a future regression or a
downgrade.

The only remaining local modifications to the upstream tree are the **DB/SSL config
changes** (managed PostgreSQL, verify-ca) to `config/database.php`, `phinx.php`, and
`src/Movim/Bootstrap.php`. Those are not source bug-workarounds and are documented in
`CLAUDE.md` (Database section), not here. They live as uncommitted working-tree edits; a
`git pull`/upgrade can conflict with them, so re-apply after upgrading (the backed-up
`dbssl.diff` from the v0.34 upgrade re-applies cleanly).

---

## 1. Daemon Locale null-language guard — RESOLVED in v0.34

- File: `src/Movim/Daemon/Linker/Locale.php`
- Method: `loadTranslations()`
- v0.33.1 change (no longer applied): add
  `$this->language = $this->language ?? I18nLocale::DEFAULT_LANGUAGE;` before loading
  translations.
- **v0.34 fix:** upstream now declares the property with a non-null default
  (`public ?string $language = I18nLocale::DEFAULT_LANGUAGE;`) and guards the
  browser-language branch, so `$this->language` can never reach `translate()` as null.

### Why it was needed (v0.33.1)
`SessionsWorker::getLanguage()` reads `Accept-Language` from the websocket handshake. When the
browser sends none (common: browsers often omit it on WS upgrades), `$this->language` stayed null.
The original code fell back to DEFAULT_LANGUAGE only for *loading* translations, but left
`$this->language` null. The strict-typed `Movim\i18n\Locale::translate(string $language, ...)` then
threw a TypeError when the Login widget's `socket_connected` toast ran, aborting the handler
before the daemon sent `registered` to the browser. Result: login hung (browser registered, never
authenticated, 5s linker-killer closed the XMPP stream).

## 2. Remove stray var_dump in i18n locale loader — RESOLVED in v0.34

- File: `src/Movim/i18n/Locale.php`
- Method: `loadPo()`
- v0.33.1 change (no longer applied): deleted `var_dump(LOCALES_PATH . $language . '.po');`
- **v0.34 fix:** the `var_dump` is gone upstream; `loadPo()` returns `null` cleanly when there
  is no cache and no `.po` file, with no debug output.

### Why it was needed (v0.33.1)
Movim shipped a debug `var_dump()` in `loadPo()`. It ran whenever a locale had no
pre-built `.po.cache`. For shipped locales (en, fr, es, pt) the cache exists so it never
fired; but for a locale Movim does not ship, e.g. `en_ca` (Canadian English, sent by
Safari/Chrome set to en-CA), there is no `.po` and no cache, so it fired on every request.
It printed `string(42) "/var/www/.../locales/en_ca.po"` into the `/system` JS response,
producing a SyntaxError that aborted the script, so `BASE_URI`/`SW_URI` were never defined,
the websocket never opened, and the login button stayed disabled. Only affected browsers
whose Accept-Language resolved to an unshipped locale (en-CA was the live trigger).

---

## 3. Notification permission prompt on launch — ACTIVE (2026-06-26)

- File: `app/Widgets/Notif/notif.js`
- Where: the `MovimWebsocket.attach(...)` callback at the bottom of the file.
- Change: after `Notif.current(...)`, prompt for notification permission on launch
  instead of only from the NotificationConfig (settings) widget:

  ```js
  if (window.Notification && Notification.permission === 'default') {
      setTimeout(Notif_ajaxHttpRequest, 2000);
  }
  ```

- Backup: `app/Widgets/Notif/notif.js.telaris-bak`.

### Why
Upstream only auto-offered the permission from the NotificationConfig widget
(`notificationconfig.js`), so users who never opened Notifications settings were
never prompted. This pops Movim's existing in-app dialog (`_notif_request.tpl` ->
`Notif.request()`) globally on connect.

It triggers Movim's **own dialog**, not the raw browser prompt, because iOS Safari
requires a user gesture to call `Notification.requestPermission()` (the dialog
button supplies it). `=== 'default'` avoids re-nagging users who denied.

This is a UX patch, NOT an upstream bug fix, so it survives upgrades only if
re-applied. Re-apply after any `git pull`/upgrade. Rationale + the planned
"assisted PWA install" follow-up are in the vault note
`Academia/Projects/Movim/Better notifications and assisted PWA install.md`.
