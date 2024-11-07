import React from 'react';
const { useState, useMemo, useRef } = React;
import { MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useFrame } from '@react-three/fiber';
import { Varv, useProperty } from '#VarvReact';
import { useGLTF } from '@react-three/drei';

import { Movable, SELECTED_COLOR_PRIMARY, HOVERED_SELECTED_COLOR_PRIMARY } from '#Movable .default';
import { Icon } from '#Icon .default';
import { transcribeAudio } from '#AIHelpers .default';
import { Text } from '#Text .default';



const frameGeometry = new RoundedBoxGeometry(0.15, 0.15, 0.005, 1);
const frameMaterial = new MeshStandardMaterial({ color: '#FDD835', metalness: 0.2, roughness: 0.5 });
const frameMaterialHovered = new MeshStandardMaterial({ color: '#FFF176', metalness: 0.2, roughness: 0.5 });
const frameMaterialSelected = new MeshStandardMaterial({ color: SELECTED_COLOR_PRIMARY, metalness: 0.2, roughness: 0.5 });
const frameMaterialHoveredSelected = new MeshStandardMaterial({ color: HOVERED_SELECTED_COLOR_PRIMARY, metalness: 0.2, roughness: 0.5 });
useGLTF.preload('microphone.glb');



function StickyNote() {
    const iconRef = useRef();
    const microphoneIcon = useGLTF('microphone.glb');
    const [listening, setListening] = useState(false);
    const [text, setText] = useProperty('text');
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');

    async function updateText() {
        if (listening) return;

        setListening(true);
        const newText = await transcribeAudio(5000, false, () => { setListening(false); });
        if (newText) setText(newText);
    }

    const handle = useMemo(() => <mesh
        geometry={frameGeometry}
        material={selected ? (hovered ? frameMaterialHoveredSelected : frameMaterialSelected) : (hovered ? frameMaterialHovered : frameMaterial)}
        position={[0, 0.025, 0]}
        autoUpdateMatrix={false}
    />, [hovered, selected]);

    useFrame((state) => {
        if (!iconRef.current) return;
        const minScale = 0.4;
        const maxScale = 0.6;
        const targetScale = listening ? minScale + (maxScale - minScale) * (Math.sin(state.clock.elapsedTime * 5) * 0.5 + 0.5) : 0.5;
        iconRef.current.scale.setScalar(targetScale);
    });

    return <Movable handle={handle} upright={false}>
        <Text
            position={[0, 0.025, 0.003]} autoUpdateMatrix={false}
            maxWidth={0.13}
            textAlign='left'
            anchorX='center'
            anchorY='middle'
            color='black'
            fontSize={0.01}>
            {text}
        </Text>
        {selected ? <group ref={iconRef} rotation={[0, -Math.PI, 0]} position={[0.1, 0.025, 0]}>
            <Icon model={microphoneIcon} onClick={updateText} />
        </group> : null}
    </Movable>;
}



export function Main() {
    return <Varv concept="StickyNote">
        <StickyNote />
    </Varv>;
}
