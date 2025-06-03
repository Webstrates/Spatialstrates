import React from 'react';
import { Varv, useProperty } from '#VarvReact';

import { computeProjectionPlaneUsingPCA, resetProjectionPlane, resetBoundary } from '#Spatialstrates .projection-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer, MenuButton } from '#Menu .default';
import { addControllerSubMenu, addItemToControllerSubMenu, ControllerMenuTitle, ControllerMenuSpacer, ControllerMenuButton } from '#ControllerMenu .default';



function ProjectionPlaneToggleButton() {
    const [showProjectionPlane, setShowProjectionPlane] = useProperty('showProjectionPlane');
    return <MenuButton onClick={() => setShowProjectionPlane(!showProjectionPlane)} toggled={showProjectionPlane ? 'true' : null}>Toggle Projection Plane ({showProjectionPlane ? 'On' : 'Off'})</MenuButton>;
}
function BoundaryToggleButton() {
    const [showBoundary, setShowBoundary] = useProperty('showBoundary');
    return <MenuButton onClick={() => setShowBoundary(!showBoundary)} toggled={showBoundary ? 'true' : null}>Toggle Boundary ({showBoundary ? 'On' : 'Off'})</MenuButton>;
}
addSubMenu('projection-plane', 800, false);
addItemToSubMenu('projection-plane', 'title', <MenuTitle title="Projection Plane" />, 0);
addItemToSubMenu('projection-plane', 'show-projection-plane', <Varv concept="SpaceManager">
    <ProjectionPlaneToggleButton />
</Varv>, 100);
addItemToSubMenu('projection-plane', 'show-boundary', <Varv concept="SpaceManager">
    <BoundaryToggleButton />
</Varv>, 200);
addItemToSubMenu('projection-plane', 'spacer-1', <MenuSpacer />, 300);
addItemToSubMenu('projection-plane', 'compute-using-pca', <MenuButton onClick={() => computeProjectionPlaneUsingPCA()}>Compute Using PCA</MenuButton>, 400);
addItemToSubMenu('projection-plane', 'spacer-2', <MenuSpacer />, 500);
addItemToSubMenu('projection-plane', 'reset-projection-plane', <MenuButton onClick={() => resetProjectionPlane()}>Reset Projection Plane</MenuButton>, 600);
addItemToSubMenu('projection-plane', 'reset-boundary', <MenuButton onClick={() => resetBoundary()}>Reset Boundary</MenuButton>, 700);

function ProjectionPlaneToggleControllerButton() {
    const [showProjectionPlane, setShowProjectionPlane] = useProperty('showProjectionPlane');
    return <ControllerMenuButton onClick={() => setShowProjectionPlane(!showProjectionPlane)} toggled={showProjectionPlane ? 'true' : null}>Toggle Projection Plane ({showProjectionPlane ? 'On' : 'Off'})</ControllerMenuButton>;
}
function BoundaryToggleControllerButton() {
    const [showBoundary, setShowBoundary] = useProperty('showBoundary');
    return <ControllerMenuButton onClick={() => setShowBoundary(!showBoundary)} toggled={showBoundary ? 'true' : null}>Toggle Boundary ({showBoundary ? 'On' : 'Off'})</ControllerMenuButton>;
}
addControllerSubMenu('projection-plane', 800, false);
addItemToControllerSubMenu('projection-plane', 'title', <ControllerMenuTitle title="Projection Plane" />, 0);
addItemToControllerSubMenu('projection-plane', 'show-projection-plane', <Varv concept="SpaceManager">
    <ProjectionPlaneToggleControllerButton />
</Varv>, 100);
addItemToControllerSubMenu('projection-plane', 'show-boundary', <Varv concept="SpaceManager">
    <BoundaryToggleControllerButton />
</Varv>, 200);
addItemToControllerSubMenu('projection-plane', 'spacer-1', <ControllerMenuSpacer />, 300);
addItemToControllerSubMenu('projection-plane', 'compute-using-pca', <ControllerMenuButton onClick={() => computeProjectionPlaneUsingPCA()}>Compute Using PCA</ControllerMenuButton>, 400);
addItemToControllerSubMenu('projection-plane', 'spacer-2', <ControllerMenuSpacer />, 500);
addItemToControllerSubMenu('projection-plane', 'reset-projection-plane', <ControllerMenuButton onClick={() => resetProjectionPlane()}>Reset Projection Plane</ControllerMenuButton>, 600);
addItemToControllerSubMenu('projection-plane', 'reset-boundary', <ControllerMenuButton onClick={() => resetBoundary()}>Reset Boundary</ControllerMenuButton>, 700);
