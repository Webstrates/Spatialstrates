const importMapFragment = Fragment.one('#ImportMapping .import-map');

// MyWebstrates
if (webstrate.importMap) {
    const importMap = JSON.parse(importMapFragment.raw);
    webstrate.importMap.content = importMap;
}

// Webstrates
const importMapScript = document.querySelector('#ImportMapping script[type="importmap"]');
if (importMapScript) {
    if (importMapScript.textContent !== importMapFragment.raw) {
        importMapScript.textContent = importMapFragment.raw;
    }
}
