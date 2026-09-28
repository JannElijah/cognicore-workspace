import os

filepath = r'd:\cognicore-workspace\client\components\Shop.jsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add processing state
state_old = "const [purchaseMsg, setPurchaseMsg] = useState(null);"
state_new = "const [purchaseMsg, setPurchaseMsg] = useState(null);\n  const [processingId, setProcessingId] = useState(null);"
content = content.replace(state_old, state_new)

# Add setProcessingId to handlePurchase
purchase_old = '''  const handlePurchase = async (itemId) => {
    audioEngine.playClick();
    setPurchaseMsg(null);'''
purchase_new = '''  const handlePurchase = async (itemId) => {
    if (processingId) return;
    audioEngine.playClick();
    setPurchaseMsg(null);
    setProcessingId(itemId);'''
content = content.replace(purchase_old, purchase_new)

purchase_catch_old = '''    } catch (err) {
      audioEngine.playError();
      setPurchaseMsg('Error during purchase.');
    }
  };'''
purchase_catch_new = '''    } catch (err) {
      audioEngine.playError();
      setPurchaseMsg('Error during purchase.');
    } finally {
      setProcessingId(null);
    }
  };'''
content = content.replace(purchase_catch_old, purchase_catch_new)

# Disable buy button
button_old = '''                          <button
                            onClick={() => handlePurchase(item.id)}
                            disabled={coins < item.price}
                            style={{'''
button_new = '''                          <button
                            onClick={() => handlePurchase(item.id)}
                            disabled={coins < item.price || processingId === item.id}
                            style={{
                              opacity: processingId === item.id ? 0.5 : 1,'''
content = content.replace(button_old, button_new)

# Update buy text
text_old = '''                          >
                            Buy
                          </button>'''
text_new = '''                          >
                            {processingId === item.id ? 'Processing...' : 'Buy'}
                          </button>'''
content = content.replace(text_old, text_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
