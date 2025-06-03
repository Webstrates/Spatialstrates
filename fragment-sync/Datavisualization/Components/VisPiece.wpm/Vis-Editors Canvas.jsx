import React from 'react';
let { useState, useEffect, useMemo } = React;
import { stopEventPropagation } from 'tldraw';
import { useProperty } from '#VarvReact';

import { findAllFields } from '#VisModule .vis-composer';
import { getDatasetComponents } from '#VisModule .vis-component-manager';



const VEGA_LITE_COLORS = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#000000', '#bcbd22', '#17becf'
];
const VEGA_LITE_COLORS_HOVER = [
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d2', '#222222', '#dbdb8d', '#9edae5'
];

export function EnumEditor({ options }) {
    const [content, setContent] = useProperty('content');

    return <>
        {options.enum.map((option, index) => {
            const x = index % 5;
            const y = Math.floor(index / 5);
            return <div className={`button ${content == option ? 'active' : ''}`}
                key={index}
                style={{
                    right: "-52px",
                    top: "50%",
                    transform: `translate(50%, -50%) translate(${x * 105}%, ${y * 105}%) translateY(-${Math.floor((options.enum.length - 1) / 5) * 50}%)`
                }}
                onPointerDown={(e) => {
                    stopEventPropagation(e);
                    setContent(option);
                }}>{option}</div>;
        })}
    </>;
}

export function NumberEditor({ options }) {
    const [content, setContent] = useProperty('content');
    const [value, setValue] = useState(0);

    const normalize = (value) => {
        // normalize value using options.min and options.max
        const min = options.min || 0;
        const max = options.max || 1;
        return Math.min(1, Math.max(0, (value - min) / (max - min)));
    }

    useEffect(() => {
        const normalizedValue = normalize(content);
        setValue(normalizedValue);
    }, [content]);

    const updateValue = (newValue) => {
        const sanitizedValue = Math.min(1, Math.max(0, newValue));
        const min = options.min || 0;
        const max = options.max || 1;
        const value = min + sanitizedValue * (max - min);
        const roundedValue = Math.round(value * 100) / 100;
        setContent(roundedValue);
    };

    return <>
        <input className="button-slider" type="range" min="0" max="1" step="0.01" value={value}
            onChange={(e) => updateValue(parseFloat(e.target.value))}
            style={{
                right: "-96px",
                top: "50%",
                transform: `translate(50%, -50%)`
            }} />
    </>;
}

export function BooleanEditor() {
    const [content, setContent] = useProperty('content');

    return <div className={`button ${content == 'true' ? 'active' : ''}`}
        style={{
            right: "-52px",
            top: "50%",
            transform: `translate(50%, -50%)`,
            backgroundColor: content == 'true' ? '' : '#aaa'
        }}
        onPointerDown={(e) => {
            stopEventPropagation(e);
            setContent(content == 'true' ? 'false' : 'true');
        }}>{content == 'true' ? 'True' : 'False'}</div>;
}

export function ColorEditor() {
    const [content, setContent] = useProperty('content');

    return <>
        {VEGA_LITE_COLORS.map((color, index) => {
            const x = index % 5;
            const y = Math.floor(index / 5);
            return <div className={`button ${content == color ? 'active' : ''}`}
                key={index}
                style={{
                    right: "-52px",
                    top: "50%",
                    transform: `translate(50%, -50%) translate(${x * 105}%, ${y * 105}%) translateY(-${Math.floor((VEGA_LITE_COLORS.length - 1) / 5) * 50}%)`,
                    backgroundColor: color
                }}
                onPointerDown={(e) => {
                    stopEventPropagation(e);
                    setContent(color);
                }}></div>;
        })}
    </>;

};

export function FieldEditor() {
    const [enumOptions, setEnumOptions] = useState({ type: 'enum', enum: [] });

    useEffect(() => {
        const asyncCallback = async () => {
            const fields = await findAllFields();
            setEnumOptions({
                type: 'enum',
                enum: fields
            });
        };
        asyncCallback();
    }, []);

    return <EnumEditor options={enumOptions} type="fieldEditor" />;
}

export function DatasetEditor() {
    const [content, setContent] = useProperty('content');

    const datasets = useMemo(() => getDatasetComponents(), []);

    return <>
        {datasets.map((dataset, index) => {
            const x = index % 5;
            const y = Math.floor(index / 5);
            return <div className={`button ${content == dataset.id ? 'active' : ''}`}
                key={index}
                style={{
                    right: "-52px",
                    top: "50%",
                    transform: `translate(50%, -50%) translate(${x * 105}%, ${y * 105}%) translateY(-${Math.floor((datasets.length - 1) / 5) * 50}%)`
                }}
                onPointerDown={(e) => {
                    stopEventPropagation(e);
                    setContent(dataset.id);
                }}>{dataset.name}</div>;
        })}
    </>;

}

const axisOptions = ['color', 'z', 'y', 'x'];
export function AxisEditor() {
    const [path, setPath] = useProperty('path');
    const [axis, setAxis] = useState();

    useEffect(() => {
        if (!path) return;
        if (path.startsWith('encoding.x')) setAxis('x');
        if (path.startsWith('encoding.y')) setAxis('y');
        if (path.startsWith('encoding.z')) setAxis('z');
        if (path.startsWith('encoding.color')) setAxis('color');
        if (path.startsWith('encoding.size')) setAxis('size');
    }, [path]);

    const callback = (option) => {
        setAxis(option);
        const newPath = path.replace(/encoding\.(x|y|z|color|size)/, 'encoding.' + option);
        setPath(newPath);
    };

    return <>
        {axisOptions.map((option, index) => {
            const x = index % 5;
            const y = Math.floor(index / 5);
            return <div className={`button ${axis == option ? 'active' : ''}`}
                key={index}
                style={{
                    left: "-52px",
                    top: "50%",
                    transform: `translate(-50%, -50%) translate(-${x * 105}%, ${y * 105}%)`
                }}
                onPointerDown={(e) => {
                    stopEventPropagation(e);
                    callback(option);
                }}>{option}</div>;
        })}
    </>;
}
