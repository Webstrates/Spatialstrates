import React from 'react';
const { useEffect, useState, useMemo, useRef, useCallback } = React;
import { BackSide, MeshStandardMaterial, BoxGeometry, Vector3, Matrix4, Euler, PlaneGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useFrame } from '@react-three/fiber';
import { useXRInputSourceEvent } from '@react-three/xr';
import { Varv, useProperty } from '#VarvReact';

import { BoundaryResizer, BoundingBox, DragUpdater } from '#Spatialstrates .scene-helpers';



const dragGeometry = new RoundedBoxGeometry(1, 1, 1, 1);
const dragMaterial = new MeshStandardMaterial({ color: '#888' });
const dragScale = 0.05;

export function BoundaryPreview() {
    const [showBoundary] = useProperty('showBoundary');
    const [boundarySize] = useProperty('boundarySize');
    const [boundaryOrigin, setBoundaryOrigin] = useProperty('boundaryOrigin');

    const updatePositionRef = useCallback((currentRef) => {
        currentRef.position.fromArray(boundaryOrigin);
    }, [boundaryOrigin]);

    const updatePositionValue = useCallback(({ position, rotation }) => {
        setBoundaryOrigin(position);
    }, [setBoundaryOrigin]);

    const boundingBox = useMemo(() => {
        return Array.isArray(boundarySize) ? <BoundingBox scale={boundarySize} /> : null;
    }, [boundarySize]);

    return showBoundary ? <>
        <group position={boundaryOrigin}>
            {boundingBox}
            <BoundaryResizer />
        </group>
        <DragUpdater updateRef={updatePositionRef} updateValue={updatePositionValue} disableRotation={true}>
            <mesh geometry={dragGeometry} material={dragMaterial} scale={dragScale} />
        </DragUpdater>
    </> : null;
}
