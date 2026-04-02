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
        <div style={{
            width: '280px',
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}>
            <h3 style={{
                marginBottom: '16px',
                color: 'var(--accent-color)',
                fontSize: '1.1rem',
                fontWeight: 'bold'
            }}>
                デバッグモード
            </h3>

            {/* Debug Mode Toggle */}
            <div
                onClick={onDebugModeToggle}
                style={{
                    cursor: 'pointer',
                    background: 'var(--input-bg)',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: isDebugMode ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                    marginBottom: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <span style={{ fontWeight: 'bold' }}>デバッグモード</span>
                <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: '2px solid var(--accent-color)',
                    background: isDebugMode ? 'var(--accent-color)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {isDebugMode && <span style={{ color: '#000', fontWeight: 'bold' }}>✓</span>}
                </div>
            </div>

            {/* Current Time Input */}
            {isDebugMode && (
                <div>
                    <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: 'bold',
                        color: 'var(--accent-color)',
                        fontSize: '0.9rem'
                    }}>
                        現在時間
                    </label>
                    <input
                        type="time"
                        value={currentTime}
                        onChange={(e) => onCurrentTimeChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-color)',
                            fontSize: '1rem',
                            outline: 'none',
                            colorScheme: 'dark'
                        }}
                    />
                </div>
            )}
        </div>
    );
};
