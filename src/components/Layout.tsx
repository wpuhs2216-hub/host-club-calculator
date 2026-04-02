import React from 'react';

interface LayoutProps {
    storeName?: string;
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ storeName, children }) => {
    return (
        <div className="max-w-2xl mx-auto px-4 py-6">
            <header className="text-center mb-4">
                <h1 className="text-2xl font-bold mb-1">{storeName || '伝票計算システム'}</h1>
                <div className="w-16 h-0.5 bg-[var(--accent-color)] mx-auto"></div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
};
