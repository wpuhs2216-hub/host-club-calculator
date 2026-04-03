import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { StoreConfig, StoreRegistry } from '../types/storeConfig';
import { createDefaultStoreConfig } from '../data/defaultStoreConfig';

const STORAGE_KEY = 'host-club-store-registry';

interface StoreConfigContextValue {
    config: StoreConfig;
    registry: StoreRegistry;
    setActiveStore: (storeId: string) => void;
    updateStoreConfig: (storeId: string, updater: (prev: StoreConfig) => StoreConfig) => void;
    addStore: (name: string, cloneFromId?: string) => string;
    deleteStore: (storeId: string) => void;
}

const StoreConfigContext = createContext<StoreConfigContextValue | null>(null);

function loadRegistry(): StoreRegistry {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved) as StoreRegistry;
            if (parsed.stores && parsed.stores.length > 0) return parsed;
        }
    } catch { /* ignore */ }

    // 旧形式からの移行
    try {
        const old = localStorage.getItem('host-club-settings');
        if (old) {
            const parsed = JSON.parse(old);
            const config = createDefaultStoreConfig('default');
            if (parsed.storeName) config.storeName = parsed.storeName;
            return { activeStoreId: 'default', stores: [config] };
        }
    } catch { /* ignore */ }

    return { activeStoreId: 'default', stores: [createDefaultStoreConfig('default')] };
}

function saveRegistry(registry: StoreRegistry) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
}

export const StoreConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [registry, setRegistry] = useState<StoreRegistry>(loadRegistry);

    useEffect(() => {
        saveRegistry(registry);
    }, [registry]);

    const config = registry.stores.find(s => s.id === registry.activeStoreId) ?? registry.stores[0];

    const setActiveStore = useCallback((storeId: string) => {
        setRegistry(prev => ({ ...prev, activeStoreId: storeId }));
    }, []);

    const updateStoreConfig = useCallback((storeId: string, updater: (prev: StoreConfig) => StoreConfig) => {
        setRegistry(prev => ({
            ...prev,
            stores: prev.stores.map(s => s.id === storeId ? updater(s) : s),
        }));
    }, []);

    const addStore = useCallback((name: string, cloneFromId?: string) => {
        const newId = Date.now().toString();
        setRegistry(prev => {
            const base = cloneFromId
                ? prev.stores.find(s => s.id === cloneFromId) ?? createDefaultStoreConfig(newId)
                : createDefaultStoreConfig(newId);
            const newStore: StoreConfig = { ...base, id: newId, storeName: name };
            return { activeStoreId: newId, stores: [...prev.stores, newStore] };
        });
        return newId;
    }, []);

    const deleteStore = useCallback((storeId: string) => {
        setRegistry(prev => {
            const remaining = prev.stores.filter(s => s.id !== storeId);
            if (remaining.length === 0) return prev;
            const nextActive = prev.activeStoreId === storeId ? remaining[0].id : prev.activeStoreId;
            return { activeStoreId: nextActive, stores: remaining };
        });
    }, []);

    return (
        <StoreConfigContext.Provider value={{ config, registry, setActiveStore, updateStoreConfig, addStore, deleteStore }}>
            {children}
        </StoreConfigContext.Provider>
    );
};

export function useStoreConfig(): StoreConfigContextValue {
    const ctx = useContext(StoreConfigContext);
    if (!ctx) throw new Error('useStoreConfig must be used within StoreConfigProvider');
    return ctx;
}
