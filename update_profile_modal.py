import os
import re

file_path = 'client/components/ProfileModal.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Supabase import
content = content.replace("import cogniFX from '../utils/cogniFX';", "import cogniFX from '../utils/cogniFX';\nimport { supabase } from '../utils/supabaseClient';")

# 2. Add 'account' to the tabs list
content = content.replace("['overview', 'stats', 'ai report', 'badges', 'settings']", "['overview', 'stats', 'ai report', 'badges', 'account', 'settings']")

# 3. Add states and handlers for account
state_injection = '''  const [localDistractors, setLocalDistractors] = useState(cogniFX._distractorsEnabled !== false);

  // Account States
  const [demoLoaded, setDemoLoaded] = useState(false);
  const [course, setCourse] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [pwdStatus, setPwdStatus] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [accountMsg, setAccountMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (activeTab === 'account' && !demoLoaded) {
      fetch(${API_BASE}/api/auth/profile, {
        headers: { 'Authorization': Bearer  }
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          setCourse(data.profile.course || '');
          setAge(data.profile.age || '');
          setGender(data.profile.gender || '');
          setPwdStatus(data.profile.pwd_status || '');
          setDemoLoaded(true);
        }
      });
    }
  }, [activeTab, demoLoaded, token]);

  const handleUpdateProfile = async () => {
    setAccountMsg({ text: 'Saving...', type: 'info' });
    try {
      const res = await fetch(${API_BASE}/api/auth/update-profile, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': Bearer  
        },
        body: JSON.stringify({ course, age, gender, pwd_status: pwdStatus })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setAccountMsg({ text: 'Profile updated successfully!', type: 'success' });
      } else {
        setAccountMsg({ text: data.message, type: 'error' });
      }
    } catch(e) {
      setAccountMsg({ text: 'Network error.', type: 'error' });
    }
    setTimeout(() => setAccountMsg({ text: '', type: '' }), 3000);
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setAccountMsg({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }
    setAccountMsg({ text: 'Updating password...', type: 'info' });
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setAccountMsg({ text: error.message, type: 'error' });
    } else {
      setAccountMsg({ text: 'Password updated successfully!', type: 'success' });
      setNewPassword('');
    }
    setTimeout(() => setAccountMsg({ text: '', type: '' }), 3000);
  };'''

content = content.replace("  const [localDistractors, setLocalDistractors] = useState(cogniFX._distractorsEnabled !== false);", state_injection)

# 4. Add the Account Tab UI
account_ui = '''              {activeTab === 'account' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.3s ease-out' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#f8fafc', margin: '0 0 1rem 0' }}>Edit Demographics</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <input type="text" placeholder="Course / Program (e.g. BSCS)" value={course} onChange={e=>setCourse(e.target.value)} style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', padding: '0.7rem', width: '100%', boxSizing: 'border-box' }} />
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="number" placeholder="Age" value={age} onChange={e=>setAge(e.target.value)} style={{ flex: 1, background: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', padding: '0.7rem' }} />
                        <select value={gender} onChange={e=>setGender(e.target.value)} style={{ flex: 1, background: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', padding: '0.7rem' }}>
                          <option value="" disabled>Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                      </div>
                      <select value={pwdStatus} onChange={e=>setPwdStatus(e.target.value)} style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', padding: '0.7rem', width: '100%' }}>
                        <option value="" disabled>PWD Status (Person with Disability)</option>
                        <option value="None">None</option>
                        <option value="Visual Impairment">Visual Impairment</option>
                        <option value="Hearing Impairment">Hearing Impairment</option>
                        <option value="Motor/Physical Disability">Motor/Physical Disability</option>
                        <option value="Cognitive/Learning Disability">Cognitive/Learning Disability</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                      <button onClick={handleUpdateProfile} style={{ background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>Save Demographics</button>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1.5rem', borderRadius: '12px' }}>
                    <h3 style={{ color: '#f8fafc', margin: '0 0 1rem 0' }}>Security</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Change Password</label>
                      <input type="password" placeholder="New Password (min 6 characters)" value={newPassword} onChange={e=>setNewPassword(e.target.value)} style={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: '#ffffff', padding: '0.7rem', width: '100%', boxSizing: 'border-box' }} />
                      <button onClick={handleUpdatePassword} style={{ background: 'var(--color-secondary)', color: '#fff', border: 'none', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>Update Password</button>
                    </div>
                  </div>

                  {accountMsg.text && (
                    <div style={{ background: accountMsg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(74, 222, 128, 0.1)', color: accountMsg.type === 'error' ? '#fca5a5' : '#4ade80', padding: '1rem', borderRadius: '8px', textAlign: 'center', border: accountMsg.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(74, 222, 128, 0.3)' }}>
                      {accountMsg.text}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && ('''

content = content.replace("{activeTab === 'settings' && (", account_ui)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated ProfileModal.jsx")
