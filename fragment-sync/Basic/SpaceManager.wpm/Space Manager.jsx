import React from 'react';
const { useState, useRef, useEffect } = React;
import { Varv, useProperty } from '#VarvReact';

import { deleteMovable } from '#Spatialstrates .movable-helpers';
import { Dialog } from '#Dialog .default';



function SpaceRenamer() {
    const [name, setName] = useProperty('name');

    return <label>
        Space Name
        <input value={name ? name : ''} onChange={e => setName(e.target.value)} title='Change Space Name' />
    </label>;
}

function SpaceColorChanger() {
    const [color, setColor] = useProperty('color');

    return <label>
        Space Color
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

function EnvironmentSelector({ updateSelectValue }) {
    const [name] = useProperty('name');
    const [uuid] = useProperty('concept::uuid');

    useEffect(() => {
        updateSelectValue();
    }, [uuid]);

    return <option value={uuid}>{name}</option>;
}

function EnvironmentRenamer() {
    const [name, setName] = useProperty('name');

    return <label>
        Environment Name
        <input value={name ? name : ''} onChange={e => setName(e.target.value)} title='Change Environment Name' />
    </label>;
}

function SpaceEnvironmentMenu() {
    const [environment, setEnvironment] = useProperty('environment');
    const selectRef = useRef();

    const handleUploadEnvironment = (file) => {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const request = new XMLHttpRequest();
        request.open('POST', window.location.pathname);
        request.send(formData);

        return new Promise((resolve, reject) => {
            request.addEventListener('load', async () => {
                const asset = JSON.parse(request.responseText);
                const newEnvironment = await VarvEngine.getConceptFromType('Environment').create(null, {
                    name: asset.fileName,
                    url: asset.fileName
                });
                setEnvironment(newEnvironment);
                resolve(asset);
            });
            request.addEventListener('error', (e) => {
                reject(new Error('Failed to upload model'));
            });
        });
    };

    const addEnvironment = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.glb';
        input.onchange = (e) => {
            for (let i = 0; i < e.target.files.length; i++) {
                handleUploadEnvironment(e.target.files[i]);
            }
        };
        input.click();
    };

    const deleteEnvironment = async () => {
        await VarvEngine.getConceptFromType('Environment').delete(environment);
        setEnvironment('');
    };

    return <>
        <label>
            Environment
            <select onChange={e => setEnvironment(e.target.value || '')} title="Select Environment" ref={selectRef} value={environment}>
                <option value=''>None</option>
                <Varv concept="Environment">
                    <EnvironmentSelector updateSelectValue={() => {
                        selectRef.current.value = environment || '';
                    }} />
                </Varv>
            </select>
        </label>
        <Varv property="environment">
            <EnvironmentRenamer />
        </Varv>
        <button onClick={addEnvironment} title="Add Environment">Add Environment</button>
        {environment ? <button onClick={deleteEnvironment} title="Delete Environment" className="red">Delete Environment</button> : null}
    </>;
}

function SpaceManagerMenu() {
    const [visible, setVisible] = useState(false);
    const [, setSpace] = useProperty('locationHash');

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
                <div className="space-menu">
                    <SpaceEnvironmentMenu />
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
    const [, setCurrentSpace] = useProperty('locationHash');

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
