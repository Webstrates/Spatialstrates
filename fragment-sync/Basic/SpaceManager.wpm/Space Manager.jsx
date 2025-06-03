import React from 'react';
const { useState } = React;
import { Varv, useProperty } from '#VarvReact';

import { deleteMovable } from '#Spatialstrates .movable-helpers';
import { Dialog } from '#Dialog .default';



function SpaceRenamer() {
    const [name, setName] = useProperty('name');

    return <label>
        Rename Space
        <input value={name ? name : ''} onChange={e => setName(e.target.value)} title='Rename Space' />
    </label>;
}

function SpaceColorChanger() {
    const [color, setColor] = useProperty('color');

    return <label>
        Change Space Color
        <select value={color} onChange={e => setColor(e.target.value)} title='Change Space Color'>
            <option value="">Default</option>
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="yellow">Yellow</option>
            <option value="purple">Purple</option>
            <option value="orange">Orange</option>
            <option value="pink">Pink</option>
        </select>
    </label>;
}

function SpaceSelector({ selectSpace }) {
    const [name] = useProperty('name');
    const [color] = useProperty('color');
    const [currentSpace, setCurrentSpace] = useProperty('locationHash');
    const [uuid] = useProperty('concept::uuid');

    const deleteSpace = async (e) => {
        e.stopPropagation();
        if (currentSpace == uuid) setCurrentSpace('');
        const movables = await VarvEngine.getConceptFromType('Space').getPropertyValue(uuid, 'movables');
        for (const movable of movables) {
            await deleteMovable(movable);
        }
        await VarvEngine.getConceptFromType('Space').delete(uuid);
    };

    return <div className="space"
        local={currentSpace == uuid ? 'true' : null}
        color={color}
        onClick={() => selectSpace(uuid)}
        title={'Select Space ' + name}>
        <span className="space-name">{name}</span>
        <span className="delete-icon material-icons-outlined" onClick={deleteSpace} title="Delete User">delete</span>
    </div>;
}

function SpaceManagerMenu() {
    const [visible, setVisible] = useState(false);
    const [space, setSpace] = useProperty('locationHash');

    const addSpace = async () => {
        setSpace(await VarvEngine.getConceptFromType('Space').create(null, { name: 'New Space' }));
    };

    const selectSpace = (spaceId) => {
        setSpace(spaceId);
    };

    return <>
        <Dialog className="space-manager" visible={visible} setVisible={setVisible}>
            <div className="space-headline">Space Manager</div>
            <div className="space-subtitle">
                <span style={{ marginRight: '10px' }}>Space Selection</span>
                <button title="Add Space" onClick={addSpace}>Add Space</button></div>
            <div className="space-list">
                <Varv concept="Space">
                    <SpaceSelector selectSpace={selectSpace} />
                </Varv>
            </div>
            <Varv property="locationHash">
                <div className="space-subtitle">Space Settings</div>
                <div className="space-menu">
                    <SpaceRenamer />
                    <SpaceColorChanger />
                </div>
            </Varv>
        </Dialog>

        <div className="space-manager-button" onClick={() => setVisible(true)}>Space Manager</div>
    </>;
}

function SpaceTab() {
    const [currentSpace, setCurrentSpace] = useProperty('locationHash');
    const [uuid] = useProperty('concept::uuid');
    const [name] = useProperty('name');
    const [color] = useProperty('color');

    return <div
        className="space-tab"
        local={currentSpace == uuid ? 'true' : null}
        color={color}
        onClick={() => setCurrentSpace(uuid)}>
        {name}
    </ div>;
}

function NewSpaceTab() {
    const [currentSpace, setCurrentSpace] = useProperty('locationHash');

    const addSpace = async () => {
        setCurrentSpace(await VarvEngine.getConceptFromType('Space').create(null, { name: 'New Space' }));
    };

    return <div className="space-tab" onClick={addSpace}>+</div>;
}



function SpaceManager() {
    const [currentView, setCurrentView] = useProperty('currentView');

    return <>
        <div className="space-view-toggle" title="Toggle View" onClick={() => setCurrentView(currentView === '3D' ? '2D' : '3D')}>Toggle View ({currentView})</div>
        <SpaceManagerMenu />
        <div className="space-tabs">
            <Varv concept="Space">
                <SpaceTab />
            </Varv>
            <NewSpaceTab />
        </div>
    </>;
}



export function Main() {
    return <Varv concept="SpaceManager">
        <SpaceManager />
    </Varv>;
}
