import React from 'react';
const { useMemo, useEffect, useState, useRef } = React;
import { ErrorBoundary } from 'react-error-boundary';
import { Box3, Vector3 } from 'three';
import { USDLoader } from 'three/addons/loaders/USDLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { useGLTF } from '@react-three/drei';
import { SplatMesh } from '@sparkjsdev/spark';



// Initialize global model cache
if (!window.modelRendererCache) {
    window.modelRendererCache = {
        usdz: new Map(),
        fbx: new Map(),
        splat: new Map()
    };
}

function useOriginalBounds(scene) {
    // Store the original bounding box when the scene first loads
    const [originalBounds, setOriginalBounds] = useState(null);
    const sceneRef = useRef(null);

    useEffect(() => {
        // Reset bounds when scene changes (new model loaded)
        if (scene !== sceneRef.current) {
            sceneRef.current = scene;
            if (scene) {
                const box = new Box3().setFromObject(scene);
                const modelSize = new Vector3();
                const center = new Vector3();
                box.getSize(modelSize);
                box.getCenter(center);
                setOriginalBounds({ modelSize, center });
            } else {
                setOriginalBounds(null);
            }
        }
    }, [scene]);

    return originalBounds;
}

function useScaleAndOffset(scene, size) {
    const originalBounds = useOriginalBounds(scene);

    return useMemo(() => {
        if (!originalBounds) return { scale: 1, offset: [0, 0, 0] };

        const { modelSize, center } = originalBounds;

        // Calculate scale to fit within the target size
        const targetSize = new Vector3(size[0], size[1], size[2]);
        const scaleX = targetSize.x / modelSize.x;
        const scaleY = targetSize.y / modelSize.y;
        const scaleZ = targetSize.z / modelSize.z;
        const uniformScale = Math.min(scaleX, scaleY, scaleZ);

        // Calculate offset to center the model (move center of bounding box to origin)
        const offset = [-center.x, -center.y, -center.z];

        return { scale: uniformScale, offset };
    }, [originalBounds, size[0], size[1], size[2]]);
}

function enableShadows(object) {
    object?.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
}

function useUSDZModel(url) {
    const [model, setModel] = useState(null);

    useEffect(() => {
        let isMounted = true;
        setModel(null);

        const loadUSDZ = async () => {
            try {
                // Check cache first
                if (window.modelRendererCache.usdz.has(url)) {
                    const cachedModel = window.modelRendererCache.usdz.get(url);
                    if (isMounted) setModel(cachedModel.clone());
                    return;
                }

                const loader = new USDLoader();
                const loadedModel = await loader.loadAsync(url);

                // Store in cache
                window.modelRendererCache.usdz.set(url, loadedModel);

                if (isMounted) setModel(loadedModel.clone());
            } catch (error) {
                console.error('Error loading USDZ file:', error);
            }
        };

        loadUSDZ();

        return () => {
            isMounted = false;
        };
    }, [url]);

    return model;
}

function useFBXModel(url) {
    const [model, setModel] = useState(null);

    useEffect(() => {
        let isMounted = true;
        setModel(null);

        const loadFBX = async () => {
            try {
                // Check cache first
                if (window.modelRendererCache.fbx.has(url)) {
                    const cachedModel = window.modelRendererCache.fbx.get(url);
                    if (isMounted) setModel(cachedModel.clone());
                    return;
                }

                const loader = new FBXLoader();
                const loadedModel = await loader.loadAsync(url);

                // Store in cache
                window.modelRendererCache.fbx.set(url, loadedModel);

                if (isMounted) setModel(loadedModel.clone());
            } catch (error) {
                console.error('Error loading FBX file:', error);
            }
        };

        loadFBX();

        return () => {
            isMounted = false;
        };
    }, [url]);

    return model;
}



function ScaledGLTFModel({ url, size }) {
    const { scene } = useGLTF(url);
    const scaleAndOffset = useScaleAndOffset(scene, size);

    const preparedScene = useMemo(() => {
        if (!scene) return null;
        // Clone to avoid modifying the cached original
        const clonedScene = scene.clone();
        enableShadows(clonedScene);
        return clonedScene;
    }, [scene]);

    if (!preparedScene) return null;

    return (
        <group scale={scaleAndOffset.scale}>
            <group position={scaleAndOffset.offset}>
                <primitive object={preparedScene} />
            </group>
        </group>
    );
}

function ScaledUSDZModel({ url, size }) {
    const scene = useUSDZModel(url);
    const scaleAndOffset = useScaleAndOffset(scene, size);

    const preparedScene = useMemo(() => {
        if (!scene) return null;
        // USDZ models are loaded fresh each time, no need to clone
        enableShadows(scene);
        return scene;
    }, [scene]);

    if (!preparedScene) return null;

    return (
        <group scale={scaleAndOffset.scale}>
            <group position={scaleAndOffset.offset}>
                <primitive object={preparedScene} />
            </group>
        </group>
    );
}

function ScaledSplatModel({ url, size }) {
    const groupRef = useRef();
    const splatRef = useRef(null);
    const [splatBounds, setSplatBounds] = useState(() => {
        // Initialize with cached bounds if available
        if (window.modelRendererCache.splat.has(url)) {
            return window.modelRendererCache.splat.get(url);
        }
        return null;
    });

    useEffect(() => {
        if (!groupRef.current) return;

        const splatMesh = new SplatMesh({
            url: url,
            editable: false,
            onLoad: (mesh) => {
                try {
                    // Only calculate bounds if not already cached
                    if (!window.modelRendererCache.splat.has(url)) {
                        const box = mesh.getBoundingBox(true);
                        const modelSize = new Vector3();
                        const center = new Vector3();
                        box.getSize(modelSize);
                        box.getCenter(center);
                        const bounds = { modelSize, center };

                        // Store bounds in cache
                        window.modelRendererCache.splat.set(url, bounds);
                        setSplatBounds(bounds);
                    }
                } catch (error) {
                    console.warn('Could not calculate splat bounding box:', error);
                }
            }
        });

        splatRef.current = splatMesh;
        groupRef.current.add(splatMesh);

        return () => {
            groupRef.current?.remove(splatMesh);
            splatMesh.dispose?.();
            splatRef.current = null;
        };
    }, [url]);

    const scaleAndOffset = useMemo(() => {
        if (!splatBounds) return { scale: 1, offset: [0, 0, 0] };

        const { modelSize, center } = splatBounds;
        const targetSize = new Vector3(size[0], size[1], size[2]);
        const scaleX = targetSize.x / modelSize.x;
        const scaleY = targetSize.y / modelSize.y;
        const scaleZ = targetSize.z / modelSize.z;
        const uniformScale = Math.min(scaleX, scaleY, scaleZ);

        const offset = [-center.x, -center.y, -center.z];

        return { scale: uniformScale, offset };
    }, [splatBounds, size[0], size[1], size[2]]);

    // Apply scale and offset to the splat mesh when bounds are calculated
    useEffect(() => {
        if (splatRef.current && splatBounds) {
            splatRef.current.position.set(...scaleAndOffset.offset);
        }
    }, [scaleAndOffset, splatBounds]);

    return <group scale={scaleAndOffset.scale} ref={groupRef} />;
}

function ScaledFBXModel({ url, size }) {
    const scene = useFBXModel(url);
    const scaleAndOffset = useScaleAndOffset(scene, size);

    const preparedScene = useMemo(() => {
        if (!scene) return null;
        // FBX models are loaded fresh each time, no need to clone
        enableShadows(scene);
        return scene;
    }, [scene]);

    if (!preparedScene) return null;

    return (
        <group scale={scaleAndOffset.scale}>
            <group position={scaleAndOffset.offset}>
                <primitive object={preparedScene} />
            </group>
        </group>
    );
}

const EXTENSION_TO_MODEL = {
    '.gltf': ScaledGLTFModel,
    '.glb': ScaledGLTFModel,
    '.usdz': ScaledUSDZModel,
    '.ply': ScaledSplatModel,
    '.spz': ScaledSplatModel,
    '.fbx': ScaledFBXModel
};

export function ModelRenderer({ url, size = [0.5, 0.5, 0.5] }) {
    const lowerUrl = url?.toLowerCase();
    if (!lowerUrl) return null;

    const extension = Object.keys(EXTENSION_TO_MODEL).find(ext => lowerUrl.endsWith(ext));
    if (!extension) {
        console.warn('Unsupported model format for URL:', url);
        return null;
    }

    const ModelComponent = EXTENSION_TO_MODEL[extension];

    return (
        <ErrorBoundary key={url} fallback={<mesh castShadow receiveShadow>
            <boxGeometry args={[size[0], size[1], size[2]]} />
            <meshStandardMaterial color={'#ccc'} />
        </mesh>}>
            <ModelComponent url={url} size={size} />
        </ErrorBoundary>
    );
}
