import React from 'react';
const { useMemo, useCallback, useRef, useEffect } = React;
import { MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Handle, HandleTarget } from '@react-three/handle';
import { defaultApply } from '@pmndrs/handle';
import { useProperty } from '#VarvReact';

import { BoundingBox, BoundaryResizer } from '#Spatialstrates .scene-helpers';



const dragGeometry = new RoundedBoxGeometry(1, 1, 1, 1);
const dragMaterial = new MeshStandardMaterial({ color: '#888' });
const dragScale = 0.05;

export function BoundaryPreview() {
    const [showBoundary] = useProperty('showBoundary');
    const [boundarySize] = useProperty('boundarySize');
    const [boundaryOrigin, setBoundaryOrigin] = useProperty('boundaryOrigin');
    const handleTargetRef = useRef();

    // Sync the handle target with the boundary origin
    useEffect(() => {
        if (!handleTargetRef.current || !Array.isArray(boundaryOrigin)) return;
        handleTargetRef.current.position.fromArray(boundaryOrigin);
    }, [boundaryOrigin]);

    // Custom apply function to update the boundary origin on drag
    const applyDrag = useCallback((state, target) => {
        defaultApply(state, target);

        if (target) {
            setBoundaryOrigin(target.position.toArray());
        }
    }, [setBoundaryOrigin]);

    const boundingBox = useMemo(() => {
        return Array.isArray(boundarySize) ? <BoundingBox scale={boundarySize} /> : null;
    }, [boundarySize]);

    if (!Array.isArray(boundaryOrigin)) return null;

    return <HandleTarget ref={handleTargetRef}>
        {showBoundary ? <>
            {boundingBox}
            <BoundaryResizer />
        </> : null}
        <Handle
            targetRef="from-context"
            rotate={false}
            scale={false}
            apply={applyDrag}
        >
            {showBoundary ? <mesh geometry={dragGeometry} material={dragMaterial} scale={dragScale} /> : null}
        </Handle>
    </HandleTarget>;
}
