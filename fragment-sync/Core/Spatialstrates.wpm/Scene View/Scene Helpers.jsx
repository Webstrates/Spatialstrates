import React from 'react';
const { useEffect, useState, useMemo, useRef, useCallback } = React;
import { MeshStandardMaterial, BoxGeometry, Matrix4 } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useFrame } from '@react-three/fiber';
import { useXRInputSourceEvent } from '@react-three/xr';
import { useProperty } from '#VarvReact';

import { getDeviceFromInputEvent } from '#Spatialstrates .device-helpers';



const DRAG_UPDATER_WRITEBACK_TIMEOUT = 33;

export function DragUpdater({ children, updateRef, updateValue, disableRotation = false, upright = false }) {
    const dragRef = useRef();
    const [currentXRInputSource, setCurrentXRInputSource] = useState(null);
    const [beingDragged, setBeingDragged] = useState(false);
    const fastWritebackTimeout = useRef();
    const grabbingController = useRef();
    const previousTransform = useMemo(() => new Matrix4(), []);
    const parentTransform = useMemo(() => new Matrix4(), []);
    const finalTransform = useMemo(() => new Matrix4(), []);

    const updatePreviousTransform = useCallback(() => {
        parentTransform.copy(dragRef.current.parent.matrixWorld).invert();
        previousTransform
            .copy(parentTransform) // Convert to parent space
            .multiply(grabbingController.current.matrixWorld) // Get controller in parent space
            .invert(); // Invert for future use
    }, []);

    const selectAndStartDrag = useCallback((e) => {
        if (e) e.stopPropagation();
        if (grabbingController.current) return;
        setBeingDragged(true);
        setCurrentXRInputSource(e?.nativeEvent?.inputSource);

        if (dragRef && dragRef.current) {
            grabbingController.current = getDeviceFromInputEvent(e);
            if (grabbingController.current) {
                updatePreviousTransform();
            }
        }
    }, []);

    const stopDrag = useCallback((e) => {
        if (e) e.stopPropagation();
        setBeingDragged(false);
        setCurrentXRInputSource(null);

        if (grabbingController.current) {
            grabbingController.current = undefined;
            updateValue({
                position: dragRef.current.position.toArray(),
                rotation: dragRef.current.rotation.toArray()
            });
        }
    }, [currentXRInputSource]);

    useXRInputSourceEvent(currentXRInputSource, 'selectend', stopDrag, [stopDrag, currentXRInputSource]);
    useEffect(() => {
        document.body.addEventListener('pointerup', stopDrag);
        return () => {
            document.body.removeEventListener('pointerup', stopDrag);
        };
    }, [stopDrag]);

    useFrame(() => {
        if (!beingDragged && dragRef.current) {
            updateRef(dragRef.current);
            dragRef.current.updateMatrix();
            return;
        }
        if (!grabbingController.current) return;

        finalTransform
            .copy(parentTransform) // Convert to parent space
            .multiply(grabbingController.current.matrixWorld); // Get controller in parent space

        dragRef.current.applyMatrix4(previousTransform); // Apply inverse of original position
        dragRef.current.applyMatrix4(finalTransform); // Apply new position

        if (disableRotation) {
            dragRef.current.rotation.fromArray([0, 0, 0]);
        } else if (upright) {
            dragRef.current.rotation.fromArray([0, dragRef.current.rotation.y, 0]);
        }

        dragRef.current.updateMatrix();
        updatePreviousTransform();

        // Update the Varv state
        if (!fastWritebackTimeout.current) {
            updateValue({
                position: dragRef.current.position.toArray(),
                rotation: dragRef.current.rotation.toArray()
            });
            fastWritebackTimeout.current = setTimeout(() => {
                fastWritebackTimeout.current = null;
            }, DRAG_UPDATER_WRITEBACK_TIMEOUT);
        }
    });

    return <group ref={dragRef} onPointerDown={selectAndStartDrag} onPointerUp={stopDrag}>
        {children}
    </group>
};



const resizerGeometry = new RoundedBoxGeometry(1, 1, 1, 1);
const resizerMaterial = new MeshStandardMaterial({ color: '#444' });
const resizerScale = 0.05;

export function BoundaryResizer() {
    const [boundarySize, setBoundarySize] = useProperty('boundarySize');

    const updateSizeRef = useCallback((currentRef) => {
        if (!Array.isArray(boundarySize)) return;
        currentRef.position.fromArray([boundarySize[0] / 2, boundarySize[1] / 2, boundarySize[2] / 2]);
    }, [boundarySize]);

    const updateSizeValue = useCallback(({ position, rotation }) => {
        setBoundarySize(position.map((v) => Math.abs(v * 2)));
    }, [setBoundarySize]);

    return <DragUpdater updateRef={updateSizeRef} updateValue={updateSizeValue} disableRotation={true}>
        <mesh geometry={resizerGeometry} material={resizerMaterial} scale={resizerScale} />
    </DragUpdater>
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
