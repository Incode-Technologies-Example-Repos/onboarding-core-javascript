import { fakeBackendStart, fakeBackendFinish } from './fake_backend'

let incode;
let incodeSession;
const container = document.getElementById("camera-container");
const permissionButton = document.getElementById("ask-permission");
const permissionScreen = document.getElementById("permission-screen");

function showError(e=null) {
  container.innerHTML = "<h1>There was an error</h1>";
  console.log(e.message)
}

function saveDeviceData() {
  incode.sendGeolocation({ token: incodeSession.token });
  incode.sendFingerprint({ token: incodeSession.token });
  captureIdFrontSide();
}

function captureIdFrontSide() {
  incode.renderCamera("front", container, {
    onSuccess: captureIdBackSide,
    onError: showError,
    token: incodeSession,
    numberOfTries: 3,
    showTutorial: true
  });
}

function captureIdBackSide(response) {
  incode.renderCamera("back", container, {
    onSuccess: processId,
    onError: showError,
    token: incodeSession,
    numberOfTries: 3,
    showTutorial: true
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
  incode.renderCamera("selfie", container, {
    onSuccess: finishOnboarding,
    onError: showError,
    token: incodeSession,
    numberOfTries: 3,
    showTutorial: true
  });
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
  .catch((error) => {
    showError(error);
  });  
}

async function runIncode() {
  try { 
    const apiURL = import.meta.env.VITE_API_URL;
    incode = window.OnBoarding.create({
      apiURL: apiURL
    });
    
    // Create the single session
    container.innerHTML = "<h1>Creating session...</h1>";
    try {
      incodeSession = await fakeBackendStart();
    } catch(e) {
      showError(e);
      return;
    }
    
    // Empty the container and start the flow
    container.innerHTML = "";
    saveDeviceData();
  } catch (e) {
    console.dir(e);
    container.innerHTML = "<h1>Something Went Wrong</h1>";
    throw e;
  }
}

async function askPermissions(callback){
  
  const  permissionError = () => {
    permissionScreen.innerHTML="One or more Permissions where denied, please reset your permissions from config > Site config"
  }
  
  const askCamera = (callback) => {
    navigator.getUserMedia (
      // Constraints
      {video: true},
      
      // Success Callback
      function(localMediaStream) {
        console.log('Camera permission accepted');
        callback();
      },
      
      // Error Callback
      function(cameraError) {
        console.log({cameraError});
        permissionError();
      }
    );
  }

  const askGeolocation = (callback) => {
    
    navigator.geolocation.getCurrentPosition(
      // Success Callback
      function (position) {
        console.log('Geolocation permission accepted');
        callback();
      },
      
      // Error CallBack
      function (geolocationError){
        console.log({geolocationError});
        permissionError();
      }
    );
  }
  
  askGeolocation( () => askCamera( () => {
    permissionScreen.remove();
    callback();
  }));
}

permissionButton.addEventListener("click", () => {
  askPermissions(() => runIncode());
});


