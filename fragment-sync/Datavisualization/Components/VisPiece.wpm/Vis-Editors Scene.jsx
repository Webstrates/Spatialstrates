import React from 'react';
let { useState, useEffect, useMemo } = React;
import { SphereGeometry, MeshStandardMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { useProperty } from '#VarvReact';

import { Text } from '#Spatialstrates .text';
import { findAllFields } from '#VisModule .vis-composer';
import { getDatasetComponents } from '#VisModule .vis-component-manager';
import { VisButton, frameMaterial, frameMaterialDisabled, metalnessValue, roughnessValue } from '#VisPiece .vis-helpers';



const VEGA_LITE_COLORS = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#000000', '#bcbd22', '#17becf'
];
const VEGA_LITE_COLORS_HOVER = [
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5',
    '#c49c94', '#f7b6d2', '#222222', '#dbdb8d', '#9edae5'
];

let vegaLiteColorMaterials = {};
if (window.vegaLiteColorMaterials) {
    vegaLiteColorMaterials = window.vegaLiteColorMaterials;
} else {
    VEGA_LITE_COLORS.forEach((color, index) => {
        const material = new MeshStandardMaterial({
            color: color,
            metalness: metalnessValue,
            roughness: roughnessValue
        });
        vegaLiteColorMaterials[color] = material;

        const hoverMaterial = new MeshStandardMaterial({
            color: VEGA_LITE_COLORS_HOVER[index],
            metalness: metalnessValue,
            roughness: roughnessValue
        });
        vegaLiteColorMaterials[color + ':hover'] = hoverMaterial;
    });
    window.vegaLiteColorMaterials = vegaLiteColorMaterials;
}

export function EnumEditor({ options }) {
    const [content, setContent] = useProperty('content');

    return <>
        {options.enum.map((option, index) => {
            const x = index % 5;
            const y = Math.floor(index / 5);
            const offset = Math.floor(options.enum.length / 5) * 0.025;
            return <VisButton
                key={index}
                position={[0.09 * x, offset - 0.05 * y, 0]}
                active={content == option}
                callback={() => {
                    setContent(option);
                }}
                title={option}
            />;
        })}
    </>;
}

const sliderButtonGeometry = new SphereGeometry(0.5, 16, 16);
const sliderGeometry = new RoundedBoxGeometry(0.3, 0.01, 0.01, 1);
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
        <VisButton position={[0, 0, 0]} callback={() => updateValue(value - 0.1)} title="-" fontSizeMultiplicator={3} />
        <VisButton position={[0.4, 0, 0]} callback={() => updateValue(value + 0.1)} title="+" fontSizeMultiplicator={3} />

        <mesh geometry={sliderGeometry}
            material={frameMaterial}
            autoUpdateMatrix={false}
            position={[0.15 + 0.05, 0, 0]}>
        </mesh>
        <mesh geometry={sliderButtonGeometry}
            material={frameMaterial}
            autoUpdateMatrix={false}
            position={[value * 0.3 + 0.05, 0, 0]}
            scale={[0.03, 0.03, 0.03]}>
        </mesh>
        <Text
            position={[value * 0.3 + 0.05, 0.02, 0]}
            autoUpdateMatrix={false}
            textAlign="center"
            anchorX="center"
            anchorY="bottom"
            color="black"
            outlineWidth="5%"
            outlineColor="white"
            fontSize={0.01}>
            {content}
        </Text>
    </>;
}

const booleanToggleGeometry = new RoundedBoxGeometry(0.03, 0.03, 0.01);
export function BooleanEditor() {
    const [content, setContent] = useProperty('content');

    return <>
        <VisButton callback={() => {
            setContent(content == 'true' ? 'false' : 'true');
        }} active={content == 'true'} />
        <mesh geometry={booleanToggleGeometry}
            material={content == 'true' ? frameMaterial : frameMaterialDisabled}
            autoUpdateMatrix={false}
            position={[content == 'true' ? 0.02 : -0.022, 0, 0.005]}>
            <Text
                position={[0, 0.012, 0.0075]}
                autoUpdateMatrix={false}
                textAlign="center"
                anchorX="center"
                anchorY="center"
                color="white"
                fontSize={0.02}>
                {content == 'true' ? 'I' : 'O'}
            </Text>
        </mesh>
    </>;
}

export function ColorEditor() {
    const [content, setContent] = useProperty('content');

    return <>
        {VEGA_LITE_COLORS.map((color, index) => {
            const x = index % 5;
            const y = Math.floor(index / 5);
            return <VisButton
                key={index}
                position={[0.09 * x, 0.025 - 0.05 * y, 0]}
                active={content == color}
                callback={() => {
                    setContent(color);
                }}
                materialPrimary={vegaLiteColorMaterials[color]}
                materialHovered={vegaLiteColorMaterials[color + ':hover']}
            />;
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
            const offset = Math.floor(datasets.length / 5) * 0.025;
            return <VisButton
                key={index}
                position={[0.09 * x, offset - 0.05 * y, 0]}
                active={content == dataset.id}
                callback={() => {
                    setContent(dataset.id);
                }}
                title={dataset.name}
            />;
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
            return <VisButton
                key={index}
                position={[-0.09 * x, - 0.05 * y, 0]}
                active={axis == option}
                callback={() => callback(option)}
                title={option}
            />;
        })}
    </>;
}
