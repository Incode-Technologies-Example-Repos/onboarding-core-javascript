import { fakeBackendStart, fakeBackendFinish } from "./fake_backend";
const consentId = import.meta.env.VITE_CONSENT_ID;

let incode;
let incodeSession;
let showTutorialsFlag = true;
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

function captureCombinedConsent() {
  incode.renderCombinedConsent(cameraContainer, {
    token: incodeSession,
    onSuccess: saveDeviceData,
    consentId: consentId, // id of a consent created in dashboard
  });
}

function saveDeviceData() {
  incode.sendGeolocation({ token: incodeSession.token });
  incode.sendFingerprint({ token: incodeSession.token });
  captureIdFrontSide();
}

function captureIdFrontSide() {
  incode.renderCamera("front", cameraContainer, {
    onSuccess: captureIdBackSide,
    onError: showError,
    token: incodeSession,
    numberOfTries: 3,
    showTutorial: showTutorialsFlag,
  });
}

function captureIdBackSide(response) {
  const { skipBackIdCapture } = response;
  if (skipBackIdCapture) {
    processId();
  } else {
    incode.renderCamera("back", cameraContainer, {
      onSuccess: processId,
      onError: showError,
      token: incodeSession,
      numberOfTries: 3,
      showTutorial: showTutorialsFlag,
    });
  }
}

async function processId() {
  const results = await incode.processId({
    token: incodeSession.token,
  });
  console.log("processId results", results);
  captureSelfie();
}

function captureSelfie() {
  incode.renderCamera("selfie", cameraContainer, {
    onSuccess: finishOnboarding,
    onError: showError,
    token: incodeSession,
    numberOfTries: 3,
    showTutorial: showTutorialsFlag,
  });
}

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
    captureCombinedConsent();
  } catch (e) {
    showError(e);
  }
}

document.addEventListener("DOMContentLoaded", app);
