import { fakeBackendStart, fakeBackendFinish } from "./fake_backend";
const consentId = import.meta.env.VITE_CONSENT_ID;

// Simple configuration flag for V2 components
const forceV2 = false; // Control whether to force V2 experience for components

let incode;
let incodeSession;
const cameraContainer = document.getElementById("camera-container");

function showError(e = null) {
  const finishContainer = document.getElementById("finish-container");
  if (e?.message) {
    finishContainer.innerHTML = `<h1>Error: ${e.message}</h1>`;
  } else {
    finishContainer.innerHTML = "<h1>There was an error</h1>";
    console.log(e);
  }
}
// 1.- Check if mandatory consent is required and show it if it is.
function checkMandatoryConsent() {
  incode.sendFingerprint({ token: incodeSession.token }).then((response) => {
    // Send fingerprint returns a response with the following structure:
    //   {
    //     "success": true,
    //     "sessionStatus": "Alive",
    //     "ipCountry": "UNITED STATES",
    //     "ipState": "ILLINOIS",
    //     "showMandatoryConsent": true,
    //     "regulationType": "US_Illinois"
    // }
    // If the response has showMandatoryConsent and is set to true, we need to show the mandatory consent
    if (response?.showMandatoryConsent) {
      incode.renderBiometricConsent(cameraContainer, {
        token: incodeSession,
        onSuccess: captureCombinedConsent,
        onCancel: () => showError("Mandatory consent was denied"),
        regulationType: response.regulationType,
      });
    } else {
      captureCombinedConsent();
    }
  });
}

// 2.- Show the combined consent
//    This consent is created in the dashboard and has to be passed as a parameter
//    to the renderCombinedConsent function.
function captureCombinedConsent() {
  incode.renderCombinedConsent(cameraContainer, {
    token: incodeSession,
    onSuccess: sendGeolocation,
    consentId: consentId, // id of a consent created in dashboard
  });
}

// 3.- Send geolocation and start the ID capture flow
function sendGeolocation() {
  incode.sendGeolocation({ token: incodeSession.token });
  captureId();
}

// 4.- Capture the ID
function captureId() {
  incode.renderCaptureId(cameraContainer, {
    session: incodeSession, 
    onSuccess: processId,
    onError: showError,
    forceIdV2: forceV2 // Use the global V2 flag
  });
}

// 5.- Process the ID
async function processId() {
  const results = await incode.processId({
    token: incodeSession.token,
  });
  console.log("processId results", results);
  captureSelfie();
}

// 6.- Capture the selfie
function captureSelfie() {
  incode.renderCaptureFace(cameraContainer, {
    session: incodeSession,
    onSuccess: finishOnboarding,
    onError: showError,
    forceV2: forceV2 // Use the global V2 flag
  });
}

// 7.- Finish the onboarding
function finishOnboarding() {
  fakeBackendFinish(incodeSession.token)
    .then((response) => {
      console.log(response);
      const container = document.getElementById("finish-container");
      container.innerHTML = "<h1>Onboarding Finished.</h1>";
    })
    .catch((e) => {
      showError(e);
    });
}

async function app() {
  try {
    const apiURL = import.meta.env.VITE_API_URL;
    incode = window.OnBoarding.create({
      apiURL: apiURL,
    });

    // Create the single session
    cameraContainer.innerHTML = "<h1>Creating session...</h1>";
    incodeSession = await fakeBackendStart();
    // Empty the container and start the flow
    cameraContainer.innerHTML = "";

    // Start the onboarding flow with mandatory consent
   checkMandatoryConsent();
  } catch (e) {
    showError(e);
  }
}

document.addEventListener("DOMContentLoaded", app);
