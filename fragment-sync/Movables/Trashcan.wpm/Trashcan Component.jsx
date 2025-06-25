import React from 'react';
const { useEffect, useCallback } = React;
import { ErrorBoundary } from 'react-error-boundary';
import { Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';
import { useProperty } from '#VarvReact';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { Movable } from '#Spatialstrates .movable';
import { deleteMovable } from '#Spatialstrates .movable-helpers';
import { Icon, SELECTED_COLOR_PRIMARY, SELECTED_COLOR_SECONDARY, HOVERED_SELECTED_COLOR_PRIMARY, HOVERED_SELECTED_COLOR_SECONDARY } from '#Icon .default';



const MAX_DISTANCE = 0.2;

const themes = {
    'trash': { primary: 'hsl(0, 0%, 20%)', secondary: 'hsl(0, 0%, 60%)' },
    'trash:hovered': { primary: 'hsl(0, 0%, 50%)', secondary: 'hsl(0, 0%, 70%)' },
    'trash:selected': { primary: SELECTED_COLOR_PRIMARY, secondary: SELECTED_COLOR_SECONDARY },
    'trash:selected:hovered': { primary: HOVERED_SELECTED_COLOR_PRIMARY, secondary: HOVERED_SELECTED_COLOR_SECONDARY },
};
useGLTF.preload('trash.glb');

function HandleIcon({ model, theme = '', themesOverride = '' }) {
    const [selected] = useProperty('selected');
    const [hovered] = useProperty('hovered');
    return <Icon theme={theme + (selected ? ':selected' : '') + (hovered ? ':hovered' : '')} model={model} themesOverride={themesOverride} />
}

function Trashcan() {
    const trashcanIcon = useGLTF('trash.glb');
    const handle = <HandleIcon theme="trash" model={trashcanIcon} themesOverride={themes} />
    const [position] = useProperty('position');
    const [uuid] = useProperty('concept::uuid');

    const { subscribeEvent } = useGlobalEvents();

    const onDragEnd = useCallback(async (data) => {
        if (data.target === uuid) return;

        const movablePositionArray = await VarvEngine.getConceptFromUUID(data.target).getPropertyValue(data.target, 'position');

        const trashcanPosition = new Vector3(...position);
        const movablePosition = new Vector3(...movablePositionArray);

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
    const [conceptType] = useProperty('concept::name');
    return conceptType === 'Trashcan' ? <ErrorBoundary fallback={null}>
        <Trashcan />
    </ErrorBoundary> : null;
}
