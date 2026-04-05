import React from 'react';

interface LayoutProps {
    storeName?: string;
    children: React.ReactNode;
    wide?: boolean;
    fullHeight?: boolean;
    headerLeft?: React.ReactNode;
    headerRight?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ storeName, children, wide, fullHeight, headerLeft, headerRight }) => {
    return (
        <div className={`${wide ? 'max-w-[1400px]' : 'max-w-6xl'} mx-auto px-4 ${fullHeight ? 'h-screen flex flex-col overflow-hidden' : 'pb-6'}`} style={{ paddingTop: 'max(1.5rem, calc(env(safe-area-inset-top, 0px) + 0.5rem))' }}>
            <header className="mb-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="shrink-0">{headerLeft}</div>
                    <h1 className="text-xl font-bold mb-1 text-center flex-1">
                        {storeName || '伝票計算'}
                        <span className="ml-2 text-base opacity-60">伝票計算</span>
                    </h1>
                    <div className="shrink-0">{headerRight}</div>
                </div>
                <div className="w-20 h-px mx-auto bg-gradient-to-r from-transparent via-[var(--accent-color)] to-transparent opacity-60"></div>
            </header>
            <main className={fullHeight ? 'flex-1 min-h-0' : ''}>
                {children}
            </main>
        </div>
    );
};
