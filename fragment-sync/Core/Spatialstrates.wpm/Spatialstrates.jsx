import React from 'react';
const { useMemo, useEffect, useRef } = React;
import { Varv, useProperty } from '#VarvReact';

import { DynamicComponents, useDynamicModules } from '#Spatialstrates .dynamic-components';
import { GlobalEventProvider } from '#Spatialstrates .global-events';
import { SceneView } from '#Spatialstrates .scene-view';
import { CanvasView } from '#Spatialstrates .canvas-view';



function SpaceView() {
    const [currentView] = useProperty('currentView');
    const [currentSpace, setCurrentSpace] = useProperty('locationHash');
    const [, setXRPlatform] = useProperty('xrPlatform');

    // Detect XR platform type
    const initXRPlatformTimeout = useRef(null);
    useEffect(() => {
        if (initXRPlatformTimeout.current) {
            clearTimeout(initXRPlatformTimeout.current);
            initXRPlatformTimeout.current = null;
        }

        if (typeof setXRPlatform === 'function') {
            initXRPlatformTimeout.current = setTimeout(async () => {
                const supportsImmersiveAR = navigator.xr && await navigator.xr.isSessionSupported('immersive-ar');
                const supportsImmersiveVR = navigator.xr && await navigator.xr.isSessionSupported('immersive-vr');

                const isAndroid = navigator.userAgent.includes('Android')
                const isOculusBrowser = navigator.userAgent.includes('OculusBrowser');

                const supportsModelElement = typeof window.HTMLModelElement !== 'undefined';

                if (supportsModelElement && supportsImmersiveVR) {
                    setXRPlatform('Vision Pro');
                } else if (isOculusBrowser && supportsImmersiveVR) {
                    setXRPlatform('Quest');
                } else if (isAndroid && supportsImmersiveAR) {
                    setXRPlatform('Android Mobile');
                } else {
                    setXRPlatform('None');
                }

                initXRPlatformTimeout.current = null;
            }, 1000);
        }
    }, [setXRPlatform]);

    // Initialize the current space if it is not set
    const initSpaceTimeout = useRef(null);
    useEffect(() => {
        if (initSpaceTimeout.current) {
            clearTimeout(initSpaceTimeout.current);
            initSpaceTimeout.current = null;
        }
        if (!currentSpace) {
            initSpaceTimeout.current = setTimeout(async () => {
                const spaceUUIDs = await VarvEngine.getAllUUIDsFromType('Space');

                if (spaceUUIDs.length > 0) {
                    setCurrentSpace(spaceUUIDs[0]);
                } else {
                    setCurrentSpace(await VarvEngine.getConceptFromType('Space').create(null, { name: 'New Space' }));
                }
                initSpaceTimeout.current = null;
            }, 1000);
        }
    }, [currentSpace, setCurrentSpace]);

    // Load shape utils and movables here to cache them between switching views
    const shapeUtils = useDynamicModules('.dynamic-shape-component');
    const movableSceneComponents = useDynamicModules('.dynamic-movable-scene-component');

    const view = useMemo(() => {
        switch (currentView) {
            case '3D':
                return <SceneView movableSceneComponents={movableSceneComponents} />;
            case '2D':
                return <CanvasView shapeUtils={shapeUtils} />;
            default:
                return null;
        }
    }, [currentView, shapeUtils, movableSceneComponents]);

    return currentSpace ? view : null;
}

export function App() {
    return <GlobalEventProvider>
        <Varv concept="SpaceManager">
            <DynamicComponents selector=".dynamic-gui-component" />
            <SpaceView />
        </Varv>
    </GlobalEventProvider>;
}
