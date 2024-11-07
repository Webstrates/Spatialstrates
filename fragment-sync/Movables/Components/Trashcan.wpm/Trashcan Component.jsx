import React from 'react';
const { useEffect, useCallback } = React;
import * as THREE from 'three';
import { Varv, useProperty } from '#VarvReact';
import { useGLTF } from '@react-three/drei';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { Movable, HandleIcon } from '#Movable .default';
import {
    SELECTED_COLOR_PRIMARY,
    SELECTED_COLOR_SECONDARY,
    HOVERED_SELECTED_COLOR_PRIMARY,
    HOVERED_SELECTED_COLOR_SECONDARY
} from '#Icon .default';
import { deleteMovable } from '#Movable .helpers';



const MAX_DISTANCE = 0.2;

const themes = {
    'trash': { primary: 'hsl(0, 0%, 20%)', secondary: 'hsl(0, 0%, 60%)' },
    'trash:hovered': { primary: 'hsl(0, 0%, 50%)', secondary: 'hsl(0, 0%, 70%)' },
    'trash:selected': { primary: SELECTED_COLOR_PRIMARY, secondary: SELECTED_COLOR_SECONDARY },
    'trash:selected:hovered': { primary: HOVERED_SELECTED_COLOR_PRIMARY, secondary: HOVERED_SELECTED_COLOR_SECONDARY },
};
useGLTF.preload('trash.glb');

function Trashcan() {
    const trashcanIcon = useGLTF('trash.glb');
    const handle = <HandleIcon theme="trash" model={trashcanIcon} themesOverride={themes} />
    const [position] = useProperty('position');
    const [uuid] = useProperty('concept::uuid');

    const { subscribeEvent } = useGlobalEvents();

    const onDragEnd = useCallback(async (data) => {
        if (data.target === uuid) return;

        const movablePositionArray = await VarvEngine.getConceptFromUUID(data.target).getPropertyValue(data.target, 'position');

        const trashcanPosition = new THREE.Vector3(...position);
        const movablePosition = new THREE.Vector3(...movablePositionArray);

        if (trashcanPosition.distanceTo(movablePosition) < MAX_DISTANCE) {
            await deleteMovable(data.target);
        }
    }, [position]);

    useEffect(() => {
        const unsubscribe = subscribeEvent('drag-end', onDragEnd);
        return () => unsubscribe();
    }, [subscribeEvent, position]);

    return <Movable handle={handle} />;
}



export function Main() {
    return <Varv concept="Trashcan">
        <Trashcan />
    </Varv>;
}
