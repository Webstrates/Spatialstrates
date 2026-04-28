import React from 'react';
const { useCallback, useRef, useEffect } = React;
import { BackSide, MeshStandardMaterial, Vector3, Matrix4, Euler, PlaneGeometry, Quaternion } from 'three';
import { useFrame } from '@react-three/fiber';
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
const PROJECTION_PLANE_WRITEBACK_TIMEOUT = 33;

const getPointerLockCameraObject = () => {
    const controls = window.moduleCameraControls?.controlsRef?.current;
    if (!controls?.isLocked) return null;

    return window.moduleCameraControls?.getCameraObject?.() || controls.getObject?.() || controls.camera || null;
};

const applyWorldTransform = (target, worldPosition, worldQuaternion, parentWorldQuaternion, localPosition, localQuaternion) => {
    if (!target) return;

    if (target.parent) {
        target.parent.updateMatrixWorld(true);
        localPosition.copy(worldPosition);
        target.parent.worldToLocal(localPosition);
        target.position.copy(localPosition);

        target.parent.getWorldQuaternion(parentWorldQuaternion);
        localQuaternion.copy(parentWorldQuaternion).invert().multiply(worldQuaternion);
        target.quaternion.copy(localQuaternion);
    } else {
        target.position.copy(worldPosition);
        target.quaternion.copy(worldQuaternion);
    }

    target.updateMatrix();
    target.updateMatrixWorld(true);
};

export function ProjectionPlanePreview({ positionOverride, scaleOverride }) {
    const [showProjectionPlane] = useProperty('showProjectionPlane');
    const [projectionPlane, setProjectionPlane] = useProperty('projectionPlane');
    const handleTargetRef = useRef();
    const writebackTimeout = useRef();
    const pointerLockDragRef = useRef({
        active: false,
        relativePosition: new Vector3(),
        cameraWorldPosition: new Vector3(),
        targetWorldPosition: new Vector3(),
        cameraWorldQuaternion: new Quaternion(),
        targetWorldQuaternion: new Quaternion(),
        relativeQuaternion: new Quaternion(),
        inverseCameraWorldQuaternion: new Quaternion(),
        parentWorldQuaternion: new Quaternion(),
        localPosition: new Vector3(),
        localQuaternion: new Quaternion(),
        xAxis: new Vector3(),
        yAxis: new Vector3(),
        zAxis: new Vector3()
    });

    useEffect(() => {
        return () => {
            if (writebackTimeout.current) clearTimeout(writebackTimeout.current);
        };
    }, []);

    // Sync the handle target with the projection plane data
    useEffect(() => {
        if (!handleTargetRef.current || !Array.isArray(projectionPlane)) return;
        if (pointerLockDragRef.current.active) return;

        const position = positionOverride || projectionPlane.slice(0, 3);
        const xAxis = new Vector3().fromArray(projectionPlane.slice(3, 6));
        const yAxis = new Vector3().fromArray(projectionPlane.slice(6, 9));
        const zAxis = new Vector3().fromArray(projectionPlane.slice(9, 12));

        const rotationMatrix = new Matrix4().makeBasis(xAxis, yAxis, zAxis);
        const rotation = new Euler().setFromRotationMatrix(rotationMatrix);

        handleTargetRef.current.position.fromArray(position);
        handleTargetRef.current.rotation.copy(rotation);
    }, [projectionPlane, positionOverride]);

    const beginPointerLockDrag = useCallback((target) => {
        const cameraObject = getPointerLockCameraObject();
        const pointerLockDrag = pointerLockDragRef.current;

        if (!cameraObject || !target) {
            pointerLockDrag.active = false;
            return;
        }

        cameraObject.updateMatrixWorld(true);
        target.updateMatrixWorld(true);
        cameraObject.getWorldPosition(pointerLockDrag.cameraWorldPosition);
        cameraObject.getWorldQuaternion(pointerLockDrag.cameraWorldQuaternion);
        target.getWorldPosition(pointerLockDrag.targetWorldPosition);
        target.getWorldQuaternion(pointerLockDrag.targetWorldQuaternion);

        pointerLockDrag.relativePosition
            .subVectors(pointerLockDrag.targetWorldPosition, pointerLockDrag.cameraWorldPosition)
            .applyQuaternion(pointerLockDrag.inverseCameraWorldQuaternion.copy(pointerLockDrag.cameraWorldQuaternion).invert());

        pointerLockDrag.relativeQuaternion
            .copy(pointerLockDrag.cameraWorldQuaternion)
            .invert()
            .multiply(pointerLockDrag.targetWorldQuaternion);

        pointerLockDrag.active = true;
    }, []);

    const applyPointerLockTransform = useCallback((target) => {
        const cameraObject = getPointerLockCameraObject();
        const pointerLockDrag = pointerLockDragRef.current;

        if (!pointerLockDrag.active) {
            return false;
        }

        if (!cameraObject || !target) {
            pointerLockDrag.active = false;
            return false;
        }

        cameraObject.updateMatrixWorld(true);
        cameraObject.getWorldPosition(pointerLockDrag.cameraWorldPosition);
        cameraObject.getWorldQuaternion(pointerLockDrag.cameraWorldQuaternion);
        pointerLockDrag.targetWorldPosition
            .copy(pointerLockDrag.relativePosition)
            .applyQuaternion(pointerLockDrag.cameraWorldQuaternion)
            .add(pointerLockDrag.cameraWorldPosition);
        pointerLockDrag.targetWorldQuaternion
            .copy(pointerLockDrag.cameraWorldQuaternion)
            .multiply(pointerLockDrag.relativeQuaternion);

        applyWorldTransform(
            target,
            pointerLockDrag.targetWorldPosition,
            pointerLockDrag.targetWorldQuaternion,
            pointerLockDrag.parentWorldQuaternion,
            pointerLockDrag.localPosition,
            pointerLockDrag.localQuaternion
        );

        return true;
    }, []);

    const updateProjectionPlaneFromTarget = useCallback((target, force = false) => {
        if (!target) return;
        if (!force && writebackTimeout.current) return;

        const pointerLockDrag = pointerLockDragRef.current;
        target.updateMatrixWorld(true);
        target.getWorldPosition(pointerLockDrag.targetWorldPosition);
        target.getWorldQuaternion(pointerLockDrag.targetWorldQuaternion);

        pointerLockDrag.xAxis.set(1, 0, 0).applyQuaternion(pointerLockDrag.targetWorldQuaternion);
        pointerLockDrag.yAxis.set(0, 1, 0).applyQuaternion(pointerLockDrag.targetWorldQuaternion);
        pointerLockDrag.zAxis.set(0, 0, 1).applyQuaternion(pointerLockDrag.targetWorldQuaternion);

        setProjectionPlane([
            ...pointerLockDrag.targetWorldPosition.toArray(),
            ...pointerLockDrag.xAxis.toArray(),
            ...pointerLockDrag.yAxis.toArray(),
            ...pointerLockDrag.zAxis.toArray()
        ]);

        if (force && writebackTimeout.current) {
            clearTimeout(writebackTimeout.current);
            writebackTimeout.current = null;
        }

        if (!force) {
            writebackTimeout.current = setTimeout(() => {
                writebackTimeout.current = null;
            }, PROJECTION_PLANE_WRITEBACK_TIMEOUT);
        }
    }, [setProjectionPlane]);

    // Custom apply function to update the projection plane on drag
    const applyDrag = useCallback((state, target) => {
        defaultApply(state, target);

        if (state.first) {
            beginPointerLockDrag(target);
        }

        applyPointerLockTransform(target);
        updateProjectionPlaneFromTarget(target, state.last);

        if (state.last) {
            pointerLockDragRef.current.active = false;
        }
    }, [beginPointerLockDrag, applyPointerLockTransform, updateProjectionPlaneFromTarget]);

    useFrame(() => {
        if (!pointerLockDragRef.current.active || !handleTargetRef.current) return;

        applyPointerLockTransform(handleTargetRef.current);
        updateProjectionPlaneFromTarget(handleTargetRef.current);
    });

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
