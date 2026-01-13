import React from 'react';
import { createRoot } from 'react-dom/client';



// Automatically reload this view if certain other fragments change
const WATCHED_FRAGMENTS = [
    '#Spatialstrates [data-type="text/javascript+babel"]'
];



async function render() {
    if (!window.cachedAppRoot) {
        const element = document.createElement('transient');
        element.id = 'app-root';
        document.body.appendChild(element);
        window.cachedAppRoot = createRoot(element);
    }

    const content = await Fragment.one("#Spatialstrates .spatialstrates").require();
    window.cachedAppRoot.render(React.createElement(content.App));
};

let reloadTimer;
const reload = () => {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(render, 1000);
};

WATCHED_FRAGMENTS.forEach(frag => {
    const lookedUpFragments = Fragment.find(frag);
    lookedUpFragments.forEach((lookedUpFragment) => {
        lookedUpFragment.registerOnFragmentChangedHandler(() => {
            reload();
        });
    });
});

if (VarvEngine) {
    VarvEngine.registerEventCallback('engineReloaded', () => {
        reload();
    });
}

window.reloadApp = () => {
    reload();
};
