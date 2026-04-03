import React from 'react';
import { APP_VERSION, RELEASE_NOTES } from '../version';

interface UpdateNoticeProps {
    onClose: () => void;
}

export const UpdateNotice: React.FC<UpdateNoticeProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <div
                className="bg-[var(--card-bg)] border border-[var(--gold-color)] rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(255,215,0,0.15)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center mb-4">
                    <div className="text-2xl mb-1">✦</div>
                    <div className="text-lg font-bold text-[var(--gold-color)]">アップデート</div>
                    <div className="text-sm text-gray-400 mt-1">v{APP_VERSION}</div>
                </div>

                <ul className="mb-6 space-y-2">
                    {RELEASE_NOTES.map((note, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-[var(--gold-color)] mt-0.5">•</span>
                            <span>{note}</span>
                        </li>
                    ))}
                </ul>

                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-[var(--gold-color)] text-black font-bold text-base border-none cursor-pointer hover:opacity-90 transition-opacity"
                >
                    OK
                </button>
            </div>
        </div>
    );
};
