import React from 'react';
const { useEffect, useMemo } = React;
import { Canvas, useThree } from '@react-three/fiber';
import { XR, createXRStore, IfInSessionMode, useXRInputSourceState, noEvents, PointerEvents } from '@react-three/xr';
import { Stats, Environment } from '@react-three/drei';
import { Varv, useProperty } from '#VarvReact';

import { DynamicComponents } from '#Spatialstrates .dynamic-components';
import { CustomCamera } from '#Spatialstrates .scene-view .camera';
import { VirtualSceneEnvironment } from '#Spatialstrates .scene-view .basic-environment';
import { BoundaryPreview } from '#Spatialstrates .scene-view .boundary-preview';
import { ProjectionPlanePreview } from '#Spatialstrates .scene-view .projection-plane-preview';
import { SpaceMovables } from '#Spatialstrates .scene-movables';
import { Container } from '#Spatialstrates .container';



if (!window.moduleDeviceManager) {
    window.moduleDeviceManager = {};
}

function Scene({ movableSceneComponents }) {
    const [xrPlatform] = useProperty('xrPlatform');

    // The Quest renders in lower resolution by default, this increases the resolution
    // https://discourse.threejs.org/t/webxr-quality-problems/24603/2
    const { gl } = useThree();
    useEffect(() => {
        if (xrPlatform === 'Quest') {
            gl?.xr?.setFramebufferScaleFactor(1.5);
        }
    }, [gl, xrPlatform]);

    // Used for access to the camera in non-React components
    const { camera } = useThree();
    const controllerRight = useXRInputSourceState('controller', 'right');
    const controllerLeft = useXRInputSourceState('controller', 'left');
    const handRight = useXRInputSourceState('hand', 'right');
    const handLeft = useXRInputSourceState('hand', 'left');
    useEffect(() => {
        window.moduleDeviceManager.camera = camera;
    }, [camera]);
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
        {/* Basic Lighting */}
        <Environment preset="city" />

        {/* Grid, Color Background, and Space Title */}
        <IfInSessionMode deny={['immersive-ar']}>
            <VirtualSceneEnvironment />
        </IfInSessionMode>

        {/* Desktop Camera and Stats */}
        <IfInSessionMode deny={['immersive-ar', 'immersive-vr']}>
            <CustomCamera />
            <Stats className="spatialstrates-stats" />
        </IfInSessionMode>

        {/* Global Dynamic Componants */}
        <DynamicComponents selector=".dynamic-scene-component" />

        {/* Context of Current Space */}
        <Varv property="locationHash">
            <BoundaryPreview />
            <ProjectionPlanePreview />
            <SpaceMovables>
                {movableSceneComponents.map((Component, index) => (<Component key={index} />))}
                <Container movableSceneComponents={movableSceneComponents} />
            </SpaceMovables>
        </Varv>
    </>;
}

export function SceneView({ movableSceneComponents }) {
    const [depthSensing] = useProperty('depthSensing');
    const [xrPlatform] = useProperty('xrPlatform');

    // https://github.com/pmndrs/xr/blob/1793fe3a4ecf07a30ea98ff2585811d3100d6b51/packages/xr/src/init.ts#L54
    const store = useMemo(() => {
        return createXRStore({
            controller: {
                rayPointer: { minDistance: 0 }
            },
            hand: {
                rayPointer: xrPlatform === 'Vision Pro' ? false : { minDistance: 0 }
            },
            // transientPointer: false, // Disables eye tracking pointer from Apple Vision Pro
            // gaze: false,
            // screenInput: false,

            frameRate: 'low',
            // foveation: 0.5,

            anchors: true,
            handTracking: true,
            // layers: true,
            // meshDetection: true,
            planeDetection: true,
            depthSensing: depthSensing,
            hitTest: true,

            domOverlay: document.querySelector('#app-root'),
            // customSessionInit: {}
        });
    }, [depthSensing, xrPlatform]);

    useEffect(() => {
        window.xrStore = store;
    }, [store]);

    return <>
        <div className="crosshair"></div>
        <Canvas
            mode="concurrent"
            dpr={2}
            gl={{
                preserveDrawingBuffer: true,
                localClippingEnabled: true,
                powerPreference: 'default' // Fix Vision Pro: https://discourse.threejs.org/t/texture-is-causing-loss-of-context-in-ipados-ios-17-5-1-when-using-react-three-fiber/68643
            }}
            shadows
            style={{ touchAction: 'none' }}
            events={noEvents} // We use the PointerEvents component from @react-three/xr instead
        >
            <PointerEvents />
            <XR store={store}>
                <Scene movableSceneComponents={movableSceneComponents} />
            </XR>
        </Canvas>
    </>;
}
