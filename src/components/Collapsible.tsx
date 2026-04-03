import React, { useState } from 'react';

interface CollapsibleProps {
    title: string | React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export const Collapsible: React.FC<CollapsibleProps> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="mb-4 rounded-xl border border-[var(--border-color)] overflow-hidden" style={{ background: 'var(--input-bg)' }}>
            <button
                type="button"
                className="w-full flex justify-between items-center p-4 cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    background: isOpen ? 'rgba(0, 188, 212, 0.1)' : 'transparent',
                    color: isOpen ? 'var(--accent-color)' : 'var(--text-color)',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                }}
            >
                <div>{title}</div>
                <div style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease'
                }}>
                    ▼
                </div>
            </button>
            <div style={{
                maxHeight: isOpen ? '2000px' : '0px',
                opacity: isOpen ? 1 : 0,
                overflowY: 'hidden',
                overflowX: 'visible',
                transition: 'all 0.3s ease-in-out',
                padding: isOpen ? '12px' : '0 12px',
            }}>
                {children}
            </div>
        </div>
    );
};
