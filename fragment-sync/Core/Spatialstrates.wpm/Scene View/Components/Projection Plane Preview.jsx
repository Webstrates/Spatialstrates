import React from 'react';
const { useMemo, useCallback } = React;
import { BackSide, MeshStandardMaterial, Vector3, Matrix4, Euler, PlaneGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useProperty } from '#VarvReact';

import { DragUpdater } from '#Spatialstrates .scene-helpers';



const projectionPlanePreviewGeometry = new PlaneGeometry(2, 1);
const projectionPlanePreviewFrontMaterial = new MeshStandardMaterial({ color: '#0000FF', opacity: 0.5, transparent: true });
const projectionPlanePreviewBackMaterial = new MeshStandardMaterial({ color: '#00FF00', opacity: 0.5, transparent: true, side: BackSide });

const dragGeometry = new RoundedBoxGeometry(1, 1, 1, 1);
const dragMaterial = new MeshStandardMaterial({ color: '#444' });
const dragScale = 0.05;

export function ProjectionPlanePreview({ positionOverride, scaleOverride }) {
    const [showProjectionPlane] = useProperty('showProjectionPlane');
    const [projectionPlane, setProjectionPlane] = useProperty('projectionPlane');

    const plane = useMemo(() => {
        if (!Array.isArray(projectionPlane)) return null;

        const position = positionOverride || projectionPlane.slice(0, 3);
        const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
        const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));
        const zAxis = new Vector3().fromArray(projectionPlane.slice(9, 12));

        // Create rotation matrix from orthonormal basis
        const rotationMatrix = new Matrix4().makeBasis(xAxis, yAxis, zAxis);
        const rotation = new Euler().setFromRotationMatrix(rotationMatrix);

        return <group position={position} rotation={rotation} scale={scaleOverride}>
            <mesh geometry={projectionPlanePreviewGeometry} material={projectionPlanePreviewFrontMaterial} />
            <mesh geometry={projectionPlanePreviewGeometry} material={projectionPlanePreviewBackMaterial} />
        </group>;
    }, [projectionPlane]);

    const updatePositionRef = useCallback((currentRef) => {
        const position = positionOverride || projectionPlane.slice(0, 3);
        const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
        const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));
        const zAxis = new Vector3().fromArray(projectionPlane.slice(9, 12));

        const rotationMatrix = new Matrix4().makeBasis(xAxis, yAxis, zAxis);
        const rotation = new Euler().setFromRotationMatrix(rotationMatrix);

        currentRef.position.fromArray(position);
        currentRef.rotation.fromArray(rotation.toArray());
    }, [projectionPlane]);

    const updatePositionValue = useCallback(({ position, rotation }) => {
        const xAxis = new Vector3(1, 0, 0).applyEuler(new Euler(rotation[0], rotation[1], rotation[2]));
        const yAxis = new Vector3(0, 1, 0).applyEuler(new Euler(rotation[0], rotation[1], rotation[2]));
        const zAxis = new Vector3(0, 0, 1).applyEuler(new Euler(rotation[0], rotation[1], rotation[2]));

        setProjectionPlane([...position, ...xAxis.toArray(), ...yAxis.toArray(), ...zAxis.toArray()]);
    }, [projectionPlane, setProjectionPlane]);

    return showProjectionPlane ? <>
        {plane}
        {!scaleOverride ? <DragUpdater updateRef={updatePositionRef} updateValue={updatePositionValue}>
            <mesh geometry={dragGeometry} material={dragMaterial} scale={dragScale} />
        </DragUpdater> : null}
    </> : null;
}
