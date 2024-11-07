import React from 'react';
const { useRef } = React;
import { useFrame, useThree } from '@react-three/fiber';
import { useXRInputSourceEvent, useXRInputSourceState, IfInSessionMode } from '@react-three/xr';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { Icon } from "#Icon .default";



const themes = {
    'calibrationPoint': { primary: 'hsl(65, 100%, 40%)', secondary: 'hsl(200, 18%, 50%)' },
    'calibrationPoint:hovered': { primary: 'hsl(65, 100%, 60%)', secondary: 'hsl(200, 18%, 60%)' }
};
useGLTF.preload('calibration_point.glb');

/**
 * Move the entire scene view based on a calibration marker or a cube that can be moved around
*/
function CalibrationPoint() {
    const calibrateIcon = useGLTF('calibration_point.glb');
    let offsetUpdate = false;
    const grabbingController = useRef();
    const previousTransform = React.useMemo(() => new THREE.Matrix4(), [])
    const dragRef = useRef();

    // If a new offset has been set, inform the XR manager
    useFrame((state) => {
        if (offsetUpdate) {
            const referenceSpace = state.gl.xr.getReferenceSpace()
            state.gl.xr.setReferenceSpace(referenceSpace.getOffsetReferenceSpace(offsetUpdate));
            offsetUpdate = false;
        }

        const controller = grabbingController.current;
        if (!controller) return;

        dragRef.current.applyMatrix4(previousTransform);
        dragRef.current.applyMatrix4(controller.matrixWorld);
        dragRef.current.rotation.reorder('YXZ');
        dragRef.current.rotation.x = 0;
        dragRef.current.rotation.z = 0;
        dragRef.current.updateMatrixWorld();
        previousTransform.copy(controller.matrixWorld).invert();
    });

    // When the reference has moved, store the offset and reset it back (but not in height)
    const calibrate = () => {
        if (!dragRef.current) return;
        dragRef.current.rotation.reorder('YXZ');
        dragRef.current.rotation.x = 0;
        dragRef.current.rotation.z = 0;
        offsetUpdate = new XRRigidTransform({
            x: dragRef.current.position.x,
            y: 0,
            z: dragRef.current.position.z
        }, dragRef.current.quaternion);
        dragRef.current.rotation.y = 0;
        dragRef.current.position.x = 0;
        dragRef.current.position.z = 0;
    };

    const { camera } = useThree();
    const controllerRight = useXRInputSourceState('controller', 'right');
    const controllerLeft = useXRInputSourceState('controller', 'left');
    const handRight = useXRInputSourceState('hand', 'right');
    const handLeft = useXRInputSourceState('hand', 'left');

    useXRInputSourceEvent('all', 'selectend', (e) => {
        if (e.target.controller === grabbingController.current) {
            grabbingController.current = undefined;
            calibrate();
        }
    }, []);

    return <>
        <group ref={dragRef} onPointerDown={(e) => {
            if (grabbingController.current) return;
            if (e.nativeEvent?.inputSource) {
                if (e.nativeEvent.inputSource.hand === null) {
                    grabbingController.current = e.nativeEvent.inputSource.handedness === 'right' ? controllerRight?.object : controllerLeft?.object;
                } else {
                    grabbingController.current = e.nativeEvent.inputSource.handedness === 'right' ? handRight?.object : handLeft?.object;
                }
            } else if (e.nativeEvent?.button === 0) {
                grabbingController.current = camera;
            }
            if (grabbingController.current) {
                previousTransform.copy(grabbingController.current.matrixWorld).invert();
            }
        }}
            onPointerUp={() => {
                if (grabbingController.current) {
                    grabbingController.current = undefined;
                    calibrate();
                }
            }}>
            <Icon theme="calibrationPoint" model={calibrateIcon} themesOverride={themes} />
        </group>
    </>;
}



export function Main() {
    return <IfInSessionMode allow={['immersive-ar', 'immersive-vr']}>
        <CalibrationPoint />
    </IfInSessionMode>;
}
