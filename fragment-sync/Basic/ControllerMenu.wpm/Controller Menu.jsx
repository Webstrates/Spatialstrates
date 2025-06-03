import React from 'react';
const { useState, useEffect, useMemo, useRef } = React;
import { Color } from 'three';
import { createPortal, useFrame } from '@react-three/fiber';
import { useXRInputSourceState } from '@react-three/xr';
import { Text as UIText, Root } from '@react-three/uikit';
import { Defaults, Card, Button, List, ListItem } from '@react-three/uikit-apfel';
import { Varv, useProperty } from '#VarvReact';



const COLORS = {
    red: '#ff3333',
    green: '#66ff66',
    blue: '#6666ff',
    yellow: '#ffcc66',
    purple: '#ff66ff',
    orange: '#ff9966',
    pink: '#ff3399',
};



function hsl(h, s, l) {
    return new Color().setHSL(h / 360, s / 100, l / 100, 'srgb')
}

if (!window.moduleControllerMenu) {
    window.moduleControllerMenu = {
        subMenus: new Map(),
        menuNeedsUpdate: true
    };
}

class MenuItem {
    constructor(id, element, weight) {
        this.id = id;
        this.element = element;
        this.weight = weight;
    }
}

class SubMenu {
    constructor(id, weight, alwaysVisible = false) {
        this.id = id;
        this.weight = weight;
        this.alwaysVisible = alwaysVisible; // Does not do anything yet
        this.items = new Map();
    }

    addItem(item) {
        this.items.set(item.id, item);
    }
}

export const addControllerSubMenu = (id, weight, alwaysVisible) => {
    if (window.moduleControllerMenu.subMenus.has(id)) {
        return window.moduleControllerMenu.subMenus.get(id);
    }
    const subMenu = new SubMenu(id, weight, alwaysVisible);
    window.moduleControllerMenu.subMenus.set(id, subMenu);
    window.moduleControllerMenu.menuNeedsUpdate = true;
    return subMenu;
};

export const addItemToControllerSubMenu = (subMenuId, id, element, weight) => {
    const menuItem = new MenuItem(id, element, weight);
    const subMenu = window.moduleControllerMenu.subMenus.get(subMenuId);
    if (!subMenu) {
        console.error(`SubMenu ${subMenuId} not found`);
        return;
    }
    subMenu.addItem(menuItem);
    window.moduleControllerMenu.menuNeedsUpdate = true;
    return menuItem;
};

export function ControllerMenuTitle({ title }) {
    return <UIText
        fontSize={18}
        fontWeight="light"
        padding={16}>{title}</UIText>
}

export function ControllerMenuSpacer() {
    return <UIText color={hsl(0, 0, 30)}>|</UIText>
}

export function ControllerMenuButton({ onClick, toggled, children }) {
    return <ListItem
        selected={toggled}
        flexGrow={1}
        borderWidth={1.5}
        borderColor={hsl(0, 0, 10)}
        onClick={onClick}>
        <UIText textAlign="center">{children}</UIText>
    </ListItem>;
}

function SubMenuComponent({ key, children }) {
    return <List key={key}
        type="plain"
        maxWidth={800}
        borderRadius={16}
        padding={8}
        backgroundColor={hsl(0, 0, 20)}
        flexDirection="row"
        flexWrap="wrap"
        gap={8}>
        {children}
    </List>
}

function PropertyForwarder({ setColor, setName }) {
    const [color] = useProperty('color');
    const [name] = useProperty('name');

    useEffect(() => {
        if (typeof color !== 'string') return;
        setColor(color);
    }, [color]);

    useEffect(() => {
        if (typeof name !== 'string') return;
        setName(name);
    }, [name]);
}

function SubMenus() {
    const [showMenu, setShowMenu] = useState(false);
    const [output, setOutput] = useState(null);
    const [color, setColor] = useState('');
    const [name, setName] = useState('');

    const updateMenu = () => {
        const subMenus = Array.from(window.moduleControllerMenu.subMenus.values());
        subMenus.sort((a, b) => a.weight - b.weight);

        setOutput(<>
            {subMenus.map(subMenu => {
                const items = Array.from(subMenu.items.values());
                items.sort((a, b) => a.weight - b.weight);
                return <SubMenuComponent key={subMenu.id}>
                    {items.map((item, index) => (React.cloneElement(item.element, { key: index })))}
                </SubMenuComponent>;
            })}
        </>);
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

    return <>
        <Varv concept="SpaceManager">
            <Varv property="locationHash">
                <PropertyForwarder setColor={setColor} setName={setName} />
            </Varv>
        </Varv>
        <Defaults>
            <Root
                anchorX="center"
                anchorY="bottom"
                flexDirection="column"
                pixelSize={0.0005}>
                <Card borderRadius={24}
                    borderBend={24}
                    padding={24}
                    gap={16}
                    flexDirection="column">
                    {showMenu ? output : null}
                    <Button platter
                        size="lg"
                        backgroundColor={COLORS[color] || ''}
                        backgroundOpacity={0.5}
                        hover={{
                            backgroundColor: COLORS[color] || '',
                            backgroundOpacity: 0.65,
                        }}
                        onClick={() => setShowMenu(!showMenu)}>
                        <UIText>{name || 'Toggle Menu'}</UIText>
                    </Button>
                </Card>
            </Root>
        </Defaults>
    </>;
}

function ControllerMenu() {
    const controllerLeft = useXRInputSourceState('controller', 'left');
    const handLeft = useXRInputSourceState('hand', 'left');
    const [output, setOutput] = useState(null);

    const submenus = useMemo(() => <SubMenus />, []);
    const menu = useMemo(() => <group
        position={controllerLeft ? [0, 0.11, 0.06] : [-0.02, 0.06, 0.11]}
        rotation={controllerLeft ? [-Math.PI / 2, 0, 0] : [-0.2, 0.2, -0.5]}>
        {submenus}
    </group>, [submenus, controllerLeft]);

    const slowWritebackTimeout = useRef(null);
    useFrame(() => {
        if (!slowWritebackTimeout.current) {
            const parent = controllerLeft ? controllerLeft?.object : handLeft ? handLeft?.object : null;
            if (parent) {
                setOutput(createPortal(menu, parent));
            } else {
                setOutput(null);
            }
            slowWritebackTimeout.current = setTimeout(() => {
                slowWritebackTimeout.current = null;
            }, 1000);
        }
    });

    return output;
}



export function Main() {
    return <ControllerMenu />;
}
