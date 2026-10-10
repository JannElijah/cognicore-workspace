import React, { useState } from 'react';
import HoverTooltip from './HoverTooltip';
import { SvgGameIcon } from '../utils/constants';

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
        Our scoring algorithms are aligned with standard clinical neuropsychological baselines. Your score isn't just about speed — accuracy is heavily weighted. We also track <HoverTooltip content="Rapid, inaccurate tapping used to artificially inflate speed metrics."><strong style={{color: 'var(--color-primary)', cursor:'pointer', borderBottom:'1px dashed rgba(var(--rgb-primary),0.6)'}}>'spam clicking'</strong></HoverTooltip> and 'latency' to measure your decision-making methodicalness versus impulsivity. This creates a holistic view of your cognitive playstyle.
      </p>
    )
  },
  {
    id: 'domains',
    title: 'Cognitive Domains',
    color: '#f472b6',
    content: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
        
        {/* Reflexes */}
        <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SvgGameIcon name="Lightning" color="#ef4444" />
            <strong style={{ color: '#ef4444', fontSize: '1.05rem' }}>Reflexes & Focus</strong>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, flex: 1 }}>Enhancing reaction speed, sustained vigilance, and resistance to visual distractors.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto' }}>
            {['Speed Tap', 'Focus Finder', 'Stroop Shift'].map(m => (
              <span key={m} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Memory */}
        <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SvgGameIcon name="Brain" color="#06b6d4" />
            <strong style={{ color: '#06b6d4', fontSize: '1.05rem' }}>Spatial-Visual Memory</strong>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, flex: 1 }}>Training working memory, object permanence, and spatial manipulation.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto' }}>
            {['Memory Match', 'Matrix Recall', 'Synapse Spin', 'Nexus Mapper'].map(m => (
              <span key={m} style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#22d3ee', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Reasoning */}
        <div style={{ background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(20, 184, 166, 0.2)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SvgGameIcon name="Numbers" color="#14b8a6" />
            <strong style={{ color: '#14b8a6', fontSize: '1.05rem' }}>Logical-Mathematical</strong>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, flex: 1 }}>Sharpening inductive logic, math skills, and analytical problem-solving.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto' }}>
            {['Logic Link', 'Equation Balance', 'Sequence Decoder', 'Route Opt.'].map(m => (
              <span key={m} style={{ background: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{m}</span>
            ))}
          </div>
        </div>

        {/* Executive */}
        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SvgGameIcon name="Compass" color="#10b981" />
            <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>Executive Strategy</strong>
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, flex: 1 }}>Training adaptive control, dynamic plan correction, and multi-priority switching.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: 'auto' }}>
            {['Priority Queue', 'Neuro Maze', 'Mental Flex'].map(m => (
              <span key={m} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
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
  },
  {
    id: 'research',
    title: 'Scientific Research & Color Psychology (RRL)',
    color: '#38bdf8',
    content: (
      <div style={{ color: '#e2e8f0', lineHeight: '1.6', margin: 0 }}>
        <p style={{ marginBottom: '1rem' }}>
          CogniCore is built upon validated clinical studies. Our platform specifically utilizes targeted color psychology to alter psychological arousal and optimize cognitive focus depending on the task:
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#ef4444' }}>High-Saturation Red (Reflexes & Focus):</strong> Triggers increased physiological arousal and captures early attentional resources. Utilized in fast-paced modules to maximize reaction time and motor velocity. 
            <br/><span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Citation: Wang, Y., & Chen, Y. (2022). Influence of Background Color on Attention.</span>
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#06b6d4' }}>Cool Blues (Spatial Memory):</strong> Induces an "approach motivation" that lowers cognitive load, accelerating post-stress relaxation and enhancing complex pattern visualization.
            <br/><span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Citation: Xu, Z. (2024). Impact and Emotional Resonance of Colors on Mood.</span>
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#10b981' }}>Muted Greens (Logic & Strategy):</strong> Backed by "Attention Restoration Theory", it reduces visual and cognitive fatigue, acting as a mental micro-break during prolonged problem-solving tasks.
            <br/><span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Citation: Schertz, K. E., & Berman, M. G. (2021). Understanding Nature and Its Cognitive Benefits.</span>
          </li>
        </ul>
        <p style={{ fontSize: '0.9em', color: '#cbd5e1', fontStyle: 'italic', borderLeft: '3px solid #38bdf8', paddingLeft: '10px' }}>
          The global UI utilizes a "Deep Blue" primary layout to mitigate generalized "test anxiety", creating a calm environment for users to review their cognitive analytics without stress.
        </p>
      </div>
    )
  },
  {
    id: 'rrl_dda',
    title: 'Scientific Research: AI & Adaptive Difficulty (RRL)',
    color: '#c084fc',
    content: (
      <div style={{ color: '#e2e8f0', lineHeight: '1.6', margin: 0 }}>
        <p style={{ marginBottom: '1rem' }}>
          The machine learning and dynamic difficulty mechanics driving CogniCore are substantiated by recent developments in artificial intelligence and serious game design:
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#f8fafc' }}>Dynamic Difficulty Adjustment (DDA):</strong> Real-time adaptation significantly improves immersion, user engagement, and learning efficiency while preventing test frustration.
            <br/><span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Citations: Moon & Seo (2020); Chiotaki, Poulopoulos, & Karpouzis (2023).</span>
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#f8fafc' }}>AI-Driven Behavioral Analytics:</strong> Machine Learning approaches allow for the identification of meaningful behavioral patterns beyond numerical scoring, providing deeper cognitive profiling.
            <br/><span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Citation: Ahmad et al. (2023). A pilot study on the evaluation of cognitive abilities’ cluster.</span>
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#f8fafc' }}>Cognitive Categorization:</strong> Using algorithms (like Random Forest) enables accurate, personalized performance evaluation and qualitative feedback generation.
            <br/><span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Citation: Tolks, Schmidt, & Kuhn (2024). The role of AI in serious games.</span>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'rrl_validity',
    title: 'Scientific Research: Game-Based Validity (RRL)',
    color: '#4ade80',
    content: (
      <div style={{ color: '#e2e8f0', lineHeight: '1.6', margin: 0 }}>
        <p style={{ marginBottom: '1rem' }}>
          CogniCore replaces traditional neuropsychological tests with interactive domains. This methodology is supported by extensive literature confirming the clinical and diagnostic validity of serious games:
        </p>
        <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#f8fafc' }}>Anxiety Reduction & Motivation:</strong> Game-based assessments drastically reduce "test anxiety" and increase user participation and motivation compared to static clinical tests.
            <br/><span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Citations: Berg (2021); Vasconcelos et al. (2024).</span>
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#f8fafc' }}>Diagnostic Equivalence:</strong> 3D mobile games and virtual reality cognitive assessments have been validated against traditional tools (like ACE-III), effectively evaluating memory, attention, and executive functions.
            <br/><span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Citation: Bhargava, Kottapalli, & Baths (2024). Scientific Reports.</span>
          </li>
          <li style={{ marginBottom: '0.75rem' }}>
            <strong style={{ color: '#f8fafc' }}>Specific Domain Testing:</strong> Mechanics like Route Optimization and Stroop-based conflict tasks are proven to reliably measure logical reasoning, inhibitory control, and strategic planning.
            <br/><span style={{ fontSize: '0.85em', color: '#94a3b8' }}>Citations: Nogueira et al. (2021); Müller et al. (2024).</span>
          </li>
        </ul>
      </div>
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
        maxHeight: isOpen ? '2000px' : '0px',
        opacity: isOpen ? 1 : 0,
        transition: 'all 0.3s ease-in-out',
        padding: isOpen ? '0 1.25rem 1.25rem 1.25rem' : '0 1.25rem',
      }}>
        <div style={{ paddingTop: '0.5rem', borderTop: `1px solid ${item.color}33` }}>
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

      <div className="kb-grid" style={{ display: 'grid', gap: '2rem', alignItems: 'start' }}>
        
        {/* Main Content Area */}
        <div style={{ flex: 1 }} className="kb-main-col">
          
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
                 <li key={`toc-${item.id}`}>
                   <a 
                     href={`#${item.id}`} 
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

      <style dangerouslySetInnerHTML={{__html: `
        .kb-grid { grid-template-columns: 1fr; }
        @media (min-width: 1024px) {
          .kb-grid { grid-template-columns: 2fr 1fr !important; }
          .kb-main-col { grid-column: 1 !important; }
          .kb-sidebar { display: block !important; grid-column: 2 !important; }
        }
      `}} />
    </div>
  );
}
