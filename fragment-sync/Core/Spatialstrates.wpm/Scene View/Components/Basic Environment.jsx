import React from 'react';
const { useCallback, useMemo, useRef } = React;
import { ErrorBoundary } from 'react-error-boundary';
import { BackSide, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { IfInSessionMode } from '@react-three/xr';
import { Gltf } from '@react-three/drei';
import { Varv, useProperty } from '#VarvReact';

import { Text } from '#Spatialstrates .text';



// Basic scene background with a title and color
function BasicSceneBackground() {
    const [name] = useProperty('name');
    const [color] = useProperty('color');

    return <>
        <Text text={name}
            fontSize={0.14}
            position={[0, 0.001, -0.01]}
            rotation={[-Math.PI * 0.5, 0, 0]}
            color="#444" />
        <mesh scale={200}>
            <sphereGeometry />
            <meshStandardMaterial color={color || '#E5E4E2'} side={BackSide} transparent={true} opacity={0.1} />
        </mesh>
    </>;
}

function CustomEnvironment({ applyOriginOffset }) {
    const [url] = useProperty('url');
    const [position] = useProperty('position');
    const [rotation] = useProperty('rotation');
    const [scale] = useProperty('scale');

    const model = useMemo(() => {
        return url ? <ErrorBoundary key={url} fallback={null}>
            <Gltf src={url} />
        </ErrorBoundary> : null;
    }, [url]);

    return <>
        <IfInSessionMode deny={['immersive-vr']}>
            <group position={position} rotation={rotation} scale={scale}>
                {model}
            </group>
        </IfInSessionMode>

        <IfInSessionMode allow={['immersive-vr']}>
            <group position={position} rotation={rotation} scale={scale}
                // onClick={(e) => {
                //     // FIXME: This breaks if we are inside the model itself like in a room scan
                //     // From TeleportPointer
                //     applyOriginOffset(new Vector3().setFromMatrixPosition(camera.matrix).negate().setComponent(1, 0).add(e.point));
                // }}
            >
                {model}
            </group>
        </IfInSessionMode>
    </>;
}

export function VirtualSceneEnvironment() {
    // Needs to be here as it has to be preserved across space changes
    const accumulatedYOffset = useRef(0);

    const { gl, camera } = useThree();

    const applyOriginOffset = useCallback((targetPosition) => {
        const referenceSpace = gl.xr.getReferenceSpace();
        if (!referenceSpace) return;

        // For X/Z: TeleportTarget gives us a delta from current position already
        // For Y: we need to calculate delta from accumulated Y to avoid stacking
        const deltaY = targetPosition.y - accumulatedYOffset.current;
        accumulatedYOffset.current = targetPosition.y;

        const offsetTransform = new XRRigidTransform(
            { x: -targetPosition.x, y: -deltaY, z: -targetPosition.z }
        );

        gl.xr.setReferenceSpace(referenceSpace.getOffsetReferenceSpace(offsetTransform));
    }, [gl]);

    return <>
        <gridHelper />
        <color attach="background" args={[0xE5E4E2]} />

        <IfInSessionMode allow={['immersive-vr']}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => {
                applyOriginOffset(new Vector3().setFromMatrixPosition(camera.matrix).negate().setComponent(1, 0).add(e.point));
            }}>
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
        </IfInSessionMode>

        <Varv property="locationHash">
            <BasicSceneBackground />
            <Varv property="environment">
                <CustomEnvironment applyOriginOffset={applyOriginOffset} />
            </Varv>
        </Varv>
    </>;
}
