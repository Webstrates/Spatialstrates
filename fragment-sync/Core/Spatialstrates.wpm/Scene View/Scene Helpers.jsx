import React from 'react';
const { useEffect, useRef, useCallback } = React;
import { MeshStandardMaterial, BoxGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Handle, HandleTarget } from '@react-three/handle';
import { defaultApply } from '@pmndrs/handle';
import { useProperty } from '#VarvReact';



const resizerGeometry = new RoundedBoxGeometry(1, 1, 1, 1);
const resizerMaterial = new MeshStandardMaterial({ color: '#444' });
const resizerScale = 0.05;

export function BoundaryResizer() {
    const [boundarySize, setBoundarySize] = useProperty('boundarySize');
    const resizeHandleTargetRef = useRef();

    // Sync the resize handle target with the boundary size
    useEffect(() => {
        if (!resizeHandleTargetRef.current || !Array.isArray(boundarySize)) return;
        resizeHandleTargetRef.current.position.set(
            boundarySize[0] / 2,
            boundarySize[1] / 2,
            boundarySize[2] / 2
        );
    }, [boundarySize]);

    // Custom apply function to update the boundary size on resize
    const applyResize = useCallback((state, target) => {
        defaultApply(state, target);

        if (target) {
            // Convert position to size (position is at half the size)
            setBoundarySize([
                Math.abs(target.position.x * 2),
                Math.abs(target.position.y * 2),
                Math.abs(target.position.z * 2)
            ]);
        }
    }, [setBoundarySize]);

    if (!Array.isArray(boundarySize)) return null;

    return <HandleTarget ref={resizeHandleTargetRef}>
        <Handle
            targetRef="from-context"
            rotate={false}
            scale={false}
            apply={applyResize}
        >
            <mesh geometry={resizerGeometry} material={resizerMaterial} scale={resizerScale} />
        </Handle>
    </HandleTarget>;
}



const boundingBoxGeometry = new BoxGeometry(1, 1, 1, 1);
const dummyBoundingBoxMaterial = new MeshStandardMaterial({ color: '#888', opacity: 0.3, transparent: true });

export function BoundingBox({ position, scale, dummy = false }) {
    return <group position={position} scale={scale}>
        {dummy ? <mesh geometry={boundingBoxGeometry} material={dummyBoundingBoxMaterial} /> : null}
        <lineSegments>
            <edgesGeometry args={[boundingBoxGeometry]} />
            <lineBasicMaterial color="#333" />
        </lineSegments>
    </group>;
}
