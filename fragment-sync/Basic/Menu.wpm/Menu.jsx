import React from 'react';
const { useState, useEffect } = React;



if (!window.moduleMenu) {
    window.moduleMenu = {
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
        this.alwaysVisible = alwaysVisible;
        this.items = new Map();
    }

    addItem(item) {
        this.items.set(item.id, item);
    }
}

export const addSubMenu = (id, weight, alwaysVisible) => {
    if (window.moduleMenu.subMenus.has(id)) {
        return window.moduleMenu.subMenus.get(id);
    }
    const subMenu = new SubMenu(id, weight, alwaysVisible);
    window.moduleMenu.subMenus.set(id, subMenu);
    window.moduleMenu.menuNeedsUpdate = true;
    return subMenu;
};

export const addItemToSubMenu = (subMenuId, id, element, weight) => {
    const menuItem = new MenuItem(id, element, weight);
    const subMenu = window.moduleMenu.subMenus.get(subMenuId);
    if (!subMenu) {
        console.error(`SubMenu ${subMenuId} not found`);
        return;
    }
    subMenu.addItem(menuItem);
    window.moduleMenu.menuNeedsUpdate = true;
    return menuItem;
};

export function MenuTitle({ title }) {
    return <div className="title">{title}</div>;
}

export function MenuSpacer() {
    return <div className="spacer"></div>;
}

export function MenuButton({ onClick, toggled, children, className }) {
    return <button className={className} onClick={onClick} toggled={toggled ? 'true' : null} tabIndex="-1">{children}</button>;
}

/**
 * A heads-up display with buttons
 */
function Menu() {
    const [output, setOutput] = useState(null);

    const updateMenu = () => {
        const subMenus = Array.from(window.moduleMenu.subMenus.values());
        subMenus.sort((a, b) => a.weight - b.weight);

        setOutput(<div className="floating-menus">
            {subMenus.map(subMenu => {
                const items = Array.from(subMenu.items.values());
                items.sort((a, b) => a.weight - b.weight);
                return <div key={subMenu.id} id={subMenu.id} className={`floating-menu${subMenu.alwaysVisible ? ' always-visible' : ''}`}>
                    {items.map((item, index) => (React.cloneElement(item.element, { key: index })))}
                </div>;
            })}
        </div>);
    };

    useEffect(() => {
        if (window.moduleMenu.menuNeedsUpdate) {
            window.moduleMenu.menuNeedsUpdate = false;
            updateMenu();
        }
    });

    useEffect(() => {
        updateMenu();
    }, []);

    return output;
}



export function Main() {
    return <Menu />;
}
