import React from 'react';
const { useEffect } = React;
import { useProperty } from '#VarvReact';



export function ColorForwarder({ setColor }) {
    const [color] = useProperty('color');

    useEffect(() => {
        setColor(color);
    }, [color]);
}
