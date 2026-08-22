import shutil
import datetime
import os

def backup():
    src = "cognicore.db"
    if not os.path.exists(src):
        print("Error: cognicore.db not found. Run this from the server directory.")
        return
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    dst = f"cognicore_backup_{timestamp}.db"
    shutil.copy2(src, dst)
    print(f"Success! Database safely backed up to: {dst}")

if __name__ == "__main__":
    backup()
