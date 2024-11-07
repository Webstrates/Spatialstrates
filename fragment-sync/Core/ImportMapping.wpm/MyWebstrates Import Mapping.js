if (webstrate.importMap) {
    const scriptElement = document.querySelector('#ImportMapping .import-map');
    webstrate.importMap.create();
    webstrate.importMap.content = JSON.parse(scriptElement.innerHTML)
}
