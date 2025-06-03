import React from 'react';

import { createMovable } from '#Spatialstrates .movable-helpers';
import { addSubMenu, addItemToSubMenu, MenuTitle, MenuButton, MenuSpacer } from '#Menu .default';



if (!window.moduleImageUploader) {
    window.moduleImageUploader = {
        active: true
    };

    addSubMenu('movables', 100, false);
    addItemToSubMenu('movables', 'title', <MenuTitle title="Menu" />, 0);
    addItemToSubMenu('movables', 'add-image-note', <MenuButton onClick={() => createMovable('Image')}>New Image</MenuButton>, 210);
    addItemToSubMenu('movables', 'spacer-items', <MenuSpacer />, 400);

    // Setup menu item
    addSubMenu('file-upload', 500, false);
    addItemToSubMenu('file-upload', 'title', <MenuTitle title="Upload Files" />, 0);
    addItemToSubMenu('file-upload', 'upload-image', <div className="upload-drop-zone" id="image-upload-drop-zone">Upload Image</div>, 1000);

    // Setup drop zone for image uploads
    const handleUploadImage = (file) => {
        const formData = new FormData();
        formData.append('file', file, file.name);

        const request = new XMLHttpRequest();
        request.open('POST', window.location.pathname);
        request.send(formData);

        return new Promise((resolve, reject) => {
            request.addEventListener('load', async (e) => {
                const asset = JSON.parse(request.responseText);
                await createMovable('Image', {
                    url: asset.fileName
                });
                resolve(asset);
            });
            request.addEventListener('error', (e) => {
                reject(new Error('Failed to upload image'));
            });
        });
    };

    const handleUploadFile = (file) => {
        if (file.type === 'image/jpeg' || file.type === 'image/png') {
            handleUploadImage(file);
        } else {
            alert('File type not supported.');
        }
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
                handleUploadFile(file, type);
            }
        });

        element.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = 'multiple';
            input.accept = type === 'image' ? 'image/jpeg, image/png' : '';
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
            if (element.id === 'image-upload-drop-zone') {
                activateDropZone(element, 'image');
            }
        }
    });
}
