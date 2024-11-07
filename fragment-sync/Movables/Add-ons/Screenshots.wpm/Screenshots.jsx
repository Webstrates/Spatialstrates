import React from 'react';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { devicePositionWithOffset, deviceRotation } from '#Spatialstrates .transform-helpers';



const createFileName = () => {
    const date = new Date();
    return `screenshot_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
};

const dataURLToBlob = (dataURL) => {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i += 1) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
};

const uploadAsset = async (dataURL, fileName) => {
    const formData = new FormData();
    const blob = dataURLToBlob(dataURL);
    formData.append('file', blob, fileName);

    const request = new XMLHttpRequest();
    request.open('POST', window.location.pathname);
    request.send(formData);

    return new Promise((resolve, reject) => {
        request.addEventListener('load', (e) => {
            const asset = JSON.parse(request.responseText);
            resolve(asset);
        });
        request.addEventListener('error', (e) => {
            reject(new Error('Failed to upload screenshot'));
        });
    });
};

const captureScreenshot = async () => {
    const canvas = document.querySelector('body transient canvas[data-engine]');
    if (!canvas) {
        console.warn('Screenshot failed: No canvas found');
        return;
    }

    const dataURL = canvas.toDataURL('image/png');
    const asset = await uploadAsset(dataURL, createFileName() + '.png');

    const [x, y, z] = devicePositionWithOffset(window.moduleDeviceManager.camera, 0.5);
    const [rx, ry, rz] = deviceRotation(window.moduleDeviceManager.camera);

    const imageConcept = await VarvEngine.getConceptFromType('Image');
    imageConcept.create(null, {
        url: asset.fileName,
        position: [x, y, z],
        rotation: [rx, ry, rz]
    });
};


addSubMenu('movables', 100, false);
addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
addItemToSubMenu('movables', 'spacer2', <MenuSpacer />, 750);
addItemToSubMenu('movables', 'screenshot', <MenuButton onClick={captureScreenshot}>Capture Screenshot</MenuButton>, 800);
