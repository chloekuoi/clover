# App Store submission checklist
> App name: Clover
> Bundle ID: com.chloeguo.clover
> Last updated: 2026-06-16

Legend: 🤖 Claude can verify directly from code/config · 🧑 Requires you (App Store Connect, hosted docs, creative copy/screenshots) · 🤝 Claude verifies a precondition, you take the final action

---

## Phased review process

1. **Phase 1 — Codebase & config audit (Claude, done this pass)** — walk every 🤖 item, confirm against actual code/config, report pass/fail with file references.
2. **Phase 2 — Fix code-level gaps (Claude, done this pass)** — patch anything fixable in the repo itself (e.g. missing usage-description strings). Anything else found gets flagged here for your call before editing.
3. **Phase 3 — External/account-side work (You, Claude can draft)** — privacy policy text, App Store Connect listing copy, screenshots, age rating, demo account. Claude drafts where useful; you finalize and enter into App Store Connect.
4. **Phase 4 — Final build & submission (You; Claude verifies preconditions)** — typecheck clean, version/build bump, archive/upload, submit for review.

---

## 1. App information
- [ ] 🧑 App name (max 30 chars)
- [ ] 🧑 Subtitle (max 30 chars)
- [x] 🤖 Bundle ID matches provisioning profile — `com.chloeguo.clover` set in [app.json](../app.json:17)
- [ ] 🧑 SKU set
- [ ] 🧑 Primary language set
- [ ] 🧑 Category and subcategory selected
- [ ] 🧑 Content rights confirmed (you own or have rights to all content)

## 2. Metadata & app store listing
- [ ] 🧑 App description written (up to 4,000 chars)
- [ ] 🧑 Promotional text written (up to 170 chars)
- [ ] 🧑 Keywords entered (max 100 chars, comma-separated)
- [ ] 🧑 Support URL live and working — not yet configured anywhere in repo
- [ ] 🧑 Marketing URL set (optional but recommended)
- [ ] 🧑 Privacy policy URL live and working — not yet configured anywhere in repo
- [ ] 🧑 Copyright field filled in

## 3. Screenshots & preview
- [ ] 🧑 iPhone 6.9" screenshots (up to 10, required)
- [ ] 🧑 iPhone 6.5" screenshots (up to 10)
- [ ] 🧑 iPad Pro 13" screenshots (if supporting iPad) — app does support iPad (`supportsTablet: true`)
- [ ] 🧑 App preview video (optional, 15–30s, .mov or .mp4)
- [ ] 🤝 Screenshots show real app UI (no placeholder or mock content) — Claude can review once captured

## 4. App icon
- [x] 🤖 1024x1024px PNG, no transparency, no rounded corners applied — confirmed at [assets/clover-icon-1024.png](../assets/clover-icon-1024.png) (1024x1024 RGB)
- [ ] 🤝 No text that duplicates the app name — visual judgment call, review the icon
- [ ] 🤝 Matches the icon inside the app binary — `app.json` icon field points to `./assets/icon.png`; confirm this is the same artwork as `clover-icon-1024.png` before submitting

## 5. Build & technical
- [ ] 🧑 Build uploaded via Xcode or Transporter
- [ ] 🤝 Build passes automated App Store validation (no missing entitlements, no banned APIs)
- [ ] 🤖 Minimum iOS version set appropriately — not currently set in [app.json](../app.json); Expo SDK 54 default applies, confirm desired floor
- [x] 🤖 Supported device families confirmed — iPhone + iPad (`supportsTablet: true`), no Mac Catalyst
- [x] 🤖 No placeholder or test content in the build — no lorem ipsum/test accounts found in screens
- [x] 🤖 No references to other platforms (e.g., Android, beta, coming soon) — only an internal code comment in [EditProfileScreen.tsx](../src/screens/profile/EditProfileScreen.tsx) (not user-facing), no Android/beta copy found in UI strings
- [ ] 🤝 All third-party SDKs documented in privacy manifest — auto-generated [PrivacyInfo.xcprivacy](../ios/coworkconnect/PrivacyInfo.xcprivacy) exists, confirm it's current after next prebuild
- [ ] 🧑 App builds and runs without crashes on a physical device

## 6. Privacy & permissions
- [ ] 🧑 Privacy Nutrition Labels completed in App Store Connect
- [x] 🤖 NSUsageDescription strings added for every permission requested — location ✅, photo library was missing and has been added to [app.json](../app.json:23) this pass; no camera/push/tracking code exists
- [x] 🤖 Permission requests only triggered contextually — location requested in DiscoverScreen flow, photo library requested on button tap in EditProfileScreen/IdentityScreen, neither on cold launch
- [ ] 🧑 App functions in a limited/degraded state if user denies permissions — needs manual verification (deny each permission and confirm app doesn't crash)
- [x] 🤖 App Tracking Transparency (ATT) prompt implemented if tracking users — N/A, no tracking/ad SDKs in codebase

## 7. Payments & monetisation
- [x] 🤖 N/A — no IAP, Stripe, or RevenueCat code found anywhere in the app; entire section not applicable
- [x] 🤖 No external payment links or call-outs to web checkout — confirmed, no payment code exists
- [x] 🤖 Subscription terms clearly shown before purchase — N/A
- [x] 🤖 Restore purchases button present (if applicable) — N/A

## 8. Sign in with Apple
- [x] 🤖 Sign in with Apple implemented — confirmed in [AuthContext.tsx:90-127](../src/context/AuthContext.tsx)
- [x] 🤖 Sign in with Apple capability added — `usesAppleSignIn: true` in [app.json:19](../app.json)
- [ ] 🧑 Associated Domains entitlement configured if using email hiding — only needed if you want to support Apple's private relay email; confirm whether that's required for your Supabase auth flow

## 9. Account & data deletion
- [x] 🤖 In-app account deletion flow implemented — confirmed in [AuthContext.tsx:129-144](../src/context/AuthContext.tsx), calls `supabase.rpc('delete_account')`
- [x] 🤖 Deletion removes user data — RPC cascade-deletes user rows; photo files removed via `deleteAllUserPhotoFiles()` before the RPC call

## 10. Review notes & demo account
- [ ] 🧑 Review notes written (explain any non-obvious features, special flows, or region locks)
- [ ] 🧑 Demo account credentials provided if app requires login — app requires login, reviewer will need test credentials
- [ ] 🧑 Test mode or sandbox environment noted if needed for reviewer

## 11. Legal & content
- [ ] 🧑 Age rating questionnaire completed honestly
- [ ] 🧑 No misleading claims in screenshots, description, or metadata
- [ ] 🧑 No keyword stuffing or competitor names in keywords/description
- [ ] 🧑 EULA linked (if using custom EULA beyond Apple's standard) — no custom EULA found in repo; Apple's standard EULA applies by default unless you want one

## 12. Final submission
- [x] 🤖 Version number and build number set correctly — `1.0.0` / build `1` in [app.json](../app.json:5)
- [ ] 🧑 "What's new" release notes written (for updates)
- [ ] 🧑 Phased release preference set
- [ ] 🧑 Submission sent for review
