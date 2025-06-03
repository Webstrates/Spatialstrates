import React from 'react';
const { useEffect, useState, useRef } = React;
import { ErrorBoundary } from 'react-error-boundary';



export function useDynamicModules(selector) {
    const [modules, setModules] = useState([]);
    const fragmentsMap = useRef(new Map());
    const modulesMap = useRef(new Map());
    const handlersMap = useRef(new Map());

    useEffect(() => {
        if (!selector) return;
        const query = cQuery(document).liveQuery(selector, {
            added: async (fragmentElement) => {
                const fragment = Fragment.one(fragmentElement);
                if (!fragment) return;

                fragmentsMap.current.set(fragment.uuid, fragment);

                // Add change handler for this fragment
                const updateHandler = async () => {
                    try {
                        const module = await fragment.require();
                        modulesMap.current.set(fragment.uuid, module['Main']);
                        // Update modules state with all current modules
                        setModules(Array.from(modulesMap.current.values()).filter(Boolean));
                    } catch (error) {
                        console.error(`Error updating module for fragment ${fragment.uuid}:`, error);
                    }
                };

                // Store the handler to be able to remove it later
                handlersMap.current.set(fragment.uuid, updateHandler);

                // Register the handler with the fragment
                fragment.registerOnFragmentChangedHandler(updateHandler);

                // Initial load of the module
                updateHandler();
            },
            removed: (fragmentElement) => {
                const fragment = Fragment.one(fragmentElement);
                if (!fragment) return;

                // Clean up handler
                const handler = handlersMap.current.get(fragment.uuid);
                if (handler) {
                    fragment.unRegisterOnFragmentChangedHandler(handler);
                    handlersMap.current.delete(fragment.uuid);
                }

                // Remove from maps
                fragmentsMap.current.delete(fragment.uuid);
                modulesMap.current.delete(fragment.uuid);

                // Update state
                setModules(Array.from(modulesMap.current.values()).filter(Boolean));
            }
        });

        return () => {
            // Clean up all handlers when unmounting
            for (const [id, fragment] of fragmentsMap.current.entries()) {
                const handler = handlersMap.current.get(id);
                if (handler) {
                    fragment.unRegisterOnFragmentChangedHandler(handler);
                }
            }
            handlersMap.current.clear();
            modulesMap.current.clear();
            fragmentsMap.current.clear();
            query.stop();
        };
    }, []);

    return modules;
}



function DynamicComponent({ fragment }) {
    const [component, setComponent] = useState(null);
    const boundaryRef = useRef(null);

    const updateComponent = async () => {
        if (!fragment) return;
        const module = await fragment.require();
        const Main = module['Main'];
        setComponent(<Main />);
        boundaryRef.current?.resetErrorBoundary();
    };

    useEffect(() => {
        fragment?.registerOnFragmentChangedHandler(updateComponent);
        updateComponent();

        return () => {
            fragment?.unRegisterOnFragmentChangedHandler(updateComponent);
        };
    }, [fragment]);

    return <ErrorBoundary ref={boundaryRef} fallback={null}>
        {component}
    </ErrorBoundary>;
}

// This is a component that dynamically loads components from fragments
export function DynamicComponents({ selector }) {
    const [output, setOutput] = useState([]);
    const fragmentsMap = useRef(new Map());

    useEffect(() => {
        if (!selector) return;
        const query = cQuery(document).liveQuery(selector, {
            added: async (fragmentElement) => {
                const fragment = Fragment.one(fragmentElement);
                if (!fragment) return;

                fragmentsMap.current.set(fragment.uuid, fragment);
                setOutput(Array.from(fragmentsMap.current.entries()));
            },
            removed: (fragmentElement) => {
                const fragment = Fragment.one(fragmentElement);
                if (!fragment) return;

                fragmentsMap.current.delete(fragment.uuid);
                setOutput(Array.from(fragmentsMap.current.entries()));
            }
        });
        return () => {
            query.stop();
        };
    }, []);

    return output.map((entry) => {
        const [id, fragment] = entry;
        return <DynamicComponent fragment={fragment} key={fragment.uuid} />;
    });
}
