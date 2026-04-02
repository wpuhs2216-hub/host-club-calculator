import { useReducer } from 'react';

export type CustomerType = 'initial' | 'r_within' | 'r_after' | 'regular';

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    count: number;
    isTaxIncluded?: boolean;
}

export interface CalculatorState {
    customerType: CustomerType;
    entryTime: string;
    currentTime: string;
    dohan: boolean;
    isSetHalfOff: boolean;
    isGirlsParty: boolean;
    isAppreciationDay: boolean;
    isFirstLady: boolean;
    additionalNominationCount: number;
    isDebugMode: boolean;
    orders: OrderItem[];
}

export interface BreakdownItem {
    label: string;
    amount: number;
    note?: string;
    isTotal?: boolean;
}

export interface PriceScheduleItem {
    timeLimit: string;
    totalPrice: number;
}

export interface CalculationResult {
    currentTotal: number;
    breakdown: BreakdownItem[];
    schedule: PriceScheduleItem[];
    taxRate: number;
}

const INITIAL_STATE: CalculatorState = {
    customerType: 'initial',
    entryTime: '20:00',
    currentTime: '20:00',
    dohan: false,
    isSetHalfOff: false,
    isGirlsParty: false,
    isAppreciationDay: false,
    isFirstLady: false,
    additionalNominationCount: 0,
    isDebugMode: false,
    orders: [],
};

const PRICES = {
    initial: { set: 1000, ext: 2000, nom: 1000, tc: 0 },
    r_within: { set: 0, ext: 1000, nom: 1000, tc: 0 },
    r_after: { set: 2000, ext: 1000, nom: 1000, tc: 500 },
    regular: { ext: 3000, nom: 3000, tc: 500 },
};

// Closing time: 25:00 (1:00 AM next day)
const CLOSING_HOUR = 25;

type Action =
    | { type: 'SET_CUSTOMER_TYPE'; payload: CustomerType }
    | { type: 'SET_ENTRY_TIME'; payload: string }
    | { type: 'SET_CURRENT_TIME'; payload: string }
    | { type: 'TOGGLE_DOHAN' }
    | { type: 'TOGGLE_SET_HALF_OFF' }
    | { type: 'TOGGLE_GIRLS_PARTY' }
    | { type: 'TOGGLE_APPRECIATION_DAY' }
    | { type: 'TOGGLE_FIRST_LADY' }
    | { type: 'SET_ADDITIONAL_NOMINATION_COUNT'; payload: number }
    | { type: 'TOGGLE_DEBUG_MODE' }
    | { type: 'ADD_ORDER'; payload: { name: string; price: number; isTaxIncluded?: boolean } }
    | { type: 'UPDATE_ORDER_COUNT'; payload: { id: string; delta: number } }
    | { type: 'REMOVE_ORDER'; payload: string }
    | { type: 'RESET' };

function reducer(state: CalculatorState, action: Action): CalculatorState {
    switch (action.type) {
        case 'SET_CUSTOMER_TYPE':
            return { ...state, customerType: action.payload };
        case 'SET_ENTRY_TIME':
            return { ...state, entryTime: action.payload };
        case 'SET_CURRENT_TIME':
            return { ...state, currentTime: action.payload };
        case 'TOGGLE_DOHAN':
            return { ...state, dohan: !state.dohan };
        case 'TOGGLE_SET_HALF_OFF':
            return { ...state, isSetHalfOff: !state.isSetHalfOff };
        case 'TOGGLE_GIRLS_PARTY':
            return { ...state, isGirlsParty: !state.isGirlsParty };
        case 'TOGGLE_APPRECIATION_DAY':
            return { ...state, isAppreciationDay: !state.isAppreciationDay };
        case 'TOGGLE_FIRST_LADY':
            return { ...state, isFirstLady: !state.isFirstLady };
        case 'SET_ADDITIONAL_NOMINATION_COUNT':
            return { ...state, additionalNominationCount: Math.max(0, action.payload) };
        case 'TOGGLE_DEBUG_MODE':
            return { ...state, isDebugMode: !state.isDebugMode };
        case 'ADD_ORDER': {
            const existing = state.orders.find(o => o.name === action.payload.name);
            if (existing) {
                return {
                    ...state,
                    orders: state.orders.map(o =>
                        o.id === existing.id ? { ...o, count: o.count + 1 } : o
                    )
                };
            }
            const newOrder: OrderItem = {
                id: Date.now().toString(),
                name: action.payload.name,
                price: action.payload.price,
                count: 1,
                isTaxIncluded: action.payload.isTaxIncluded,
            };
            return { ...state, orders: [...state.orders, newOrder] };
        }
        case 'UPDATE_ORDER_COUNT':
            return {
                ...state,
                orders: state.orders.map(o => {
                    if (o.id === action.payload.id) {
                        const newCount = Math.max(0, o.count + action.payload.delta);
                        return { ...o, count: newCount };
                    }
                    return o;
                }).filter(o => o.count > 0)
            };
        case 'REMOVE_ORDER':
            return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
        case 'RESET':
            return {
                ...INITIAL_STATE,
                currentTime: state.currentTime,
                isDebugMode: state.isDebugMode,
            };
        default:
            return state;
    }
}

export function useCalculator() {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    const calculate = (): CalculationResult => {
        const {
            customerType, entryTime, currentTime, dohan, isSetHalfOff, orders,
            isAppreciationDay, additionalNominationCount
        } = state;

        // Parse Entry Time
        const [entryH, entryM] = entryTime.split(':').map(Number);
        const normalizedEntryH = entryH < 18 ? entryH + 24 : entryH;

        // Parse Current Time
        const [currentH, currentM] = currentTime.split(':').map(Number);
        const normalizedCurrentH = currentH < 18 ? currentH + 24 : currentH;

        // 1. Basic Unit Costs
        let baseSetPrice = 0;
        let extUnitCost = 0;
        let nomPrice = 0;
        let tcPrice = 0;

        if (customerType === 'regular') {
            const isEarly = normalizedEntryH < 21;
            baseSetPrice = isEarly ? 2000 : 5000;
            extUnitCost = PRICES.regular.ext;
            nomPrice = PRICES.regular.nom;
            tcPrice = PRICES.regular.tc;
        } else {
            baseSetPrice = PRICES[customerType].set;
            extUnitCost = PRICES[customerType].ext;
            nomPrice = PRICES[customerType].nom;
            tcPrice = PRICES[customerType].tc;
        }

        // Apply Set Half-Off (Manual Toggle OR Appreciation Day)
        if (isSetHalfOff || isAppreciationDay) {
            baseSetPrice = Math.floor(baseSetPrice / 2);
            extUnitCost = Math.floor(extUnitCost / 2);
        }

        const nomTotal = nomPrice;
        const dohanTotal = dohan ? 3000 : 0;
        const tcTotal = tcPrice;
        const additionalNominationTotal = additionalNominationCount * 3000;

        // Orders Total - Separate Taxable and Tax-Included
        const taxableOrders = orders.filter(o => !o.isTaxIncluded);
        const taxIncludedOrders = orders.filter(o => o.isTaxIncluded);

        const taxableOrdersTotal = taxableOrders.reduce((sum, item) => sum + (item.price * item.count), 0);
        const taxIncludedOrdersTotal = taxIncludedOrders.reduce((sum, item) => sum + (item.price * item.count), 0);
        const totalItemsCount = orders.reduce((sum, item) => sum + item.count, 0);

        // Tax Rate
        let taxRate = 0.35;
        if (customerType === 'initial' && totalItemsCount === 0) {
            taxRate = 0;
        }

        // --- Helper to calculate total for a specific duration (hours) ---
        const calculateForDuration = (durationHours: number) => {
            // R types have 2-hour initial set, others have 1-hour
            const initialSetHours = (customerType === 'r_within' || customerType === 'r_after') ? 2 : 1;
            const extensionCount = Math.max(0, durationHours - initialSetHours);
            const setAndExtTotal = baseSetPrice + (extensionCount * extUnitCost);

            const subTotal = setAndExtTotal + nomTotal + dohanTotal + tcTotal + additionalNominationTotal + taxableOrdersTotal;
            const taxAmountRaw = subTotal * taxRate;
            const totalRaw = subTotal + taxAmountRaw + taxIncludedOrdersTotal;
            const finalTotal = Math.ceil(totalRaw / 100) * 100;

            return {
                setAndExtTotal,
                subTotal,
                finalTotal,
                taxAmountDisplay: Math.ceil(taxAmountRaw)
            };
        };

        // --- Generate Schedule ---
        const schedule: PriceScheduleItem[] = [];

        let loopTimeH = normalizedEntryH + 1;
        let loopTimeM = entryM;

        // Loop until just before closing hour to add hourly increments
        while (loopTimeH < CLOSING_HOUR) {
            const duration = loopTimeH - normalizedEntryH;
            const { finalTotal } = calculateForDuration(duration);

            const displayH = loopTimeH >= 24 ? loopTimeH - 24 : loopTimeH;
            const displayM = loopTimeM.toString().padStart(2, '0');
            const timeLabel = `${displayH}:${displayM}`;

            schedule.push({
                timeLimit: timeLabel,
                totalPrice: finalTotal
            });

            loopTimeH++;
        }

        // Always add the Closing Time (25:00 / 01:00) entry
        const entryTotalMins = normalizedEntryH * 60 + entryM;
        const closingTotalMins = CLOSING_HOUR * 60; // 25 * 60 = 1500
        const durationMins = closingTotalMins - entryTotalMins;
        const durationSets = Math.ceil(durationMins / 60);

        const { finalTotal: closingTotal } = calculateForDuration(durationSets);

        schedule.push({
            timeLimit: '01:00', // Fixed label for 25:00
            totalPrice: closingTotal
        });

        // --- Current Total Calculation ---
        // Calculate duration from Entry Time to Current Time
        let currentDurationSets = 1;

        // Calculate minutes difference
        const currentTotalMins = normalizedCurrentH * 60 + currentM;
        const diffMins = currentTotalMins - entryTotalMins;

        if (diffMins > 0) {
            currentDurationSets = Math.ceil(diffMins / 60);
        } else {
            // If current time is before entry time (e.g. debug or just entered), default to 1 set
            currentDurationSets = 1;
        }

        const currentCalc = calculateForDuration(currentDurationSets);

        // --- Breakdown ---
        const breakdown: BreakdownItem[] = [
            { label: `セット料金${(isSetHalfOff || isAppreciationDay) ? '(半額)' : ''} (延長込)`, amount: currentCalc.setAndExtTotal },
            { label: '指名料', amount: nomTotal },
            { label: `複数指名料 (${additionalNominationCount}人)`, amount: additionalNominationTotal },
            { label: '同伴料', amount: dohanTotal },
            { label: 'T.C', amount: tcTotal },
            ...orders.map(o => ({
                label: `${o.name} x${o.count}${o.isTaxIncluded ? ' (税込)' : ''}`,
                amount: o.price * o.count
            })),
            { label: '小計 (課税対象)', amount: currentCalc.subTotal, isTotal: true },
            { label: `TAX/SVC (${(taxRate * 100).toFixed(0)}%)`, amount: currentCalc.taxAmountDisplay, note: '(十の位以下切り上げ)' }
        ];

        return {
            currentTotal: currentCalc.finalTotal,
            breakdown,
            schedule,
            taxRate
        };
    };

    return {
        state,
        result: calculate(),
        dispatch,
    };
}
