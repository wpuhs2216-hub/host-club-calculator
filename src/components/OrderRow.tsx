import React from 'react';

interface OrderRowProps {
    label: string;
    price: number;
    count: number;
    onChange: (delta: number) => void;
}

export const OrderRow: React.FC<OrderRowProps> = ({ label, price, count, onChange }) => {
    return (
        <div className="flex justify-between items-center mb-3" style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
            <div>
                <div style={{ fontWeight: 'bold' }}>{label}</div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>¥{price.toLocaleString()}</div>
            </div>
            <div className="flex items-center">
                <button
                    onClick={() => onChange(-1)}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid var(--border-color)',
                        background: 'transparent',
                        color: '#fff',
                        fontSize: '1rem'
                    }}
                >-</button>
                <div style={{ width: '40px', textAlign: 'center', fontWeight: 'bold' }}>{count}</div>
                <button
                    onClick={() => onChange(1)}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'var(--accent-color)',
                        color: '#000',
                        fontSize: '1rem'
                    }}
                >+</button>
            </div>
        </div>
    );
};
