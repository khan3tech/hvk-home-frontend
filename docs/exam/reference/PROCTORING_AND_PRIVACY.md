# Proctoring and Privacy

## Release-one policy

Camera permission is mandatory. The browser performs local face-count monitoring. The platform stores event metadata, not camera video or images. Monitoring warnings are capped at five per attempt, do not automatically submit or fail an attempt, and the candidate must manually submit.

The current browser implementation loads BlazeFace and the minimal TensorFlow.js core/converter/backend packages only after camera readiness, keeping model processing client-side and reducing the initial application bundle. It samples every three seconds and ignores detections below a 0.65 confidence threshold when the model provides a confidence value; model outputs without a confidence value remain usable for compatibility.

## Camera flow

1. Show a plain-language notice explaining camera use, purpose, event logging, retention, and alternative support process.
2. Request camera permission from an HTTPS origin.
3. Do not start the attempt until permission and camera readiness succeed.
4. Monitor track health and face count at a defined sampling interval.
5. Show a visible warning with current warning count.
6. Allow the candidate to continue; administrators can review the recorded events.

Browsers may refuse, suppress, or delay permission prompts. The application must provide retry instructions; it cannot force repeated prompts.

## Limitations

Face detection cannot establish identity, detect all cheating, or prove intent. It can generate false positives due to lighting, camera quality, occlusion, multiple people, or model uncertainty. The system must retain enough event context for authorized review and avoid automatic claims that a candidate cheated.

## Browser monitoring

Use Page Visibility events, focus signals, and optionally fullscreen as deterrence and audit signals. These APIs do not prevent another device, operating-system activity, or all forms of tab switching. Monitoring events must not be treated as definitive evidence without policy and review.

The frontend sends a `TAB_HIDDEN` event when the document becomes hidden and a `FULLSCREEN_EXIT` event when fullscreen is exited. Both events are recorded and display a warning, but do not automatically submit or fail an attempt; these are integrity signals, not proof of cheating. While an attempt is active, the browser also receives a leave-confirmation handler for refresh/close. Browser APIs cannot guarantee prevention of tab switching, operating-system switching, or another device.

## Privacy safeguards

- Data minimization: store event type, timestamp, attempt ID, and technical context needed for review.
- No continuous recording in release one.
- Restrict monitoring access to authorized administrators.
- Encrypt transport and protect stored data with platform controls.
- Define retention and deletion schedules before production.
- Offer an accessibility/support route for camera inability.
- Obtain legal review for Indian privacy obligations, notices, consent, children, retention, and cross-border processing.

Relevant sources: [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [MDN Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), [MDN Fullscreen](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide), [MDN BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel), [India PIB DPDP Rules announcement](https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2190655&lang=2&reg=48).
