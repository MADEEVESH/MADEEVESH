# ServiceSite for Android

The Android app opens [stormbreaker.live/dashboard](https://stormbreaker.live/dashboard). Publishing the website updates the app. There is no iPhone build.

Inside the app, the Plan page shows the plan already on the account. Prices, subscribe, switch, and cancel controls are hidden, and Paddle checkout pages are blocked. Buying a plan stays on the website.

## Build on your computer

1. Install [Android Studio](https://developer.android.com/studio).
2. In this `servicesite` folder:

```bash
npm install
npx cap sync android
npm run assets
npx cap open android
```

3. In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle → release**.
4. Create a keystore the first time. Copy `android/keystore.properties.example` to `android/keystore.properties` and point it at that file. **Keep the keystore and both passwords.** Without them you cannot ship an update to people who already installed the app.
5. Upload `android/app/build/outputs/bundle/release/app-release.aab`.

`android/keystore.properties` and the keystore file are gitignored on purpose.

## Play Console

- App name: **ServiceSite**. Category: **Business**. Free.
- Store text is in `store/listing.md`.
- Privacy policy: https://stormbreaker.live/privacy
- Support and account deletion: WhatsApp +230 54834054
- Give reviewers a test login that already has a plan.
- Run a closed test with a few people, then production.

Phone screenshots have to be taken from a signed-in dashboard. This repo does not include a test account.

## Booking alerts

New-booking alerts need a Firebase project and are not wired up yet. When `android/app/google-services.json` exists, the Android project is ready for that next step.
