import React from 'react';
const { useRef, useCallback } = React;
import { Vector3, Quaternion } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { IfInSessionMode, useXRInputSourceState } from '@react-three/xr';
import { useGLTF } from '@react-three/drei';
import { Handle, HandleTarget, defaultApply } from '@react-three/handle';

import { Icon } from '#Icon .default';



const themes = {
    'calibrationPoint': { primary: 'hsl(65, 100%, 40%)', secondary: 'hsl(200, 18%, 50%)' },
    'calibrationPoint:hovered': { primary: 'hsl(65, 100%, 60%)', secondary: 'hsl(200, 18%, 60%)' }
};
useGLTF.preload('calibration_point.glb');

/**
 * Calibration marker component for AR mode
 * Drag the marker to offset the XR origin position and rotation
 */
function CalibrationPoint() {
    const calibrateIcon = useGLTF('calibration_point.glb');
    const handleTargetRef = useRef();
    const { gl } = useThree();

    const applyCalibration = useCallback((state, target) => {
        defaultApply(state, target);

        // On drag end, apply the calibration offset to the XR reference space
        if (state.last) {
            if (!target) return;

            // Constrain rotation to y-axis only
            target.rotation.reorder('YXZ');
            target.rotation.x = 0;
            target.rotation.z = 0;

            // Create the offset transform (ignore height changes)
            const offsetTransform = new XRRigidTransform({
                x: target.position.x,
                y: 0,
                z: target.position.z
            }, target.quaternion);

            // Apply the offset to the XR reference space
            gl.xr.setReferenceSpace(referenceSpace.getOffsetReferenceSpace(offsetTransform));

            // Reset the calibration point position
            target.rotation.y = 0;
            target.position.x = 0;
            target.position.z = 0;
        }
    }, [gl]);

    return <HandleTarget ref={handleTargetRef}>
        <Handle
            targetRef="from-context"
            rotate={{ x: false, z: false }}
            scale={false}
            apply={applyCalibration}
        >
            <Icon theme="calibrationPoint" model={calibrateIcon} themesOverride={themes} />
        </Handle>
    </HandleTarget>;
}

function Locomotion({ applyOriginOffset, applyRotationAroundCamera }) {
    const leftController = useXRInputSourceState('controller', 'left');
    const rightController = useXRInputSourceState('controller', 'right');
    const lastTurnTime = useRef(0);
    const lastMoveTime = useRef(0);
    const wasTurnActive = useRef(false);
    const wasMoveActive = useRef(false);

    useFrame((state) => {
        const now = state.clock.elapsedTime;

        const leftTurn = leftController?.gamepad['xr-standard-thumbstick']?.xAxis ?? 0;
        const rightTurn = rightController?.gamepad['xr-standard-thumbstick']?.xAxis ?? 0;
        const turn = Math.abs(leftTurn) > Math.abs(rightTurn) ? leftTurn : rightTurn;

        const leftMove = leftController?.gamepad['xr-standard-thumbstick']?.yAxis ?? 0;
        const rightMove = rightController?.gamepad['xr-standard-thumbstick']?.yAxis ?? 0;
        const move = Math.abs(leftMove) > Math.abs(rightMove) ? leftMove : rightMove;

        const isTurnActive = Math.abs(turn) > 0.75;
        const isMoveActive = Math.abs(move) > 0.75;

        // Snap turn: 45 degrees around the camera position
        if (isTurnActive && (now - lastTurnTime.current > 0.3)) {
            const camera = state.camera;
            const cameraPos = new Vector3();
            camera.getWorldPosition(cameraPos);

            const turnAmount = turn > 0 ? -Math.PI / 4 : Math.PI / 4;
            applyRotationAroundCamera(turnAmount, cameraPos);
            lastTurnTime.current = now;
        }

        // Snap move: 1 meter relative to camera direction
        if (isMoveActive && (now - lastMoveTime.current > 0.3)) {
            const camera = state.camera;
            const worldQuat = new Quaternion();
            camera.getWorldQuaternion(worldQuat);

            // Get the forward direction vector (camera looks down -Z in local space)
            // move > 0 means pushing forward on stick = move forward
            const forward = move > 0 ? new Vector3(0, 0, 1) : new Vector3(0, 0, -1);
            forward.applyQuaternion(worldQuat);
            forward.y = 0; // Keep movement horizontal
            forward.normalize();

            const position = new Vector3(forward.x, 0, forward.z);
            applyOriginOffset(position);
            lastMoveTime.current = now;
        }

        if (!isTurnActive && wasTurnActive.current) {
            lastTurnTime.current = 0;
        }
        if (!isMoveActive && wasMoveActive.current) {
            lastMoveTime.current = 0;
        }
        wasTurnActive.current = isTurnActive;
        wasMoveActive.current = isMoveActive;
    });
}



export function Main() {
    const { gl } = useThree();

    // Helper function to apply a position offset to the XR reference space
    const applyOriginOffset = useCallback((position) => {
        const referenceSpace = gl.xr.getReferenceSpace();
        if (!referenceSpace) return;

        // XRRigidTransform offset is inverted, so we negate position
        const positionTransform = new XRRigidTransform(
            { x: -position.x, y: -position.y, z: -position.z }
        );
        gl.xr.setReferenceSpace(referenceSpace.getOffsetReferenceSpace(positionTransform));
    }, [gl]);

    // Helper function to rotate around the camera's current position
    // This applies three transforms: translate to origin, rotate, translate back
    const applyRotationAroundCamera = useCallback((angle, cameraWorldPos) => {
        let referenceSpace = gl.xr.getReferenceSpace();
        if (!referenceSpace) return;

        const toOrigin = new XRRigidTransform({
            x: cameraWorldPos.x,
            y: 0,
            z: cameraWorldPos.z
        });
        referenceSpace = referenceSpace.getOffsetReferenceSpace(toOrigin);

        const rotQuat = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -angle);
        const rotate = new XRRigidTransform(
            { x: 0, y: 0, z: 0 },
            { x: rotQuat.x, y: rotQuat.y, z: rotQuat.z, w: rotQuat.w }
        );
        referenceSpace = referenceSpace.getOffsetReferenceSpace(rotate);

        const fromOrigin = new XRRigidTransform({
            x: -cameraWorldPos.x,
            y: 0,
            z: -cameraWorldPos.z
        });
        referenceSpace = referenceSpace.getOffsetReferenceSpace(fromOrigin);

        gl.xr.setReferenceSpace(referenceSpace);
    }, [gl]);

    return <>
        <IfInSessionMode allow={['immersive-ar']}>
            <CalibrationPoint />
        </IfInSessionMode>

        <IfInSessionMode allow={['immersive-vr']}>
            <Locomotion
                applyOriginOffset={applyOriginOffset}
                applyRotationAroundCamera={applyRotationAroundCamera}
            />
        </IfInSessionMode>
    </>;
}
