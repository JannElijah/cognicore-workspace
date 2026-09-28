import os

filepath = r'd:\cognicore-workspace\client\components\ProfileModal.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useMemo import
if "useMemo" not in content:
    content = content.replace("import React, { useState, useEffect }", "import React, { useState, useEffect, useMemo }")

# Add useMemo to radarData
radar_old = '''  const radarData = {
    labels: domainStats.map(d => (d.cognitive_domain || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')),
    datasets: [{
      label: 'Accuracy %',
      data: domainStats.map(d => (d.avg_accuracy * 100).toFixed(1)),
      backgroundColor: 'rgba(var(--rgb-primary), 0.4)',
      borderColor: 'rgba(var(--rgb-primary), 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(var(--rgb-primary), 1)',
    }]
  };'''
radar_new = '''  const radarData = useMemo(() => ({
    labels: domainStats.map(d => (d.cognitive_domain || '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')),
    datasets: [{
      label: 'Accuracy %',
      data: domainStats.map(d => (d.avg_accuracy * 100).toFixed(1)),
      backgroundColor: 'rgba(var(--rgb-primary), 0.4)',
      borderColor: 'rgba(var(--rgb-primary), 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(var(--rgb-primary), 1)',
    }]
  }), [domainStats]);'''
content = content.replace(radar_old, radar_new)

# Add useMemo to lineData
line_old = '''  const lineData = {
    labels: timelineStats.map(d => {
      const dateObj = new Date(d.day);
      return isNaN(dateObj.getTime()) ? d.day : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{ 
      label: metricToggle === 'accuracy' ? 'Accuracy (%)' : 'Reaction Time (ms)', 
      data: timelineStats.map(d => metricToggle === 'accuracy' ? (d.avg_accuracy * 100).toFixed(1) : d.avg_rt), 
      borderColor: metricToggle === 'accuracy' ? '#10b981' : 'var(--color-secondary)', 
      backgroundColor: metricToggle === 'accuracy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(var(--rgb-secondary), 0.2)', 
      fill: true, 
      tension: 0.4 
    }]
  };'''
line_new = '''  const lineData = useMemo(() => ({
    labels: timelineStats.map(d => {
      const dateObj = new Date(d.day);
      return isNaN(dateObj.getTime()) ? d.day : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{ 
      label: metricToggle === 'accuracy' ? 'Accuracy (%)' : 'Reaction Time (ms)', 
      data: timelineStats.map(d => metricToggle === 'accuracy' ? (d.avg_accuracy * 100).toFixed(1) : d.avg_rt), 
      borderColor: metricToggle === 'accuracy' ? '#10b981' : 'var(--color-secondary)', 
      backgroundColor: metricToggle === 'accuracy' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(var(--rgb-secondary), 0.2)', 
      fill: true, 
      tension: 0.4 
    }]
  }), [timelineStats, metricToggle]);'''
content = content.replace(line_old, line_new)

# Add useMemo to scatterData
scatter_old = '''  const scatterData = {
    datasets: [
      {
        label: 'Fast Learner Core',
        data: [{ x: 950, y: 85 }],
        backgroundColor: 'rgba(var(--rgb-primary), 0.1)',
        borderColor: 'rgba(var(--rgb-primary), 0.4)',
        pointRadius: 40,
        pointHoverRadius: 40
      },
      {
        label: 'Plateauing Core',
        data: [{ x: 1200, y: 65 }],
        backgroundColor: 'rgba(192, 132, 252, 0.1)',
        borderColor: 'rgba(192, 132, 252, 0.4)',
        pointRadius: 40,
        pointHoverRadius: 40
      },
      {
        label: 'High Fatigue Core',
        data: [{ x: 2000, y: 40 }],
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
        pointRadius: 40,
        pointHoverRadius: 40
      },
      {
        label: 'Your Position',
        data: [{ 
          x: timelineStats.length > 0 ? timelineStats.reduce((acc, curr) => acc + curr.avg_rt, 0) / timelineStats.length : 1200, 
          y: kpis.overall_accuracy * 100 || 60
        }],
        backgroundColor: '#ffffff',
        borderColor: '#ffffff',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'circle'
      }
    ]
  };'''
scatter_new = '''  const scatterData = useMemo(() => ({
    datasets: [
      {
        label: 'Fast Learner Core',
        data: [{ x: 950, y: 85 }],
        backgroundColor: 'rgba(var(--rgb-primary), 0.1)',
        borderColor: 'rgba(var(--rgb-primary), 0.4)',
        pointRadius: 40,
        pointHoverRadius: 40
      },
      {
        label: 'Plateauing Core',
        data: [{ x: 1200, y: 65 }],
        backgroundColor: 'rgba(192, 132, 252, 0.1)',
        borderColor: 'rgba(192, 132, 252, 0.4)',
        pointRadius: 40,
        pointHoverRadius: 40
      },
      {
        label: 'High Fatigue Core',
        data: [{ x: 2000, y: 40 }],
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
        pointRadius: 40,
        pointHoverRadius: 40
      },
      {
        label: 'Your Position',
        data: [{ 
          x: timelineStats.length > 0 ? timelineStats.reduce((acc, curr) => acc + curr.avg_rt, 0) / timelineStats.length : 1200, 
          y: kpis.overall_accuracy * 100 || 60
        }],
        backgroundColor: '#ffffff',
        borderColor: '#ffffff',
        pointRadius: 6,
        pointHoverRadius: 8,
        pointStyle: 'circle'
      }
    ]
  }), [timelineStats, kpis]);'''
content = content.replace(scatter_old, scatter_new)

# Replace Loading Text with Skeleton
skeleton_old = '''          {loading ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Loading profile data...</div>
          ) : ('''
skeleton_new = '''          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', opacity: 0.7 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="skeleton-box" style={{ height: '80px', borderRadius: '12px' }}></div>
                <div className="skeleton-box" style={{ height: '80px', borderRadius: '12px' }}></div>
                <div className="skeleton-box" style={{ height: '80px', borderRadius: '12px' }}></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="skeleton-box" style={{ height: '300px', borderRadius: '12px' }}></div>
                <div className="skeleton-box" style={{ height: '300px', borderRadius: '12px' }}></div>
              </div>
            </div>
          ) : ('''
content = content.replace(skeleton_old, skeleton_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
