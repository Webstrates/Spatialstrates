import React from 'react';
const { useEffect } = React;
import { Canvas, useThree } from '@react-three/fiber';
import { XR, createXRStore, IfInSessionMode, useXRInputSourceState } from '@react-three/xr';
import { Stats, Environment } from '@react-three/drei';
import { BackSide } from 'three';

import { DynamicComponents } from '#Spatialstrates .dynamic-components';
import { CustomCamera } from '#Spatialstrates .camera';
import { GlobalEventProvider } from '#Spatialstrates .global-events';





if (!window.moduleDeviceManager) {
    window.moduleDeviceManager = {};
}

function Scene() {
    // The Quest renders in lower resolution by default, this increases the resolution
    // https://discourse.threejs.org/t/webxr-quality-problems/24603/2
    const { gl } = useThree();
    useEffect(() => {
        gl?.xr.setFramebufferScaleFactor(2.0);
    }, [gl]);

    // Used for access to the camera in non-React components
    const { camera } = useThree();
    const xrCamera = useThree((s) => s.gl.xr.getCamera());
    const controllerRight = useXRInputSourceState('controller', 'right');
    const controllerLeft = useXRInputSourceState('controller', 'left');
    const handRight = useXRInputSourceState('hand', 'right');
    const handLeft = useXRInputSourceState('hand', 'left');
    useEffect(() => {
        window.moduleDeviceManager.camera = camera;
    }, [camera]);
    useEffect(() => {
        window.moduleDeviceManager.xrCamera = xrCamera;
    }, [xrCamera]);
    useEffect(() => {
        window.moduleDeviceManager.controllerRight = controllerRight;
    }, [controllerRight]);
    useEffect(() => {
        window.moduleDeviceManager.controllerLeft = controllerLeft;
    }, [controllerLeft]);
    useEffect(() => {
        window.moduleDeviceManager.handRight = handRight;
    }, [handRight]);
    useEffect(() => {
        window.moduleDeviceManager.handLeft = handLeft;
    }, [handLeft]);

    return <>
        <IfInSessionMode deny={['immersive-ar']}>
            <gridHelper />
            <color attach="background" args={[0xE5E4E2]} />
            <mesh scale={200}>
                <sphereGeometry />
                <meshStandardMaterial color="#E5E4E2" side={BackSide} transparent={true} opacity={0.4} />
            </mesh>
        </IfInSessionMode>

        <IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
            <CustomCamera />
            <Stats className="spatial-strates-stats" />
        </IfInSessionMode>

        <Environment preset="city" />
        <DynamicComponents selector=".dynamic-scene-component" />
    </>;
}

// https://github.com/pmndrs/xr/blob/1793fe3a4ecf07a30ea98ff2585811d3100d6b51/packages/xr/src/init.ts#L54
const store = createXRStore({
    frameRate: 'low',
    handTracking: true,
    hitTest: true,
    depthSensing: true,
    domOverlay: document.querySelector('#app-root')
});
window.xrStore = store;


export function App() {
    return <>
        <div className="crosshair"></div>
        <DynamicComponents selector=".dynamic-gui-component" />
        <Canvas dpr={2}
        gl={{ preserveDrawingBuffer: true, localClippingEnabled: true }}
        mode="concurrent">
            <XR store={store}>
                <GlobalEventProvider>
                    <Scene />
                </GlobalEventProvider>
            </XR>
        </Canvas>
    </>;
}
