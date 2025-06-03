import React from 'react';

import { createMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle } from '#Menu .default';



if (!window.moduleMoleculeUploader) {
    window.moduleMoleculeUploader = {
        active: true
    };

    // Setup menu item
    addSubMenu('file-upload', 500, false);
    addItemToSubMenu('file-upload', 'title', <MenuTitle title="Upload Files" />, 0);
    addItemToSubMenu('file-upload', 'upload-molecule', <div className="upload-drop-zone" id="molecule-upload-drop-zone">Upload PDB Molecule</div>, 1300);

    // Setup drop zone for model uploads
    const handleUploadMolecule = (file) => {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const request = new XMLHttpRequest();
        request.open('POST', window.location.pathname);
        request.send(formData);

        return new Promise((resolve, reject) => {
            request.addEventListener('load', async () => {
                const asset = JSON.parse(request.responseText);
                await createMovable('Molecule', {
                    url: asset.fileName
                })
                resolve(asset);
            });
            request.addEventListener('error', (e) => {
                reject(new Error('Failed to upload molecule'));
            });
        });
    };

    const handleUploadFile = (file) => {
        // HACK: Cannot check if the file is valid yet
        // if (file.type === 'model/pdb') {
            handleUploadMolecule(file);
        // } else {
        //     alert('File type not supported.');
        // }
    };

    const activateDropZone = (element, type) => {
        if (element.__uploadDropZoneActivated) return;

        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('upload-drop-zone--over');
        });

        element.addEventListener('dragleave', () => {
            element.classList.remove('upload-drop-zone--over');
        });

        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('upload-drop-zone--over');
            const files = e.dataTransfer.files;
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                handleUploadFile(file);
            }
        });

        element.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = 'multiple';
            input.accept = '.pdb';
            input.onchange = (e) => {
                for (let i = 0; i < e.target.files.length; i++) {
                    handleUploadFile(e.target.files[i], type);
                }
            };
            input.click();
        });

        element.__uploadDropZoneActivated = true;
    };

    cQuery(document.body).liveQuery('.upload-drop-zone', {
        'added': (element) => {
            if (element.id === 'molecule-upload-drop-zone') {
                activateDropZone(element, 'model');
            }
        }
    });
}
