import { useReducer } from 'react';

export type CustomerType = 'initial' | 'r_within' | 'r_after' | 'regular';

export interface OrderItem {
    id: string;
    name: string;
    baseName: string;
    price: number;
    originalPrice: number;
    count: number;
    isTaxIncluded?: boolean;
    isPinned?: boolean;
    canHalfOff?: boolean;
    isHalfOff?: boolean;
}

export interface CalculatorState {
    customerType: CustomerType;
    initialSetPrice: number;
    entryTime: string;
    currentTime: string;
    dohan: boolean;
    isSetHalfOff: boolean;
    isGirlsParty: boolean;
    isAppreciationDay: boolean;
    isSevenLuck: boolean;
    isGoldTicket: boolean;
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
    breakdown: BreakdownItem[];
}

export interface CalculationResult {
    currentTotal: number;
    breakdown: BreakdownItem[];
    schedule: PriceScheduleItem[];
    taxRate: number;
    isOutOfHours: boolean;
}

export const PINNED_ORDERS: OrderItem[] = [
    { id: 'pinned_can', name: 'カン', baseName: 'カン', price: 1500, originalPrice: 1500, count: 0, isPinned: true, canHalfOff: true, isHalfOff: false },
    { id: 'pinned_pet', name: 'ペットボトル', baseName: 'ペットボトル', price: 2000, originalPrice: 2000, count: 0, isPinned: true },
    { id: 'pinned_shot', name: 'ショット系 (半額)', baseName: 'ショット系', price: 1000, originalPrice: 2000, count: 0, isPinned: true, canHalfOff: true, isHalfOff: true },
];

export const INITIAL_STATE: CalculatorState = {
    customerType: 'initial',
    initialSetPrice: 1000,
    entryTime: '20:00',
    currentTime: '20:00',
    dohan: false,
    isSetHalfOff: false,
    isGirlsParty: false,
    isAppreciationDay: false,
    isSevenLuck: false,
    isGoldTicket: false,
    additionalNominationCount: 0,
    isDebugMode: false,
    orders: [...PINNED_ORDERS],
};

const PRICES = {
    initial: { set: 1000, ext: 2000, nom: 1000, tc: 0 },
    r_within: { set: 0, ext: 1000, nom: 1000, tc: 0 },
    r_after: { set: 2000, ext: 1000, nom: 1000, tc: 500 },
    regular: { ext: 3000, nom: 3000, tc: 500 },
};

// Closing time: 25:00 (1:00 AM next day)
const CLOSING_HOUR = 25;

// 半額計算ヘルパー
function calcHalfOffPrice(baseName: string, originalPrice: number): number {
    return baseName === 'カン' ? 700 : Math.floor(originalPrice / 2);
}

// シャンパン半額対象名
const CHAMPAGNE_HALF_NAMES = [
    'リステル', 'アスティ', 'SPLブルー', 'SPLホワイト', 'SPLパープル',
    'SPLロゼ', 'SPLジュエルワイン', 'SPLZERO', 'SPLレッド', 'SPLゴールド',
];
const BLUE_TO_GOLD_MIN = 35000;

// イベント・客層に応じてカン・ショット・シャンパンの半額状態を同期
function syncHalfOffOrders(
    orders: OrderItem[],
    customerType: CustomerType,
    isGirlsParty: boolean,
    isAppreciationDay: boolean,
    isSevenLuck: boolean,
): OrderItem[] {
    const isInitialOrR = customerType === 'initial' || customerType === 'r_within' || customerType === 'r_after';
    const isGirlsOrSeven = isGirlsParty || isSevenLuck;

    // カン半額: 女子会/セブンラック/感謝DAY
    const shouldCanHalf = isGirlsOrSeven || isAppreciationDay;
    // ショット半額: 初回 or 女子会/セブンラック/感謝DAY
    const shouldShotHalf = customerType === 'initial' || isGirlsOrSeven || isAppreciationDay;

    // シャンパン半額判定
    // まず既存の半額/正規の分割済みシャンパンを統合してから再分割する
    // 同じbaseNameの半額と正規を合算
    const mergedOrders: OrderItem[] = [];
    const champagneMerged = new Map<string, { total: number; template: OrderItem }>();

    for (const o of orders) {
        if (CHAMPAGNE_HALF_NAMES.includes(o.baseName) && o.canHalfOff && o.count > 0) {
            const existing = champagneMerged.get(o.baseName);
            if (existing) {
                existing.total += o.count;
            } else {
                champagneMerged.set(o.baseName, { total: o.count, template: o });
            }
        } else {
            mergedOrders.push(o);
        }
    }

    // シャンパンを再構成
    const champagneEntries = Array.from(champagneMerged.values())
        .sort((a, b) => b.template.originalPrice - a.template.originalPrice);

    let initialRHalfUsed = false; // 初回/Rの1本枠を使ったか

    for (const entry of champagneEntries) {
        const { template, total } = entry;
        const price = template.originalPrice;
        const inBlueGoldRange = price >= BLUE_TO_GOLD_MIN && price <= 150000;

        if (isGirlsOrSeven && inBlueGoldRange) {
            // 女子会/セブンラック: 全部半額
            mergedOrders.push({
                ...template,
                count: total,
                isHalfOff: true,
                price: calcHalfOffPrice(template.baseName, template.originalPrice),
                name: `${template.baseName} (半額)`,
            });
        } else if (isInitialOrR && !initialRHalfUsed) {
            // 初回/R: 1本だけ半額、残りは正規
            initialRHalfUsed = true;
            // 半額1本
            mergedOrders.push({
                ...template,
                id: template.id,
                count: 1,
                isHalfOff: true,
                price: calcHalfOffPrice(template.baseName, template.originalPrice),
                name: `${template.baseName} (半額)`,
            });
            // 残りがあれば正規料金で追加
            if (total > 1) {
                mergedOrders.push({
                    ...template,
                    id: template.id + '_full',
                    count: total - 1,
                    isHalfOff: false,
                    price: template.originalPrice,
                    name: template.baseName,
                });
            }
        } else {
            // 正規料金
            mergedOrders.push({
                ...template,
                count: total,
                isHalfOff: false,
                price: template.originalPrice,
                name: template.baseName,
            });
        }
    }

    // カン・ショットの半額適用
    return mergedOrders.map(o => {
        if (o.baseName === 'カン' && o.canHalfOff) {
            return {
                ...o, isHalfOff: shouldCanHalf,
                price: shouldCanHalf ? calcHalfOffPrice(o.baseName, o.originalPrice) : o.originalPrice,
                name: shouldCanHalf ? `${o.baseName} (半額)` : o.baseName,
            };
        }
        if (o.baseName === 'ショット系' && o.canHalfOff) {
            return {
                ...o, isHalfOff: shouldShotHalf,
                price: shouldShotHalf ? calcHalfOffPrice(o.baseName, o.originalPrice) : o.originalPrice,
                name: shouldShotHalf ? `${o.baseName} (半額)` : o.baseName,
            };
        }
        return o;
    });
}

export type Action =
    | { type: 'SET_CUSTOMER_TYPE'; payload: CustomerType }
    | { type: 'SET_ENTRY_TIME'; payload: string }
    | { type: 'SET_CURRENT_TIME'; payload: string }
    | { type: 'TOGGLE_DOHAN' }
    | { type: 'TOGGLE_SET_HALF_OFF' }
    | { type: 'TOGGLE_GIRLS_PARTY' }
    | { type: 'TOGGLE_APPRECIATION_DAY' }
    | { type: 'TOGGLE_SEVEN_LUCK' }
    | { type: 'TOGGLE_GOLD_TICKET' }
    | { type: 'SET_INITIAL_SET_PRICE'; payload: number }
    | { type: 'SET_ADDITIONAL_NOMINATION_COUNT'; payload: number }
    | { type: 'TOGGLE_DEBUG_MODE' }
    | { type: 'ADD_ORDER'; payload: { name: string; price: number; isTaxIncluded?: boolean; canHalfOff?: boolean; isHalfOff?: boolean } }
    | { type: 'UPDATE_ORDER_COUNT'; payload: { id: string; delta: number } }
    | { type: 'SET_ORDER_COUNT'; payload: { id: string; count: number } }
    | { type: 'TOGGLE_ORDER_HALF_OFF'; payload: string }
    | { type: 'REMOVE_ORDER'; payload: string }
    | { type: 'RESET' };

export function calculatorReducer(state: CalculatorState, action: Action): CalculatorState {
    switch (action.type) {
        case 'SET_CUSTOMER_TYPE': {
            const nextType = action.payload;
            return {
                ...state,
                customerType: nextType,
                orders: syncHalfOffOrders(state.orders, nextType, state.isGirlsParty, state.isAppreciationDay, state.isSevenLuck),
            };
        }
        case 'SET_ENTRY_TIME':
            return { ...state, entryTime: action.payload };
        case 'SET_CURRENT_TIME':
            return { ...state, currentTime: action.payload };
        case 'TOGGLE_DOHAN':
            return { ...state, dohan: !state.dohan };
        case 'TOGGLE_SET_HALF_OFF':
            return { ...state, isSetHalfOff: !state.isSetHalfOff };
        case 'TOGGLE_GIRLS_PARTY':
        case 'TOGGLE_APPRECIATION_DAY':
        case 'TOGGLE_SEVEN_LUCK': {
            const next = {
                isGirlsParty: action.type === 'TOGGLE_GIRLS_PARTY' ? !state.isGirlsParty : state.isGirlsParty,
                isAppreciationDay: action.type === 'TOGGLE_APPRECIATION_DAY' ? !state.isAppreciationDay : state.isAppreciationDay,
                isSevenLuck: action.type === 'TOGGLE_SEVEN_LUCK' ? !state.isSevenLuck : state.isSevenLuck,
            };
            return {
                ...state, ...next,
                orders: syncHalfOffOrders(state.orders, state.customerType, next.isGirlsParty, next.isAppreciationDay, next.isSevenLuck),
            };
        }
        case 'TOGGLE_GOLD_TICKET':
            return { ...state, isGoldTicket: !state.isGoldTicket };
        case 'SET_INITIAL_SET_PRICE':
            return { ...state, initialSetPrice: action.payload };
        case 'SET_ADDITIONAL_NOMINATION_COUNT':
            return { ...state, additionalNominationCount: Math.max(0, action.payload) };
        case 'TOGGLE_DEBUG_MODE':
            return { ...state, isDebugMode: !state.isDebugMode };
        case 'ADD_ORDER': {
            const baseName = action.payload.name;
            const existing = state.orders.find(o => o.baseName === baseName);
            if (existing) {
                return {
                    ...state,
                    orders: state.orders.map(o =>
                        o.id === existing.id ? { ...o, count: o.count + 1 } : o
                    )
                };
            }
            const isHalf = action.payload.isHalfOff || false;
            const originalPrice = action.payload.price;
            const effectivePrice = isHalf ? calcHalfOffPrice(baseName, originalPrice) : originalPrice;
            const displayName = isHalf ? `${baseName} (半額)` : baseName;

            const newOrder: OrderItem = {
                id: Date.now().toString(),
                name: displayName,
                baseName,
                price: effectivePrice,
                originalPrice,
                count: 1,
                isTaxIncluded: action.payload.isTaxIncluded,
                canHalfOff: action.payload.canHalfOff,
                isHalfOff: isHalf,
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
                }).filter(o => o.count > 0 || o.isPinned)
            };
        case 'SET_ORDER_COUNT':
            return {
                ...state,
                orders: state.orders.map(o => {
                    if (o.id === action.payload.id) {
                        return { ...o, count: Math.max(0, action.payload.count) };
                    }
                    return o;
                }).filter(o => o.count > 0 || o.isPinned)
            };
        case 'TOGGLE_ORDER_HALF_OFF':
            return {
                ...state,
                orders: state.orders.map(o => {
                    if (o.id === action.payload && o.canHalfOff) {
                        const newHalfOff = !o.isHalfOff;
                        const newPrice = newHalfOff ? calcHalfOffPrice(o.baseName, o.originalPrice) : o.originalPrice;
                        return {
                            ...o,
                            isHalfOff: newHalfOff,
                            price: newPrice,
                            name: newHalfOff ? `${o.baseName} (半額)` : o.baseName,
                        };
                    }
                    return o;
                })
            };
        case 'REMOVE_ORDER':
            return { ...state, orders: state.orders.filter(o => o.id !== action.payload) };
        case 'RESET':
            return {
                ...INITIAL_STATE,
                orders: [...PINNED_ORDERS],
                currentTime: state.currentTime,
                isDebugMode: state.isDebugMode,
            };
        default:
            return state;
    }
}

// LO_CAP_TIME: 24:38 (0:38 AM) 以降は延長料金を取らない
const LO_CAP_NORMALIZED_MINS = 24 * 60 + 38; // 1478

export function calculateResult(state: CalculatorState, options?: { loCapEnabled?: boolean }): CalculationResult {
    const {
        customerType, initialSetPrice, entryTime, currentTime, dohan, isSetHalfOff, orders,
        isAppreciationDay, isGoldTicket, additionalNominationCount
    } = state;

        // Parse Entry Time
        const [entryH, entryM] = entryTime.split(':').map(Number);
        const normalizedEntryH = entryH < 18 ? entryH + 24 : entryH;

        // Parse Current Time
        const [currentH, currentM_raw] = currentTime.split(':').map(Number);
        const originalNormalizedCurrentH = currentH < 18 ? currentH + 24 : currentH;

        let normalizedCurrentH = originalNormalizedCurrentH;
        let currentM = currentM_raw;
        let isOutOfHours = false;

        // 20:00 〜 25:00 (1:00 AM) の範囲外であれば「1時間分」として扱う (昼間のテスト等での表示崩れ防止)
        if (
            originalNormalizedCurrentH < 20 || 
            originalNormalizedCurrentH > 25 || 
            (originalNormalizedCurrentH === 25 && currentM_raw > 0)
        ) {
            normalizedCurrentH = normalizedEntryH + 1;
            currentM = entryM;
            isOutOfHours = true;
        }

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
        } else if (customerType === 'initial') {
            baseSetPrice = initialSetPrice;
            extUnitCost = PRICES.initial.ext;
            nomPrice = PRICES.initial.nom;
            tcPrice = PRICES.initial.tc;
        } else {
            baseSetPrice = PRICES[customerType].set;
            extUnitCost = PRICES[customerType].ext;
            nomPrice = PRICES[customerType].nom;
            tcPrice = PRICES[customerType].tc;
        }

        // Apply Gold Ticket Override: Set fee is 0 for 2 hours, extension is 1000
        if (isGoldTicket) {
            baseSetPrice = 0;
            extUnitCost = 1000;
        }

        // Apply Set Half-Off (Manual Toggle OR Appreciation Day)
        // 新規、R（r_within, r_after）ではセット料金をいかなる場合でも半額にしない。（通常のみ適用）
        let appliedSetHalfOff = false;
        if ((isSetHalfOff || isAppreciationDay) && customerType === 'regular') {
            baseSetPrice = Math.floor(baseSetPrice / 2);
            extUnitCost = Math.floor(extUnitCost / 2);
            appliedSetHalfOff = true;
        }

        const nomTotal = nomPrice;
        // 新規では同伴料がかからないルールを適用
        const dohanTotal = (dohan && customerType !== 'initial') ? 3000 : 0;
        const tcTotal = tcPrice;
        const additionalNominationTotal = additionalNominationCount * 3000;

        const combinedNomAmount = nomTotal + dohanTotal;
        const nomLabel = dohanTotal > 0 ? '指名料+同伴料' : '指名料';

        // Orders Total - count > 0 のみ計算対象
        const activeOrders = orders.filter(o => o.count > 0);
        const totalItemsCount = activeOrders.reduce((sum, item) => sum + item.count, 0);

        // Tax Rate
        let taxRate = 0.35;
        if (customerType === 'initial' && totalItemsCount === 0) {
            taxRate = 0;
        }

        const ordersPreTaxTotal = activeOrders.reduce((sum, item) => {
            if (item.isTaxIncluded) {
                return sum + ((item.price * item.count) / (1 + taxRate));
            }
            return sum + (item.price * item.count);
        }, 0);

        // --- 指定時間での内訳を生成 ---
        const buildBreakdown = (durationHours: number): { breakdown: BreakdownItem[]; finalTotal: number } => {
            const initialSetHours = (isGoldTicket || customerType === 'r_within' || customerType === 'r_after') ? 2 : 1;
            const extensionCount = Math.max(0, durationHours - initialSetHours);
            const setAndExtTotal = baseSetPrice + (extensionCount * extUnitCost);

            const subTotal = setAndExtTotal + combinedNomAmount + tcTotal + additionalNominationTotal + ordersPreTaxTotal;
            const taxAmountRaw = subTotal * taxRate;
            const totalRaw = subTotal + taxAmountRaw;
            const finalTotal = Math.ceil(totalRaw / 100) * 100;

            // オーダーはT.Cの上に記載
            const breakdown: BreakdownItem[] = [
                { label: `セット料金${appliedSetHalfOff ? '(半額)' : ''} (延長込)`, amount: setAndExtTotal },
                ...activeOrders.map(o => {
                    const itemSubTotal = o.isTaxIncluded
                        ? (o.price * o.count) / (1 + taxRate)
                        : (o.price * o.count);
                    return {
                        label: `${o.name} x${o.count}`,
                        amount: Math.round(itemSubTotal)
                    };
                }),
                { label: 'T.C', amount: tcTotal },
                { label: nomLabel, amount: combinedNomAmount },
                { label: `複数指名料 (${additionalNominationCount}人)`, amount: additionalNominationTotal },
                { label: '小計 (課税対象)', amount: Math.round(subTotal), isTotal: true },
                { label: `TAX/SVC (${(taxRate * 100).toFixed(0)}%)`, amount: Math.ceil(taxAmountRaw), note: '(十の位以下切り上げ)' }
            ];

            return { breakdown, finalTotal };
        };

        // --- Generate Schedule ---
        const schedule: PriceScheduleItem[] = [];

        let loopTimeH = normalizedEntryH + 1;
        const loopTimeM = entryM;

        const entryTotalMins = normalizedEntryH * 60 + entryM;
        const loCapEnabled = options?.loCapEnabled ?? false;
        // LOキャップ: 24:38以降は延長料金を凍結するための最大延長時間
        const loCapDurationSets = loCapEnabled
            ? Math.ceil(Math.max(0, LO_CAP_NORMALIZED_MINS - entryTotalMins) / 60)
            : Infinity;

        while (loopTimeH < CLOSING_HOUR) {
            const duration = loopTimeH - normalizedEntryH;
            const loopTotalMins = loopTimeH * 60 + loopTimeM;
            // LOキャップ: この時刻が24:38を超えていたら延長を凍結
            const effectiveDuration = (loCapEnabled && loopTotalMins > LO_CAP_NORMALIZED_MINS)
                ? Math.min(duration, loCapDurationSets)
                : duration;
            const { finalTotal, breakdown: schBreakdown } = buildBreakdown(effectiveDuration);

            const displayH = loopTimeH >= 24 ? loopTimeH - 24 : loopTimeH;
            const displayM = loopTimeM.toString().padStart(2, '0');
            const timeLabel = `${displayH}:${displayM}`;

            schedule.push({
                timeLimit: timeLabel,
                totalPrice: finalTotal,
                breakdown: schBreakdown,
            });

            loopTimeH++;
        }

        // Closing Time (25:00 / 01:00)
        const closingTotalMins = CLOSING_HOUR * 60;
        const durationMins = closingTotalMins - entryTotalMins;
        const durationSets = Math.ceil(durationMins / 60);
        // LOキャップ: 閉店エントリも24:38時点の延長数で凍結
        const closingEffectiveSets = loCapEnabled ? Math.min(durationSets, loCapDurationSets) : durationSets;

        const { finalTotal: closingTotal, breakdown: closingBreakdown } = buildBreakdown(closingEffectiveSets);

        schedule.push({
            timeLimit: '01:00',
            totalPrice: closingTotal,
            breakdown: closingBreakdown,
        });

        // --- Current Total ---
        let currentDurationSets = 1;
        const currentTotalMins = normalizedCurrentH * 60 + currentM;
        const diffMins = currentTotalMins - entryTotalMins;

        if (diffMins > 0) {
            currentDurationSets = Math.ceil(diffMins / 60);
        }

        const { breakdown: currentBreakdown, finalTotal: currentFinalTotal } = buildBreakdown(currentDurationSets);

    return {
        currentTotal: currentFinalTotal,
        breakdown: currentBreakdown,
        schedule,
        taxRate,
        isOutOfHours
    };
}

export function useCalculator() {
    const [state, dispatch] = useReducer(calculatorReducer, INITIAL_STATE);

    return {
        state,
        result: calculateResult(state),
        dispatch,
    };
}
