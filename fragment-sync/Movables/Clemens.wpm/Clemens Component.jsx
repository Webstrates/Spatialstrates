import React from 'react';
const { useMemo } = React;
import { TextureLoader } from 'three';
import { useLoader } from '@react-three/fiber';
import { useProperty } from '#VarvReact';

import { Movable } from '#Spatialstrates .movable';



function Clemens() {
    const texture = useLoader(TextureLoader, 'clemens.jpg');
    const handle = useMemo(() => (
        <mesh>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshStandardMaterial map={texture} />
        </mesh>
    ), [texture]);

    return <Movable handle={handle} upright={false} />;
}

export function Main() {
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'Clemens' ? <Clemens /> : null;
}
