import React from 'react';
const { useEffect, useRef } = React;
import { useEditor } from 'tldraw';

import { useGlobalEvents } from '#Spatialstrates .global-events';
import { shapeToConceptId } from '#Spatialstrates .projection-helpers';



// FIXME: This is not perfect, as it also detects creating selections as dragging
export function DragDetector() {
    const editor = useEditor();
    const { triggerEvent, subscribeEvent } = useGlobalEvents();
    const wasDragging = useRef(false);

    useEffect(() => {
        const detectDragging = editor.store.listen((change) => {
            const selectedShapeIds = editor.getSelectedShapeIds();
            const isDragging = editor.inputs.isDragging;

            if (isDragging && !wasDragging.current && selectedShapeIds.length > 0) {
                selectedShapeIds.forEach(async (shapeId) => {
                    const uuid = shapeToConceptId(shapeId);
                    if (!await VarvEngine.getConceptFromUUID(uuid)) return;
                    await VarvEngine.getConceptFromUUID(uuid).setPropertyValue(uuid, 'beingDragged', true);
                    triggerEvent('drag-start', { target: uuid });
                });
                wasDragging.current = true;
            } else if (!isDragging && wasDragging.current && selectedShapeIds.length > 0) {
                selectedShapeIds.forEach(async (shapeId) => {
                    const uuid = shapeToConceptId(shapeId);
                    if (!await VarvEngine.getConceptFromUUID(uuid)) return;
                    VarvEngine.getConceptFromUUID(uuid).setPropertyValue(uuid, 'beingDragged', false);
                    triggerEvent('drag-end', { target: uuid });
                });
                wasDragging.current = false;
            }
        });

        return () => {
            detectDragging();
        };
    }, [editor]);
}
