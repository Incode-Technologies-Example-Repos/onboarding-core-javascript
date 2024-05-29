const tokenServerURL= import.meta.env.VITE_TOKEN_SERVER_URL;

export async function startOnboardingSession() {
    const urlParams = new URLSearchParams(window.location.search);
    const uniqueId = urlParams.get('uniqueId');

    // Connect with your backend service and retreive the Session Token
    let sessionStartUrl = `${tokenServerURL}/start`
    if (uniqueId) sessionStartUrl +=`?uniqueId=${uniqueId}`;

    const response = await fetch(sessionStartUrl);
    if (!response.ok) {
        const sessionData = await response.json();
        throw new Error(sessionData.error);
    }

    return await response.json();
}