# Research Sources

| Source | Finding | Decision informed |
|---|---|---|
| [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) | Visibility changes can be observed when a tab is hidden or window minimized; this is a signal, not proof of cheating. | Monitoring is advisory and logged. |
| [MDN Fullscreen API guide](https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API/Guide) | Fullscreen can be exited and switching applications/tabs can exit fullscreen. | Fullscreen is deterrence only. |
| [MDN BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel) | Same-origin documents can coordinate through a named channel. | Useful for tab coordination, not a security boundary. |
| [MDN getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) | Camera access requires permission and secure context; errors and hardware failures are possible. | Camera readiness and retry flow. |
| [TensorFlow.js models](https://www.tensorflow.org/js/models) | Browser-oriented face and landmark models are available. | Local face-count detection is a candidate implementation. |
| [TensorFlow.js face detection](https://github.com/tensorflow/tfjs-models/tree/master/face-detection) | MediaPipe face detection can return multiple detected faces and keypoints. | Multiple-face event design. |
| [BlazeFace model package](https://github.com/tensorflow/tfjs-models/tree/master/blazeface) | Browser-oriented face detection model used by the current frontend baseline. | Local face-count monitoring implementation. |
| [TensorFlow.js license](https://github.com/tensorflow/tfjs/blob/master/LICENSE) | TensorFlow.js repository is Apache 2.0 licensed. | Licensing review remains required for selected model/assets. |
| [Government of India PIB DPDP Rules announcement](https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2190655&lang=2&reg=48) | DPDP Rules 2025 were announced as notified on 14 November 2025. | Privacy/legal review and notice design. |

These sources support technical recommendations, not legal advice. Browser compatibility, model performance, and applicable legal obligations must be revalidated before production.
