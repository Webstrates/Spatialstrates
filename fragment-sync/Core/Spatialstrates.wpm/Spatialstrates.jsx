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

    // Initialize the current space if it is not set
    const timeout = useRef(null);
    useEffect(() => {
        if (timeout.current) {
            clearTimeout(timeout.current);
            timeout.current = null;
        }
        if (!currentSpace) {
            timeout.current = setTimeout(async () => {
                const spaceUUIDs = await VarvEngine.getAllUUIDsFromType('Space');

                if (spaceUUIDs.length > 0) {
                    setCurrentSpace(spaceUUIDs[0]);
                } else {
                    setCurrentSpace(await VarvEngine.getConceptFromType('Space').create(null, { name: 'New Space' }));
                }
                timeout.current = null;
            }, 1000);
        }
    }, [currentSpace, setCurrentSpace]);

    // Load shape utils here to cache them between switching views
    const shapeUtils = useDynamicModules('.dynamic-shape-component');

    const view = useMemo(() => {
        switch (currentView) {
            case '3D':
                return <SceneView />;
            case '2D':
                return <CanvasView shapeUtils={shapeUtils} />;
            default:
                return null;
        }
    }, [currentView, shapeUtils]);

    return currentSpace ? view : null;
}

export function App() {
    return <GlobalEventProvider>
        <DynamicComponents selector=".dynamic-gui-component" />
        <Varv concept="SpaceManager">
            <SpaceView />
        </Varv>
    </GlobalEventProvider>;
}
