import React from 'react';
import { addSubMenu, addItemToSubMenu, MenuTitle } from '#Menu .default';
import { devicePositionWithOffset, deviceRotation } from '#Spatialstrates .transform-helpers';



if (!window.moduleImageUploader) {
    window.moduleImageUploader = {
        active: true
    };

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
                const [x, y, z] = devicePositionWithOffset(window.moduleDeviceManager.camera, 0.5);
                const [rx, ry, rz] = deviceRotation(window.moduleDeviceManager.camera);

                const imageConcept = await VarvEngine.getConceptFromType('Image');
                imageConcept.create(null, {
                    url: asset.fileName,
                    position: [x, y, z],
                    rotation: [rx, ry, rz]
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
    };

    cQuery(document.body).liveQuery('.upload-drop-zone', {
        'added': (element) => {
            if (element.id === 'image-upload-drop-zone') {
                activateDropZone(element, 'image');
            }
        }
    });
}
