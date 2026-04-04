import { useReducer, useMemo, useRef, useCallback, useEffect } from 'react';
import { calculatorReducer, calculateResult, createInitialState, createPinnedOrders } from './useCalculator';
import type { CalculatorState, Action } from './useCalculator';
import type { StoreConfig } from '../types/storeConfig';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import type { SlipTab } from '../components/SlipTabView';

const SLIP_NAMES = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

export type SlipInfo = {
    id: string;
    name: string;
    state: CalculatorState;
    isWizardActive: boolean;
    wizardStep: number;
    activeTab: SlipTab;
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

// コピー時のフィールド適用
function applySelectiveFields(
    base: CalculatorState,
    source: CalculatorState,
    fields: string[],
): CalculatorState {
    let result = { ...base };
    for (const field of fields) {
        switch (field) {
            case 'customerType':
                result.customerType = source.customerType;
                result.initialSetPrice = source.initialSetPrice;
                break;
            case 'entryTime':
                result.entryTime = source.entryTime;
                break;
            case 'dohan':
                result.dohan = source.dohan;
                break;
            case 'events':
                result.isGirlsParty = source.isGirlsParty;
                result.isAppreciationDay = source.isAppreciationDay;
                result.isSevenLuck = source.isSevenLuck;
                result.isGoldTicket = source.isGoldTicket;
                break;
            case 'setHalfOff':
                result.isSetHalfOff = source.isSetHalfOff;
                break;
            case 'nomination':
                result.additionalNominationCount = source.additionalNominationCount;
                break;
            case 'orders':
                result.orders = source.orders.map(o => ({ ...o }));
                break;
        }
    }
    return result;
}

export type MultiAction =
    | { type: 'SET_ACTIVE_TABLE'; payload: string }
    | { type: 'SET_ACTIVE_SLIP'; payload: string | null }
    | { type: 'ADD_SLIP'; payload?: { tableId?: string } }
    | { type: 'ADD_SLIP_FROM_COPY'; payload: { sourceSlipId: string; mode: 'full' | 'selective'; selectedFields?: string[]; tableId?: string } }
    | { type: 'REMOVE_SLIP'; payload: { tableId: string; slipId: string } }
    | { type: 'RENAME_SLIP'; payload: { tableId: string; slipId: string; name: string } }
    | { type: 'SLIP_ACTION'; payload: Action }
    | { type: 'SLIP_ACTION_FOR'; payload: { tableId: string; slipId: string; action: Action } }
    | { type: 'MOVE_SLIP'; payload: { fromTableId: string; slipId: string; toTableId: string } }
    | { type: 'UPDATE_ALL_CURRENT_TIME'; payload: string }
    | { type: 'CLEAR_ALL_SLIPS' }
    | { type: 'SET_WIZARD_STEP'; payload: number }
    | { type: 'COMPLETE_WIZARD' }
    | { type: 'SET_ACTIVE_TAB'; payload: SlipTab }
    | { type: 'REINIT'; payload: { config: StoreConfig } };

function findSlipAcrossTables(tables: TableInfo[], slipId: string): { slip: SlipInfo; tableId: string } | null {
    for (const table of tables) {
        const slip = table.slips.find(s => s.id === slipId);
        if (slip) return { slip, tableId: table.id };
    }
    return null;
}

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
                        isWizardActive: true,
                        wizardStep: 1,
                        activeTab: 'checkout',
                    };
                    return { ...t, slips: [...t.slips, newSlip] };
                }
                return t;
            });
            return { ...state, tables: newTables, activeSlipId: newSlipId };
        }
        case 'ADD_SLIP_FROM_COPY': {
            const { sourceSlipId, mode, selectedFields, tableId: targetTableId } = action.payload;
            const found = findSlipAcrossTables(state.tables, sourceSlipId);
            if (!found) return state;

            const newSlipId = Date.now().toString();
            const tId = targetTableId ?? state.activeTableId;

            let newState: CalculatorState;
            if (mode === 'full') {
                newState = {
                    ...found.slip.state,
                    orders: found.slip.state.orders.map(o => ({ ...o })),
                    currentTime: found.slip.state.currentTime, // keep current time from source
                };
            } else {
                const base = createInitialState(config);
                newState = applySelectiveFields(base, found.slip.state, selectedFields ?? []);
                // If customerType was copied, recreate pinned orders with correct half-off
                if (selectedFields?.includes('customerType') && !selectedFields?.includes('orders')) {
                    newState.orders = createPinnedOrders(config, newState.customerType);
                }
            }

            const newTables = state.tables.map(t => {
                if (t.id === tId) {
                    const newSlip: SlipInfo = {
                        id: newSlipId,
                        name: nextSlipName(t.slips),
                        state: newState,
                        isWizardActive: false, // コピーはウィザードなし
                        wizardStep: 1,
                        activeTab: 'checkout',
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
        case 'SET_WIZARD_STEP': {
            if (!state.activeSlipId) return state;
            return {
                ...state,
                tables: state.tables.map(t => t.id === state.activeTableId
                    ? { ...t, slips: t.slips.map(s => s.id === state.activeSlipId ? { ...s, wizardStep: action.payload } : s) }
                    : t
                )
            };
        }
        case 'COMPLETE_WIZARD': {
            if (!state.activeSlipId) return state;
            return {
                ...state,
                tables: state.tables.map(t => t.id === state.activeTableId
                    ? { ...t, slips: t.slips.map(s => s.id === state.activeSlipId ? { ...s, isWizardActive: false, activeTab: 'checkout' } : s) }
                    : t
                )
            };
        }
        case 'SET_ACTIVE_TAB': {
            if (!state.activeSlipId) return state;
            return {
                ...state,
                tables: state.tables.map(t => t.id === state.activeTableId
                    ? { ...t, slips: t.slips.map(s => s.id === state.activeSlipId ? { ...s, activeTab: action.payload } : s) }
                    : t
                )
            };
        }
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
        addSlipFromCopy: (sourceSlipId: string, mode: 'full' | 'selective', selectedFields?: string[]) =>
            multiDispatch({ type: 'ADD_SLIP_FROM_COPY', payload: { sourceSlipId, mode, selectedFields } }),
        removeSlip: (tableId: string, slipId: string) => multiDispatch({ type: 'REMOVE_SLIP', payload: { tableId, slipId } }),
        renameSlip: (tableId: string, slipId: string, name: string) => multiDispatch({ type: 'RENAME_SLIP', payload: { tableId, slipId, name } }),
        setWizardStep: (step: number) => multiDispatch({ type: 'SET_WIZARD_STEP', payload: step }),
        completeWizard: () => multiDispatch({ type: 'COMPLETE_WIZARD' }),
        setActiveTab: (tab: SlipTab) => multiDispatch({ type: 'SET_ACTIVE_TAB', payload: tab }),
        multiDispatch,
    };
}
