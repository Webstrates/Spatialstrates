import React from 'react';
import { IfSessionModeSupported } from '@react-three/xr';
import { Varv, useProperty } from '#VarvReact';

import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';



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

function CheckIsCanvasView({ children }) {
    const [currentView] = useProperty('currentView');
    return currentView === '2D' ? children : null;
}

function CheckIsSceneView({ children }) {
    const [currentView] = useProperty('currentView');
    return currentView === '3D' ? children : null;
}

function DepthSensingToggle() {
    const [depthSensing, setDepthSensing] = useProperty('depthSensing');

    return <MenuButton onClick={() => setDepthSensing(!depthSensing)} toggled={depthSensing ? 'true' : null}>Depth Sensing ({depthSensing ? 'On' : 'Off'})</MenuButton>
}



addSubMenu('camera', 1000, true);
addItemToSubMenu('camera', 'move-camera', <Varv concept="SpaceManager">
    <CheckIsSceneView>
        <MenuButton className="mouse-lock" onClick={() => {
            if (!window.moduleCameraControls?.controlsRef?.current) return;
            if (!window.moduleCameraControls.controlsRef.current.isLocked) {
                window.moduleCameraControls.controlsRef.current.lock();
                document.querySelector('.mouse-lock')?.blur();
            } else {
                window.moduleCameraControls.controlsRef.current.unlock();
            }
        }}>Move Camera</MenuButton>
    </CheckIsSceneView>
</Varv>, 0);
addItemToSubMenu('camera', 'spacer1', <Varv concept="SpaceManager">
    <CheckIsSceneView>
        <IfSessionModeSupported mode="immersive-ar">
            <MenuSpacer />
        </IfSessionModeSupported>
    </CheckIsSceneView>
</Varv>, 50);
addItemToSubMenu('camera', 'toggle-depth-sensing', <Varv concept="SpaceManager">
    <CheckIsSceneView>
        <IfSessionModeSupported mode="immersive-ar">
            <DepthSensingToggle />
        </IfSessionModeSupported>
    </CheckIsSceneView>
</Varv>, 100);
addItemToSubMenu('camera', 'toggle-ar', <Varv concept="SpaceManager">
    <CheckIsSceneView>
        <IfSessionModeSupported mode="immersive-ar">
            <MenuButton onClick={toggleAR}>Toggle AR</MenuButton>
        </IfSessionModeSupported>
    </CheckIsSceneView>
</Varv>, 200);
addItemToSubMenu('camera', 'spacer2', <Varv concept="SpaceManager">
    <CheckIsSceneView>
        <IfSessionModeSupported mode="immersive-vr">
            <MenuSpacer />
        </IfSessionModeSupported>
    </CheckIsSceneView>
</Varv>, 250);
addItemToSubMenu('camera', 'toggle-vr', <Varv concept="SpaceManager">
    <CheckIsSceneView>
        <IfSessionModeSupported mode="immersive-vr">
            <MenuButton onClick={toggleVR}>Toggle VR</MenuButton>
        </IfSessionModeSupported>
    </CheckIsSceneView>
</Varv>, 300);
addItemToSubMenu('camera', 'title', <Varv concept="SpaceManager">
    <CheckIsCanvasView>
        <MenuTitle title="3D Controls Unavailable" />
    </CheckIsCanvasView>
</Varv>, 400);


addSubMenu('media-sharing', 500, false);
addItemToSubMenu('media-sharing', 'title', <MenuTitle title="Media Sharing" />, 0);
addItemToSubMenu('media-sharing', 'share-link', <MenuButton onClick={shareLink}>Send to Quest</MenuButton>, 1000);
