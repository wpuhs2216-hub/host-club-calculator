import React from 'react';

interface DebugPanelProps {
    isDebugMode: boolean;
    currentTime: string;
    onDebugModeToggle: () => void;
    onCurrentTimeChange: (time: string) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
    isDebugMode,
    currentTime,
    onDebugModeToggle,
    onCurrentTimeChange
}) => {
    return (
        <div className="w-[280px] bg-[var(--card-bg)] border border-[var(--border-color)] rounded-xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <h3 className="mb-4 text-[var(--accent-color)] text-lg font-bold">
                デバッグモード
            </h3>

            {/* デバッグモード トグル */}
            <div
                onClick={onDebugModeToggle}
                className={`cursor-pointer bg-[var(--input-bg)] p-3 rounded-lg mb-4 flex justify-between items-center select-none transition-all border ${
                    isDebugMode ? 'border-[var(--accent-color)] shadow-[0_0_8px_rgba(212,175,55,0.2)]' : 'border-[var(--border-color)] hover:border-gray-500'
                }`}
            >
                <span className="font-bold">デバッグモード</span>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isDebugMode ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' : 'border-[var(--accent-color)] bg-transparent'
                }`}>
                    {isDebugMode && <span className="text-black font-bold text-sm leading-none">✓</span>}
                </div>
            </div>

            {/* 時間入力 */}
            {isDebugMode && (
                <div>
                    <label className="block mb-2 font-bold text-[var(--accent-color)] text-sm">
                        現在時間
                    </label>
                    <input
                        type="time"
                        value={currentTime}
                        onChange={(e) => onCurrentTimeChange(e.target.value)}
                        className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-color)] text-base outline-none focus:border-[var(--gold-color)] transition-colors [color-scheme:dark]"
                    />
                </div>
            )}
        </div>
    );
};
