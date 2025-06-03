import React from 'react';
const { useEffect } = React;
import { useEditor } from 'tldraw';
import { useProperty } from '#VarvReact';



const TITLE_TEXT_ID = 'shape:space-title';

export function TitleText() {
    const editor = useEditor();
    const [name] = useProperty('name');

    useEffect(() => {
        if (!editor) return;

        editor.createShape({
            id: TITLE_TEXT_ID,
            type: 'text',
            opacity: 0.25,
            props: {
                text: name || '',
                textAlign: 'middle',
                font: 'sans',
                color: 'black'
            }
        });

        editor.sendToBack([TITLE_TEXT_ID]);

        editor.updateShape({
            id: TITLE_TEXT_ID,
            isLocked: true
        });

        return () => {
            editor.updateShape({
                id: TITLE_TEXT_ID,
                isLocked: false
            });
            editor.deleteShape('space-title');
        };
    }, [editor, name]);
}
