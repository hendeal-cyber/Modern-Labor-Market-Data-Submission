# On-device checklist

The automated suites run headless Chromium with simulated phones. These checks need real phones and a real Wi-Fi network. They come from the phone-controller review. Run them before calling a build party-ready, and note the date, the phone models and the OS versions next to each result.

1. **Start-up.** Run `npm install && npm start`, then open http://localhost:3000 on the host. The lobby QR must show `https://<lan-ip>:3443/controller`.
2. **iPhone / Safari join.**
   - Scan the QR.
   - On the certificate warning, tap **Show Details**, then **visit this website**, then **Visit Website**.
   - Type a name and tap **Let's go**.
   - Allow the motion prompt.
   - Settings must show whether the connection is `wss` or `sse`.
3. **iPhone tilt past 60 degrees.** Calibrate, then roll hard right past 60 degrees mid-race. The kart must keep turning right. Repeat with Portrait Orientation Lock on and off.
4. **Android / Chrome join.**
   - Scan the QR.
   - On the certificate warning, tap **Advanced**, then **Proceed**, then **Let's go**.
   - Check fullscreen, the landscape lock and tilt steering.
   - Check that the phone vibrates on the countdown and on each lap.
5. **Android app switch.**
   - Switch to another app mid-race, then come back.
   - Tap the pad. Fullscreen, landscape and gas must all return.
   - An edge-swipe must not leave the controller.
6. **iPhone haptics.** Tap **ITEM** and feel the haptic. A lap cue must show a colour flash.
7. **Screen lock mid-race (both platforms).** Lock the screen for 20 s mid-race, then unlock. Within about 3 s the phone must be back in the same slot and colour, with gas working.
8. **Stuck-touch check.**
   - Hold **GAS**, roll your thumb into **DRIFT** and back.
   - Add a second finger on the stick, then lift all fingers. No input may stay stuck.
   - Repeat after pulling down Notification Center (Android) or Control Center (iPhone).
9. **Lobby lock with drinks.** In the lobby, add drinks for one phone, then lock it for 2 minutes. It must return with the same slot and the same drink count.
10. **Full cup soak.** Run a full 4-race cup with 4 phones, without touching them between races.
    - Screens must stay on.
    - Latency should mostly be under 40 ms.
    - No kart may move on its own.
