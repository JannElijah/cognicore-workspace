import os

filepath = r'd:\cognicore-workspace\client\components\Shop.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add activeTab state
state_old = "const [processingId, setProcessingId] = useState(null);"
state_new = "const [processingId, setProcessingId] = useState(null);\n  const [activeTab, setActiveTab] = useState('Themes');"
content = content.replace(state_old, state_new)

# 2. Inject Tabs UI under the purchaseMsg
tabs_ui = '''
          {/* Category Tabs */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid #1e293b', paddingBottom: '1rem' }}>
            {['Themes', 'Avatars', 'Banners'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: activeTab === tab ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  color: activeTab === tab ? 'var(--color-primary)' : '#94a3b8',
                  border: activeTab === tab ? '1px solid var(--color-primary)' : '1px solid transparent',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '999px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: activeTab === tab ? '0 0 10px rgba(56, 189, 248, 0.2)' : 'none'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
'''
content = content.replace("          {['Themes', 'Avatars', 'Banners'].map(category => (", tabs_ui + "\n          {[activeTab].map(category => (")

# 3. Add Optimistic UI to handleEquip
equip_old = '''    try {
      const res = await fetch(${API_BASE}/api/equip, {'''
equip_new = '''    // Optimistic UI update (Instant visual feedback)
    const previousInventory = [...inventory];
    const targetItem = SHOP_ITEMS.find(i => i.id === itemId);
    if (targetItem) {
        setInventory(inventory.map(item => ({
            ...item,
            is_equipped: (item.item_type === targetItem.type) ? (item.item_id === itemId) : item.is_equipped
        })));
    }

    try {
      const res = await fetch(${API_BASE}/api/equip, {'''
content = content.replace(equip_old, equip_new)

equip_catch_old = '''      if (data.status === 'success') {
        // Update local state to reflect equipping
        setInventory(inventory.map(item => ({
          ...item,
          is_equipped: (item.item_type === data.item_type) ? (item.item_id === itemId) : item.is_equipped
        })));
        fetchInventory(); // Sync global
      }
    } catch (err) {
      console.error(err);
    }
  };'''
equip_catch_new = '''      if (data.status === 'success') {
        fetchInventory(); // Sync global in background
      } else {
        setInventory(previousInventory); // Rollback on failure
      }
    } catch (err) {
      console.error(err);
      setInventory(previousInventory); // Rollback on failure
    }
  };'''
content = content.replace(equip_catch_old, equip_catch_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
