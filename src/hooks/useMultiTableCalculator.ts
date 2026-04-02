import { useReducer, useMemo } from 'react';
import { calculatorReducer, calculateResult, INITIAL_STATE, PINNED_ORDERS } from './useCalculator';
import type { CalculatorState, Action } from './useCalculator';

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

const DEFAULT_TABLES = ['A', 'B-1', 'B-2', 'C-1', 'C-2', 'D', 'E-1', 'E-2', 'E-3'];

const MULTI_INITIAL_STATE: MultiTableState = {
    tables: DEFAULT_TABLES.map((name, i) => ({
        id: String(i + 1),
        name,
        slips: [],
    })),
    activeTableId: '1',
    activeSlipId: null,
};

// 次の伝票名を取得
function nextSlipName(slips: SlipInfo[]): string {
    return SLIP_NAMES[slips.length] ?? `⑪+${slips.length - 10}`;
}

export type MultiAction =
    | { type: 'SET_ACTIVE_TABLE'; payload: string }
    | { type: 'SET_ACTIVE_SLIP'; payload: string | null }
    | { type: 'ADD_SLIP'; payload?: { tableId?: string } }
    | { type: 'REMOVE_SLIP'; payload: { tableId: string; slipId: string } }
    | { type: 'RENAME_SLIP'; payload: { tableId: string; slipId: string; name: string } }
    | { type: 'SLIP_ACTION'; payload: Action }
    | { type: 'SLIP_ACTION_FOR'; payload: { tableId: string; slipId: string; action: Action } };

function multiReducer(state: MultiTableState, action: MultiAction): MultiTableState {
    switch (action.type) {
        case 'SET_ACTIVE_TABLE': {
            const table = state.tables.find(t => t.id === action.payload);
            const firstSlip = table?.slips[0]?.id ?? null;
            return { ...state, activeTableId: action.payload, activeSlipId: firstSlip };
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
                        state: { ...INITIAL_STATE, orders: [...PINNED_ORDERS] },
                    };
                    return { ...t, slips: [...t.slips, newSlip] };
                }
                return t;
            });
            return { ...state, tables: newTables, activeSlipId: newSlipId };
        }
        case 'REMOVE_SLIP': {
            const { tableId, slipId } = action.payload;
            const newTables = state.tables.map(t => {
                if (t.id === tableId) {
                    return { ...t, slips: t.slips.filter(s => s.id !== slipId) };
                }
                return t;
            });
            const nextActive = state.activeSlipId === slipId
                ? (newTables.find(t => t.id === tableId)?.slips[0]?.id ?? null)
                : state.activeSlipId;
            return { ...state, tables: newTables, activeSlipId: nextActive };
        }
        case 'RENAME_SLIP': {
            const { tableId, slipId, name } = action.payload;
            const newTables = state.tables.map(t => {
                if (t.id === tableId) {
                    return { ...t, slips: t.slips.map(s => s.id === slipId ? { ...s, name } : s) };
                }
                return t;
            });
            return { ...state, tables: newTables };
        }
        case 'SLIP_ACTION': {
            if (!state.activeSlipId) return state;
            const newTables = state.tables.map(t => {
                if (t.id === state.activeTableId) {
                    return {
                        ...t,
                        slips: t.slips.map(s =>
                            s.id === state.activeSlipId
                                ? { ...s, state: calculatorReducer(s.state, action.payload) }
                                : s
                        )
                    };
                }
                return t;
            });
            return { ...state, tables: newTables };
        }
        case 'SLIP_ACTION_FOR': {
            const { tableId, slipId, action: slipAction } = action.payload;
            const newTables = state.tables.map(t => {
                if (t.id === tableId) {
                    return {
                        ...t,
                        slips: t.slips.map(s =>
                            s.id === slipId
                                ? { ...s, state: calculatorReducer(s.state, slipAction) }
                                : s
                        )
                    };
                }
                return t;
            });
            return { ...state, tables: newTables };
        }
        default:
            return state;
    }
}

export function useMultiTableCalculator() {
    const [multiState, multiDispatch] = useReducer(multiReducer, MULTI_INITIAL_STATE);

    const activeTable = useMemo(() => {
        return multiState.tables.find(t => t.id === multiState.activeTableId)!;
    }, [multiState]);

    const activeSlip = useMemo(() => {
        if (!multiState.activeSlipId) return null;
        return activeTable.slips.find(s => s.id === multiState.activeSlipId) ?? null;
    }, [multiState, activeTable]);

    const activeResult = useMemo(() => {
        if (!activeSlip) return null;
        return calculateResult(activeSlip.state);
    }, [activeSlip]);

    // アクティブ伝票へのdispatch
    const dispatch: React.Dispatch<Action> = (action) => {
        multiDispatch({ type: 'SLIP_ACTION', payload: action });
    };

    const setActiveTable = (id: string) => {
        multiDispatch({ type: 'SET_ACTIVE_TABLE', payload: id });
    };

    const setActiveSlip = (id: string | null) => {
        multiDispatch({ type: 'SET_ACTIVE_SLIP', payload: id });
    };

    const addSlip = (tableId?: string) => {
        multiDispatch({ type: 'ADD_SLIP', payload: tableId ? { tableId } : undefined });
    };

    const removeSlip = (tableId: string, slipId: string) => {
        multiDispatch({ type: 'REMOVE_SLIP', payload: { tableId, slipId } });
    };

    const renameSlip = (tableId: string, slipId: string, name: string) => {
        multiDispatch({ type: 'RENAME_SLIP', payload: { tableId, slipId, name } });
    };

    return {
        tables: multiState.tables,
        activeTableId: multiState.activeTableId,
        activeSlipId: multiState.activeSlipId,
        activeTable,
        activeSlip,
        state: activeSlip?.state ?? null,
        result: activeResult,
        dispatch,
        setActiveTable,
        setActiveSlip,
        addSlip,
        removeSlip,
        renameSlip,
        multiDispatch,
    };
}
