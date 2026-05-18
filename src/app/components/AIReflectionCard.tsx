import React from 'react';

interface AIReflectionCardProps {
  aiReflection: string;
}

export function AIReflectionCard({ aiReflection }: AIReflectionCardProps) {
  // Parse the emoji-prefixed sections
  const sections = aiReflection.split('\n').filter(line => line.trim());
  
  // If no emojis found, try to split by sentences for fallback
  const parsedSections = sections.length >= 3 
    ? sections 
    : aiReflection.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()) || [aiReflection];

  const getEmoji = (text: string, index: number) => {
    if (text.includes('💭')) return '💭';
    if (text.includes('🌱')) return '🌱';
    if (text.includes('✨')) return '✨';
    return ['💭', '🌱', '✨'][index] || '💭';
  };

  const getLabel = (index: number) => {
    return ['Feeling seen', 'The reframe', 'Tiny step'][index] || 'Reflection';
  };

  const getGradient = (index: number) => {
    const gradients = [
      'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
      'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    ];
    return gradients[index] || gradients[0];
  };

  const getBorderColor = (index: number) => {
    return ['#e0c3fc', '#a7f3d0', '#fde68a'][index] || '#e0c3fc';
  };

  const getLabelColor = (index: number) => {
    return ['#8b5cf6', '#10b981', '#f59e0b'][index] || '#8b5cf6';
  };

  const getLabelBg = (index: number) => {
    return ['rgba(139, 92, 246, 0.1)', 'rgba(16, 185, 129, 0.1)', 'rgba(245, 158, 11, 0.1)'][index] || 'rgba(139, 92, 246, 0.1)';
  };

  const getBoldColor = (index: number) => {
    return ['#6b46c1', '#059669', '#d97706'][index] || '#6b46c1';
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <h3 style={{
        fontSize: '15px',
        fontWeight: 700,
        color: '#5a4a6a',
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          display: 'inline-block',
          animation: 'gentleBounce 2s ease-in-out infinite',
        }}>✨</span>
        AI Balanced Reflection
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {parsedSections.slice(0, 3).map((section, i) => {
          const cleanText = section.replace(/[💭🌱✨]/g, '').trim();
          const emoji = getEmoji(section, i);
          const label = getLabel(i);
          
          return (
            <div
              key={i}
              style={{
                background: getGradient(i),
                borderRadius: '20px',
                padding: '16px 20px',
                boxShadow: '0 2px 12px rgba(139, 92, 246, 0.08)',
                border: `2px solid ${getBorderColor(i)}`,
                transition: 'all 0.3s ease',
                marginLeft: `${i * 12}px`,
                position: 'relative',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(139, 92, 246, 0.15)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(139, 92, 246, 0.08)';
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}>
                <span style={{ fontSize: '20px', lineHeight: 1 }}>{emoji}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: getLabelColor(i),
                  background: getLabelBg(i),
                  padding: '3px 10px',
                  borderRadius: '12px',
                }}>
                  {label}
                </span>
              </div>
              <p style={{
                margin: 0,
                fontSize: '15px',
                lineHeight: 1.6,
                color: '#4a5568',
                fontWeight: 500,
              }}>
                {cleanText.split(/(\*\*.*?\*\*)/g).map((part, idx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={idx} style={{ color: getBoldColor(i) }}>
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={idx}>{part}</span>;
                })}
              </p>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-3px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}