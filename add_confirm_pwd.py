import os
import re

file_path = 'client/components/LoginFlow.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state
content = content.replace("const [passwordInput, setPasswordInput] = useState('');", "const [passwordInput, setPasswordInput] = useState('');\n  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');")

# 2. Add validation
validation_old = '''      if (!passwordInput) {
        setFormError("Password is required.");
        return;
      }
      handleCheckUserStatus(usernameInput, null, null, null, null, passwordInput, isSignUp);'''
validation_new = '''      if (!passwordInput) {
        setFormError("Password is required.");
        return;
      }
      if (isSignUp && passwordInput !== confirmPasswordInput) {
        setFormError("Passwords do not match.");
        return;
      }
      handleCheckUserStatus(usernameInput, null, null, null, null, passwordInput, isSignUp);'''
content = content.replace(validation_old, validation_new)

# 3. Add UI element
ui_target = '''                </button>
              </div>
            </div>
          </div>
        ) : ('''

ui_new = '''                </button>
              </div>
            </div>
            
            {isSignUp && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Confirm Password</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPasswordInput} 
                    onChange={(e) => setConfirmPasswordInput(e.target.value)} 
                    placeholder="Confirm password" 
                    style={{ minHeight: '44px', background: '#09090b', border: '1.5px solid rgba(var(--rgb-secondary), 0.4)', borderRadius: '8px', color: '#ffffff', padding: '0.75rem', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !assessmentLoading && agreed) {
                        submitLogin();
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : ('''

content = content.replace(ui_target, ui_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated LoginFlow.jsx")
