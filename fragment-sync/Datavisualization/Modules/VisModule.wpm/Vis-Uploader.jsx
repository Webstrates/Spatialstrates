import React from 'react';

import { addSubMenu, addItemToSubMenu, MenuTitle, MenuSpacer } from '#Menu .default';
import { SPEC_COMPONENT_TYPE, DATASET_COMPONENT_TYPE } from '#VisModule .vis-helpers';
import { createSpecVisComponent, createDatasetVisComponent } from '#VisModule .vis-component-manager';



if (!window.moduleVisComponentUploader) {
    window.moduleVisComponentUploader = {
        active: true
    };

    // Setup menu item
    addSubMenu('file-upload', 500, false);
    addItemToSubMenu('file-upload', 'title', <MenuTitle title="Upload Files" />, 0);
    addItemToSubMenu('file-upload', 'upload-spec', <div className="upload-drop-zone" id="spec-upload-drop-zone">Upload Vega-Lite Spec</div>, 100);
    addItemToSubMenu('file-upload', 'upload-dataset', <div className="upload-drop-zone" id="dataset-upload-drop-zone">Upload Dataset</div>, 200);
    addItemToSubMenu('file-upload', 'spacer1', <MenuSpacer />, 300);

    // TODO: This is not super robust
    const convertCSVtoJSON = (csv) => {
        const lines = csv.split('\n');
        const result = [];
        const headers = lines[0].split(',');
        for (let i = 1; i < lines.length; i++) {
            const obj = {};
            const currentline = lines[i].split(',');
            for (let j = 0; j < headers.length; j++) {
                const value = currentline[j];
                obj[headers[j]] = isNaN(value) ? value : parseFloat(value);
            }
            result.push(obj);
        }
        return JSON.stringify(result, null, 4);
    };

    const convertFileName = (fileName) => {
        return fileName.split('.').slice(0, -1).join('.').replace(/\s+/g, '_');
    };


    const handleUploadFile = (file, type) => {
        const reader = new FileReader();
        if (file.type === 'application/json') {
            reader.onload = (e) => {
                const content = e.target.result;
                const id = convertFileName(file.name);
                if (type === SPEC_COMPONENT_TYPE) {
                    createSpecVisComponent(content, id);
                } else if (type === DATASET_COMPONENT_TYPE) {
                    createDatasetVisComponent(content, id);
                }
            };
            reader.readAsText(file);
        } else if (file.type === 'text/csv') {
            reader.onload = (e) => {
                const content = e.target.result;
                const id = convertFileName(file.name);
                const dataset = convertCSVtoJSON(content);
                createDatasetVisComponent(dataset, id);
            };
            reader.readAsText(file);
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
            input.accept = type === SPEC_COMPONENT_TYPE ? 'application/json' : 'application/json, text/csv';
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
            if (element.id === 'spec-upload-drop-zone') {
                activateDropZone(element, SPEC_COMPONENT_TYPE);
            } else if (element.id === 'dataset-upload-drop-zone') {
                activateDropZone(element, DATASET_COMPONENT_TYPE);
            }
        }
    });
}
