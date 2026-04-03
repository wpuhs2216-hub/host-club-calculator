import React from 'react';

interface LayoutProps {
    storeName?: string;
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ storeName, children }) => {
    return (
        <div className="max-w-2xl mx-auto px-4 pb-6" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 0px))' }}>
            <header className="text-center mb-4">
                <h1 className="text-2xl font-bold mb-1">
                    {storeName || '伝票計算'}
                    <span className="ml-2">伝票計算</span>
                </h1>
                <div className="w-20 h-px mx-auto bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent opacity-60"></div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
};
