import { useReducer, useMemo, useRef, useCallback, useEffect } from 'react';
import { calculatorReducer, calculateResult, createInitialState } from './useCalculator';
import type { CalculatorState, Action } from './useCalculator';
import type { StoreConfig } from '../types/storeConfig';
import { useStoreConfig } from '../contexts/StoreConfigContext';

const SLIP_NAMES = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

export type SlipInfo = {
    id: string;
    name: string;
    state: CalculatorState;
};

export type TableInfo = {
    id: string;
    name: string;
    slips: SlipInfo[];
};

export type MultiTableState = {
    tables: TableInfo[];
    activeTableId: string;
    activeSlipId: string | null;
};

function nextSlipName(slips: SlipInfo[]): string {
    return SLIP_NAMES[slips.length] ?? `⑪+${slips.length - 10}`;
}

function createInitialMultiState(config: StoreConfig): MultiTableState {
    return {
        tables: config.tableNames.map((name, i) => ({
            id: String(i + 1),
            name,
            slips: [],
        })),
        activeTableId: '1',
        activeSlipId: null,
    };
}

export type MultiAction =
    | { type: 'SET_ACTIVE_TABLE'; payload: string }
    | { type: 'SET_ACTIVE_SLIP'; payload: string | null }
    | { type: 'ADD_SLIP'; payload?: { tableId?: string } }
    | { type: 'REMOVE_SLIP'; payload: { tableId: string; slipId: string } }
    | { type: 'RENAME_SLIP'; payload: { tableId: string; slipId: string; name: string } }
    | { type: 'SLIP_ACTION'; payload: Action }
    | { type: 'SLIP_ACTION_FOR'; payload: { tableId: string; slipId: string; action: Action } }
    | { type: 'MOVE_SLIP'; payload: { fromTableId: string; slipId: string; toTableId: string } }
    | { type: 'UPDATE_ALL_CURRENT_TIME'; payload: string }
    | { type: 'CLEAR_ALL_SLIPS' }
    | { type: 'REINIT'; payload: { config: StoreConfig } };

function multiReducer(state: MultiTableState, action: MultiAction, config: StoreConfig): MultiTableState {
    switch (action.type) {
        case 'SET_ACTIVE_TABLE': {
            const table = state.tables.find(t => t.id === action.payload);
            return { ...state, activeTableId: action.payload, activeSlipId: table?.slips[0]?.id ?? null };
        }
        case 'SET_ACTIVE_SLIP':
            return { ...state, activeSlipId: action.payload };
        case 'ADD_SLIP': {
            const tableId = action.payload?.tableId ?? state.activeTableId;
            const newSlipId = Date.now().toString();
            const newTables = state.tables.map(t => {
                if (t.id === tableId) {
                    const newSlip: SlipInfo = {
                        id: newSlipId,
                        name: nextSlipName(t.slips),
                        state: createInitialState(config),
                    };
                    return { ...t, slips: [...t.slips, newSlip] };
                }
                return t;
            });
            return { ...state, tables: newTables, activeSlipId: newSlipId };
        }
        case 'REMOVE_SLIP': {
            const { tableId, slipId } = action.payload;
            const newTables = state.tables.map(t => t.id === tableId ? { ...t, slips: t.slips.filter(s => s.id !== slipId) } : t);
            const nextActive = state.activeSlipId === slipId
                ? (newTables.find(t => t.id === tableId)?.slips[0]?.id ?? null)
                : state.activeSlipId;
            return { ...state, tables: newTables, activeSlipId: nextActive };
        }
        case 'RENAME_SLIP': {
            const { tableId, slipId, name } = action.payload;
            return {
                ...state,
                tables: state.tables.map(t => t.id === tableId ? { ...t, slips: t.slips.map(s => s.id === slipId ? { ...s, name } : s) } : t)
            };
        }
        case 'SLIP_ACTION': {
            if (!state.activeSlipId) return state;
            return {
                ...state,
                tables: state.tables.map(t => t.id === state.activeTableId
                    ? { ...t, slips: t.slips.map(s => s.id === state.activeSlipId ? { ...s, state: calculatorReducer(s.state, action.payload, config) } : s) }
                    : t
                )
            };
        }
        case 'SLIP_ACTION_FOR': {
            const { tableId, slipId, action: slipAction } = action.payload;
            return {
                ...state,
                tables: state.tables.map(t => t.id === tableId
                    ? { ...t, slips: t.slips.map(s => s.id === slipId ? { ...s, state: calculatorReducer(s.state, slipAction, config) } : s) }
                    : t
                )
            };
        }
        case 'MOVE_SLIP': {
            const { fromTableId, slipId, toTableId } = action.payload;
            if (fromTableId === toTableId) return state;
            const fromTable = state.tables.find(t => t.id === fromTableId);
            const slip = fromTable?.slips.find(s => s.id === slipId);
            if (!slip) return state;
            return {
                ...state,
                tables: state.tables.map(t => {
                    if (t.id === fromTableId) return { ...t, slips: t.slips.filter(s => s.id !== slipId) };
                    if (t.id === toTableId) return { ...t, slips: [...t.slips, slip] };
                    return t;
                })
            };
        }
        case 'UPDATE_ALL_CURRENT_TIME': {
            const time = action.payload;
            return {
                ...state,
                tables: state.tables.map(t => ({
                    ...t,
                    slips: t.slips.map(s => ({
                        ...s,
                        state: { ...s.state, currentTime: time },
                    })),
                })),
            };
        }
        case 'CLEAR_ALL_SLIPS':
            return {
                ...state,
                tables: state.tables.map(t => ({ ...t, slips: [] })),
                activeSlipId: null,
            };
        case 'REINIT':
            return createInitialMultiState(action.payload.config);
        default:
            return state;
    }
}

export function useMultiTableCalculator() {
    const { config } = useStoreConfig();
    const configRef = useRef(config);
    configRef.current = config;

    const wrappedReducer = useCallback(
        (state: MultiTableState, action: MultiAction) => multiReducer(state, action, configRef.current),
        []
    );

    const [multiState, multiDispatch] = useReducer(wrappedReducer, config, createInitialMultiState);

    // store切替時にテーブルレイアウトをリセット
    const prevStoreIdRef = useRef(config.id);
    useEffect(() => {
        if (config.id !== prevStoreIdRef.current) {
            prevStoreIdRef.current = config.id;
            multiDispatch({ type: 'REINIT', payload: { config } });
        }
    }, [config.id]);

    const activeTable = useMemo(() => {
        return multiState.tables.find(t => t.id === multiState.activeTableId)!;
    }, [multiState]);

    const activeSlip = useMemo(() => {
        if (!multiState.activeSlipId) return null;
        return activeTable.slips.find(s => s.id === multiState.activeSlipId) ?? null;
    }, [multiState, activeTable]);

    const activeResult = useMemo(() => {
        if (!activeSlip) return null;
        return calculateResult(activeSlip.state, config);
    }, [activeSlip, config]);

    const dispatch: React.Dispatch<Action> = (action) => {
        multiDispatch({ type: 'SLIP_ACTION', payload: action });
    };

    return {
        tables: multiState.tables,
        activeTableId: multiState.activeTableId,
        activeSlipId: multiState.activeSlipId,
        activeTable,
        activeSlip,
        state: activeSlip?.state ?? null,
        result: activeResult,
        config,
        dispatch,
        setActiveTable: (id: string) => multiDispatch({ type: 'SET_ACTIVE_TABLE', payload: id }),
        setActiveSlip: (id: string | null) => multiDispatch({ type: 'SET_ACTIVE_SLIP', payload: id }),
        addSlip: (tableId?: string) => multiDispatch({ type: 'ADD_SLIP', payload: tableId ? { tableId } : undefined }),
        removeSlip: (tableId: string, slipId: string) => multiDispatch({ type: 'REMOVE_SLIP', payload: { tableId, slipId } }),
        renameSlip: (tableId: string, slipId: string, name: string) => multiDispatch({ type: 'RENAME_SLIP', payload: { tableId, slipId, name } }),
        multiDispatch,
    };
}
