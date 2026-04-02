import React from 'react';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="container">
            <header className="text-center mb-4">
                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>伝票計算システム</h1>
                <div style={{ width: '60px', height: '2px', background: 'var(--accent-color)', margin: '0 auto' }}></div>
            </header>
            <main>
                {children}
            </main>
        </div>
    );
};
