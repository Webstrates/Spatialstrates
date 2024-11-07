import React from 'react';
import {
    addSubMenu,
    addItemToSubMenu,
    MenuTitle,
    MenuSpacer,
    MenuButton
} from '#Menu .default';



const toggleAR = async () => {
    if (!navigator?.xr) {
        alert('WebXR is not supported by your browser.');
        return;
    }

    const sessionMode = 'immersive-ar';
    if (!await navigator.xr.isSessionSupported(sessionMode)) {
        alert('AR sessions are not supported by your browser.');
        return;
    }

    if (!window.xrStore) {
        console.warn('No xrStore found');
        return;
    }
    if (!window.xrStore.getState().session) {
        window.xrStore?.enterAR();
    } else {
        await window.xrStore.getState().session.end();
        window.xrStore.setState({ session: null });
    }
};

const toggleVR = async () => {
    if (!navigator?.xr) {
        alert('WebXR is not supported by your browser.');
        return;
    }

    const sessionMode = 'immersive-vr';
    if (!await navigator.xr.isSessionSupported(sessionMode)) {
        alert('VR sessions are not supported by your browser.');
        return;
    }

    if (!window.xrStore) {
        console.warn('No xrStore found');
        return;
    }
    if (!window.xrStore.getState().session) {
        window.xrStore?.enterVR();
    } else {
        await window.xrStore.getState().session.end();
        window.xrStore.setState({ session: null });
    }
};

const shareLink = () => {
    let sendToQuestUrl = new URL('https://oculus.com/open_url/');
    sendToQuestUrl.searchParams.set('url', location.protocol + '//' + location.host + location.pathname);
    window.open(sendToQuestUrl, '_blank');
};



addSubMenu('camera', 1000, true);
addItemToSubMenu('camera', 'move-camera', <MenuButton className="mouse-lock" onClick={() => {
    if (!window.moduleCameraControls?.controlsRef?.current) return;
    if (!window.moduleCameraControls.controlsRef.current.isLocked) {
        window.moduleCameraControls.controlsRef.current.lock();
    } else {
        window.moduleCameraControls.controlsRef.current.unlock();
    }
}}>Move Camera</MenuButton>, 0);
addItemToSubMenu('camera', 'spacer1', <MenuSpacer />, 1);
addItemToSubMenu('camera', 'toggle-ar', <MenuButton onClick={toggleAR}>Toggle AR</MenuButton>, 2);
addItemToSubMenu('camera', 'toggle-vr', <MenuButton onClick={toggleVR}>Toggle VR</MenuButton>, 3);


addSubMenu('media-sharing', 500, false);
addItemToSubMenu('media-sharing', 'title', <MenuTitle title="Media Sharing" />, 0);
addItemToSubMenu('media-sharing', 'share-link', <MenuButton onClick={shareLink}>Send to Quest</MenuButton>, 1000);
