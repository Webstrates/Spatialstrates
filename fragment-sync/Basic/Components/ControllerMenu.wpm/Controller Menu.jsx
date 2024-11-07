import React from 'react';
let { useState, useEffect, useMemo } = React;
import { useXRInputSourceState } from '@react-three/xr';
import { createPortal } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

import { Icon } from "#Icon .default";
import { Text } from '#Text .default';



if (!window.moduleControllerMenu) {
    window.moduleControllerMenu = {
        menu: new Map(),
        menuNeedsUpdate: true
    };
}

class MenuItem {
    constructor(id, element) {
        this.id = id;
        this.element = element;
    }
}

export const addItem = (id, element) => {
    const menuItem = new MenuItem(id, element);
    window.moduleControllerMenu.menu.set(id, menuItem);
    window.moduleControllerMenu.menuNeedsUpdate = true;
    return menuItem;
};



const themes = {
    'button': { primary: 'hsl(200, 18%, 50%)', secondary: 'hsl(198, 16%, 84%)' },
    'button:hovered': { primary: 'hsl(200, 18%, 60%)', secondary: 'hsl(198, 16%, 84%)' },
    'button:disabled': { primary: 'rgb(0,0,0)', secondary: 'rgb(0,0,0)' },
    'button:toggled': { primary: 'hsl(200, 18%, 50%)', secondary: 'hsl(47, 100%, 63%)' },
    'button:toggled:hovered': { primary: 'hsl(200, 18%, 60%)', secondary: 'hsl(47, 100%, 73%)' },

    'deleteButton': { primary: 'hsl(0, 73%, 40%)', secondary: 'hsl(4, 90%, 60%)' },
    'deleteButton:hovered': { primary: 'hsl(0, 73%, 50%)', secondary: 'hsl(4, 90%, 70%)' }
};
useGLTF.preload('button.glb');



export function ControllerMenuButton({ position, name, theme = 'button', callback }) {
    const controllerButton = useGLTF('button.glb');
    const [hovered, setHovered] = useState();

    return <group position={position} scale={hovered ? 1.1 : 1} autoUpdateMatrix={false}>
        <Icon theme={theme + (hovered ? ':hovered' : '')}
            model={controllerButton}
            themesOverride={themes}
            onPointerDown={callback}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)} />
        <Text
            position={[0, 0, 0.005]} autoUpdateMatrix={false}
            maxWidth={0.045}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            color="black"
            fontSize={0.007}>
            {name}
        </Text>
    </group>;
}

function ControllerMenu() {
    const [showMenu, setShowMenu] = useState(false);
    const [output, setOutput] = useState(null);

    // Attach the menu
    const controllerLeft = useXRInputSourceState('controller', 'left');
    const handLeft = useXRInputSourceState('hand', 'left');

    // FIXME: Sometimes the parent is not set correclty and the menu only shows when switching back and forth between hands
    const parent = useMemo(() => controllerLeft ? controllerLeft.object : handLeft ? handLeft.object : null, [controllerLeft, handLeft]);

    const menuGroup = useMemo(() => parent ? createPortal(<group position={[0, 0.06, -0.15]} rotation={false ? [-Math.PI / 2, 0.2, 0.2] : [-Math.PI / 2, 0, 0]}>
        <ControllerMenuButton position={[0, -0.06, 0]} name={'Show Menu'} callback={() => setShowMenu(!showMenu)} theme={showMenu ? 'button:toggled' : 'button'} />
        {showMenu ? output : null}
    </group>, parent) : null, [parent, output, showMenu, controllerLeft, handLeft]);

    const updateMenu = () => {
        setOutput(Array.from(window.moduleControllerMenu.menu.values())
            .sort((a, b) => a.weight - b.weight)
            .map(menuItem => menuItem.element));
    }

    useEffect(() => {
        if (window.moduleControllerMenu.menuNeedsUpdate) {
            window.moduleControllerMenu.menuNeedsUpdate = false;
            updateMenu();
        }
    });

    useEffect(() => {
        updateMenu();
    }, []);

    return menuGroup;
}



export function Main() {
    return <ControllerMenu />;
}
