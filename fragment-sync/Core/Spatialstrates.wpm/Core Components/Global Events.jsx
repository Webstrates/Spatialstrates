import React from 'react';
const { useRef, useContext, createContext, useCallback, useMemo } = React;



// Send messages between components
if (!window.GlobalEventContext) window.GlobalEventContext = createContext();

export const GlobalEventProvider = ({ children }) => {
    const eventsRef = useRef({});

    const triggerEvent = useCallback((eventName, data) => {
        if (eventsRef.current[eventName]) {
            eventsRef.current[eventName].forEach(callback => callback(data));
        }
    }, []);

    const subscribeEvent = useCallback((eventName, callback) => {
        if (!eventsRef.current[eventName]) {
            eventsRef.current[eventName] = [];
        }
        eventsRef.current[eventName].push(callback);

        // Return unsubscribe function
        return () => {
            eventsRef.current[eventName] = eventsRef.current[eventName].filter(cb => cb !== callback);
        };
    }, []);

    // Memoize context value to avoid unnecessary rerenders
    const value = useMemo(() => ({
        triggerEvent,
        subscribeEvent,
    }), [triggerEvent, subscribeEvent]);

    return (
        <GlobalEventContext.Provider value={value}>
            {children}
        </GlobalEventContext.Provider>
    );
};


export const useGlobalEvents = () => useContext(GlobalEventContext);
