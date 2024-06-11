const tokenServerURL= import.meta.env.VITE_TOKEN_SERVER_URL;

const startOnboardingSession = async function() {
    // Connect with your backend service and retreive the Session Token
    const response = await fetch(`${tokenServerURL}/start`);
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
    }
    
    return await response.json();
}

const finishOnboardingSession = async function(token) {
    // Connect with your backend service to finish the session
    const response = await fetch(`${tokenServerURL}/finish`, {
        method: "POST",
        body: JSON.stringify({token})
    });
    
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
    }
    
    return await response.json();
}

export {startOnboardingSession, finishOnboardingSession};
