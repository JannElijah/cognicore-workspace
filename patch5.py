import io

with io.open('client/components/AppNavigation.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add to the desktop navigation (portals array)
desktop_portals_target = """{ id: 'knowledge', label: 'Knowledge Base', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zm20 0h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, color: 'var(--color-secondary)' }
                  ]"""
desktop_portals_replace = """{ id: 'knowledge', label: 'Knowledge Base', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3zm20 0h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>, color: 'var(--color-secondary)' },
                    { id: 'admin', label: 'Admin Dashboard', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>, color: '#f59e0b' }
                  ]"""
content = content.replace(desktop_portals_target, desktop_portals_replace)

# Add to the mobile navigation
mobile_nav_target = """          <button
            className={`mobile-nav-item${portalView === 'researcher' ? ' active' : ''}`}
            onClick={() => { setPortalView('researcher'); closeDrawer(); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor"/></svg>
            Researcher Portal
          </button>"""
mobile_nav_replace = mobile_nav_target + """\n          <button
            className={`mobile-nav-item${portalView === 'admin' ? ' active' : ''}`}
            onClick={() => { setPortalView('admin'); closeDrawer(); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Admin Dashboard
          </button>"""
content = content.replace(mobile_nav_target, mobile_nav_replace)

with io.open('client/components/AppNavigation.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('AppNavigation patched')
