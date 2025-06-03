import React from 'react';
import { BackSide } from 'three';
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

export function BasicSceneEnvironment() {
    return <>
        <gridHelper />
        <color attach="background" args={[0xE5E4E2]} />
        <Varv property="locationHash">
            <BasicSceneBackground />
        </Varv>
    </>;
}
