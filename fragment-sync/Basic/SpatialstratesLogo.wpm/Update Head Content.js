let manifestLink = document.head.querySelector('link[rel="manifest"]');
if (!manifestLink) {
    manifestLink = document.createElement('link');
    manifestLink.setAttribute('rel', 'manifest');
    manifestLink.setAttribute('href', 'manifest.json');
    document.head.appendChild(manifestLink);
    WPMv2.stripProtection(manifestLink);
}

let iconLink = document.head.querySelector('link[rel="icon"]');
if (!iconLink) {
    iconLink = document.createElement('link');
    iconLink.setAttribute('rel', 'icon');
    document.head.appendChild(iconLink);
    WPMv2.stripProtection(iconLink);
}

// Always update the icon so that it shows in Chromium-based browsers
iconLink.setAttribute('href', 'favicon.ico');
