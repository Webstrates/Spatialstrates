import React from 'react';
const { useCallback, useRef, useEffect } = React;
import { BackSide, MeshStandardMaterial, Vector3, Matrix4, Euler, PlaneGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Handle, HandleTarget } from '@react-three/handle';
import { defaultApply } from '@pmndrs/handle';
import { useProperty } from '#VarvReact';



const projectionPlanePreviewGeometry = new PlaneGeometry(2, 1);
const projectionPlanePreviewFrontMaterial = new MeshStandardMaterial({ color: '#0000FF', opacity: 0.5, transparent: true });
const projectionPlanePreviewBackMaterial = new MeshStandardMaterial({ color: '#00FF00', opacity: 0.5, transparent: true, side: BackSide });

const dragGeometry = new RoundedBoxGeometry(1, 1, 1, 1);
const dragMaterial = new MeshStandardMaterial({ color: '#444' });
const dragScale = 0.05;

export function ProjectionPlanePreview({ positionOverride, scaleOverride }) {
    const [showProjectionPlane] = useProperty('showProjectionPlane');
    const [projectionPlane, setProjectionPlane] = useProperty('projectionPlane');
    const handleTargetRef = useRef();

    // Sync the handle target with the projection plane data
    useEffect(() => {
        if (!handleTargetRef.current || !Array.isArray(projectionPlane)) return;

        const position = positionOverride || projectionPlane.slice(0, 3);
        const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
        const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));
        const zAxis = new Vector3().fromArray(projectionPlane.slice(9, 12));

        const rotationMatrix = new Matrix4().makeBasis(xAxis, yAxis, zAxis);
        const rotation = new Euler().setFromRotationMatrix(rotationMatrix);

        handleTargetRef.current.position.fromArray(position);
        handleTargetRef.current.rotation.copy(rotation);
    }, [projectionPlane, positionOverride]);

    // Custom apply function to update the projection plane on drag
    const applyDrag = useCallback((state, target) => {
        defaultApply(state, target);

        // Update the projection plane value when dragging ends or during drag
        if (target) {
            const position = target.position.toArray();
            const rotation = target.rotation.toArray();

            const xAxis = new Vector3(1, 0, 0).applyEuler(new Euler(rotation[0], rotation[1], rotation[2]));
            const yAxis = new Vector3(0, 1, 0).applyEuler(new Euler(rotation[0], rotation[1], rotation[2]));
            const zAxis = new Vector3(0, 0, 1).applyEuler(new Euler(rotation[0], rotation[1], rotation[2]));

            setProjectionPlane([...position, ...xAxis.toArray(), ...yAxis.toArray(), ...zAxis.toArray()]);
        }
    }, [setProjectionPlane]);

    if (!Array.isArray(projectionPlane)) return null;

    return <HandleTarget ref={handleTargetRef}>
        {showProjectionPlane ? <group scale={scaleOverride}>
            <mesh geometry={projectionPlanePreviewGeometry} material={projectionPlanePreviewFrontMaterial} />
            <mesh geometry={projectionPlanePreviewGeometry} material={projectionPlanePreviewBackMaterial} />
        </group> : null}
        {!scaleOverride ? <Handle
            targetRef="from-context"
            scale={false}
            apply={applyDrag}
        >
            {showProjectionPlane ? <mesh visible={!scaleOverride && showProjectionPlane} geometry={dragGeometry} material={dragMaterial} scale={dragScale} /> : null}
        </Handle> : null}
    </HandleTarget>;
}
