import React from 'react';
const { useRef } = React;
import { Varv, useProperty } from '#VarvReact';

import { createMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle } from '#Menu .default';



function ModelUploader() {
    const elementRef = useRef(null);
    const [models, setModels] = useProperty('models');

    const handleUploadModel = (file) => {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const request = new XMLHttpRequest();
        request.open('POST', window.location.pathname);
        request.send(formData);

        return new Promise((resolve, reject) => {
            request.addEventListener('load', async () => {
                const asset = JSON.parse(request.responseText);
                if (!models.includes(asset.fileName)) {
                    setModels([...models, asset.fileName]);
                }
                await createMovable('Model', {
                    url: asset.fileName
                });
                resolve(asset);
            });
            request.addEventListener('error', (e) => {
                reject(new Error('Failed to upload model'));
            });
        });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('upload-drop-zone--over');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('upload-drop-zone--over');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('upload-drop-zone--over');
        const files = e.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            handleUploadModel(file);
        }
    };

    const handleClick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = 'multiple';
        input.accept = '.glb,.usdz,.ply,.spz,.fbx';
        input.onchange = (e) => {
            for (let i = 0; i < e.target.files.length; i++) {
                handleUploadModel(e.target.files[i]);
            }
        };
        input.click();
    };

    return (
        <div
            className="upload-drop-zone"
            id="model-upload-drop-zone"
            ref={elementRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            Upload 3D Model
        </div>
    );
}

if (!window.moduleModelUploader) {
    window.moduleModelUploader = {
        active: true
    };

    // Setup menu item
    addSubMenu('file-upload', 500, false);
    addItemToSubMenu('file-upload', 'title', <MenuTitle title="Upload Files" />, 0);
    addItemToSubMenu('file-upload', 'upload-model', <Varv concept="ModelManager">
        <ModelUploader />
    </Varv>, 1200);
}
