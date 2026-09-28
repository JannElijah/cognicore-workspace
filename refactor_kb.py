import os

filepath = r'd:\cognicore-workspace\client\components\KnowledgeBase.jsx'

jsx_content = '''import React, { useState } from 'react';
import HoverTooltip from './HoverTooltip';

const KNOWLEDGE_DATA = [
  {
    id: 'dda',
    title: 'What is Adaptive Task Staircasing?',
    color: '#c084fc',
    content: (
      <p style={{ color: '#e2e8f0', lineHeight: '1.6', margin: 0 }}>
        Adaptive Task Staircasing is our <HoverTooltip content="An algorithmic system that scales challenge based on performance telemetry."><strong style={{color: '#c084fc', cursor:'pointer', borderBottom:'1px dashed rgba(192,132,252,0.6)'}}>Dynamic Difficulty Adjustment (DDA)</strong></HoverTooltip> engine. It constantly analyzes your performance telemetry (reaction times, accuracy, and hesitation) in real-time. If you perform well consecutively, the difficulty increases (e.g. less time, more distractors). If you struggle, the game scales down the difficulty to prevent frustration and keep you in the optimal learning zone.
      </p>
    )
  },
  {
    id: 'scoring',
    title: 'Scoring & Standardized Metrics',
    color: 'var(--color-primary)',
    content: (
      <p style={{ color: '#e2e8f0', lineHeight: '1.6', margin: 0 }}>
        Our scoring algorithms are aligned with standard clinical neuropsychological baselines. Your score isn\\'t just about speed — accuracy is heavily weighted. We also track <HoverTooltip content="Rapid, inaccurate tapping used to artificially inflate speed metrics."><strong style={{color: 'var(--color-primary)', cursor:'pointer', borderBottom:'1px dashed rgba(var(--rgb-primary),0.6)'}}>'spam clicking'</strong></HoverTooltip> and 'latency' to measure your decision-making methodicalness versus impulsivity. This creates a holistic view of your cognitive playstyle.
      </p>
    )
  },
  {
    id: 'domains',
    title: 'Cognitive Domains',
    color: '#f472b6',
    content: (
      <ul style={{ color: '#e2e8f0', lineHeight: '1.6', paddingLeft: '1.5rem', margin: 0 }}>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#f8fafc' }}>Spatial-Visual Memory:</strong> Training working memory and object permanence (e.g. Memory Match, Sequence Decoder).</li>
        <li style={{ marginBottom: '0.5rem' }}><strong style={{ color: '#f8fafc' }}>Reflex & Attentional Focus:</strong> Enhancing reaction times and sustained vigilance against visual distractors (e.g. Speed Tap, Focus Finder).</li>
        <li><strong style={{ color: '#f8fafc' }}>Logical-Mathematical Strategy:</strong> Problem-solving and dynamic rule-shifting tasks (e.g. Mental Flex, Logic Link).</li>
      </ul>
    )
  },
  {
    id: 'settings',
    title: 'Settings & Accessibility',
    color: '#10b981',
    content: (
      <p style={{ color: '#e2e8f0', lineHeight: '1.6', margin: 0 }}>
        You can customize your experience by clicking your Profile avatar in the top right. In the <strong>Settings</strong> tab, you can disable flashing visual effects, control the master audio volume, and toggle <HoverTooltip content="On-screen visual noise designed to intensely test your concentration."><strong style={{color: '#10b981', cursor:'pointer', borderBottom:'1px dashed rgba(16,185,129,0.6)'}}>Adaptive Distractors</strong></HoverTooltip> (background noise/glitches) used in high-difficulty levels.
      </p>
    )
  }
];

const AccordionItem = ({ item, isOpen, onClick }) => {
  return (
    <div className="game-card" style={{ marginBottom: '1rem', background: 'rgba(30, 41, 59, 0.7)', overflow: 'hidden', padding: 0 }} id={item.id}>
      <button 
        onClick={onClick}
        style={{ 
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1.25rem', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left'
        }}
      >
        <h2 style={{ color: item.color, margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {item.title}
        </h2>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease', color: '#94a3b8' }}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      <div style={{
        maxHeight: isOpen ? '500px' : '0px',
        opacity: isOpen ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        padding: isOpen ? '0 1.25rem 1.25rem 1.25rem' : '0 1.25rem',
      }}>
        <div style={{ paddingTop: '0.5rem', borderTop: 1px solid 33 }}>
          {item.content}
        </div>
      </div>
    </div>
  );
};

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState({ dda: true }); // First one open by default

  const toggleItem = (id) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredData = KNOWLEDGE_DATA.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#f8fafc', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          Knowledge Base
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Documentation and reference guides for CogniCore training modules.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', alignItems: 'start' }}>
        
        {/* Main Content Area */}
        <div style={{ flex: 1, gridColumn: '1 / -1' }} className="kb-main-col">
          
          {/* Sticky Search Bar */}
          <div style={{ position: 'sticky', top: '10px', zIndex: 10, marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '1rem 1rem 1rem 3rem',
                  background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: '#f8fafc', fontSize: '1rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          </div>

          {/* Accordion List */}
          <div>
            {filteredData.length > 0 ? (
              filteredData.map(item => (
                <AccordionItem 
                  key={item.id} 
                  item={item} 
                  isOpen={openItems[item.id] || (searchQuery.length > 0)} // Auto-open if searching
                  onClick={() => toggleItem(item.id)}
                />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', color: '#64748b' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem', opacity: 0.5 }}><circle cx="12" cy="12" r="10"></circle><path d="M16 16s-1.5-2-4-2-4 2-4 2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
                <p>No documentation found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table of Contents Sidebar */}
        <div className="kb-sidebar" style={{ display: 'none' }}>
           <div style={{ position: 'sticky', top: '10px', background: 'rgba(15, 23, 42, 0.5)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <h3 style={{ fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Contents</h3>
             <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               {KNOWLEDGE_DATA.map(item => (
                 <li key={	oc-}>
                   <a 
                     href={#} 
                     onClick={(e) => {
                       e.preventDefault();
                       document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                       setOpenItems(prev => ({ ...prev, [item.id]: true }));
                     }}
                     style={{ color: '#cbd5e1', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                     onMouseOver={(e) => e.currentTarget.style.color = item.color}
                     onMouseOut={(e) => e.currentTarget.style.color = '#cbd5e1'}
                   >
                     <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: item.color }}></span>
                     {item.title}
                   </a>
                 </li>
               ))}
             </ul>
           </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: 
        @media (min-width: 1024px) {
          .kb-main-col { grid-column: 1 !important; flex: none !important; width: 700px; }
          .kb-sidebar { display: block !important; }
        }
      }} />
    </div>
  );
}
'''

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(jsx_content)

print("Replaced KnowledgeBase.jsx successfully.")
