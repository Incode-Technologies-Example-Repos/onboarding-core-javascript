import { fakeBackendStart, fakeBackendFinish } from './fake_backend'

let incode;
let incodeSession;
let showTutorialsFlag=false;
const cameraContainer = document.getElementById("camera-container");

function showError(e=null) {
  const finishContainer = document.getElementById("finish-container");
  if (e?.message) {
    finishContainer.innerHTML = `<h1>Error: ${e.message}</h1>`;  
  } else {
    finishContainer.innerHTML = "<h1>There was an error</h1>";
    console.log(e);
  }
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
    showTutorial: showTutorialsFlag
  });
}

function captureIdBackSide(response) {
  incode.renderCamera("back", cameraContainer, {
    onSuccess: processId,
    onError: showError,
    token: incodeSession,
    numberOfTries: 3,
    showTutorial: showTutorialsFlag
  });
}

async function  processId() {
  const results = await incode.processId({
    token: incodeSession.token,
  });
  console.log("processId results", results);
  captureSelfie();
}

function captureSelfie() {
  incode.renderCamera("selfie", cameraContainer, {
    onSuccess: captureVideoSelfie, // change this for captureVideoSelfie if you want to enable it
    onError: showError,
    token: incodeSession,
    numberOfTries: 3,
    showTutorial: showTutorialsFlag
  });
}

function captureVideoSelfie(){
  incode.renderVideoSelfie( cameraContainer, {
      token: incodeSession,
      showTutorial: showTutorialsFlag,
      modules: ["front", "back", "selfie", "speech"], // you can add 'poa' and 'questions'
      speechToTextCheck: true, // this is the check for the speech
    },
    {
      onSuccess: finishOnboarding,
      onError: showVideoSelfieError,
      numberOfTries: 1, // Only works for text-to-speech
    }
  );
}

function showVideoSelfieError(errors=[]) {
  let error_string="<h1>There was some errors</h1>\n<ul>\n";
  for (let i=0; i<errors.length;i++){
    error_string +=`  <li>${errors[i]}</li>\n`
  }
  error_string+="</ul>"
  const finishContainer = document.getElementById("finish-container");
  finishContainer.innerHTML = error_string;
}

function finishOnboarding() {
  // Finishing the session works along with the configuration in the flow
  // webhooks and business rules are ran here.
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
      apiURL: apiURL
    });
    
    // Create the single session
    cameraContainer.innerHTML = "<h1>Creating session...</h1>";
    incodeSession = await fakeBackendStart();
    // Empty the container and start the flow
    cameraContainer.innerHTML = "";
    saveDeviceData();
  } catch (e) {
    showError(e);
  }
}

document.addEventListener("DOMContentLoaded", app);
