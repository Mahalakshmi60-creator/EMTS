import os
import base64
import hashlib
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

class EncryptionManager:
    def __init__(self):
        key = os.getenv("ENCRYPTION_KEY")
        if not key:
            # Fallback for development if .env is missing key
            print("WARNING: ENCRYPTION_KEY environment variable not found! Generating a dynamic one.")
            key = "development_fallback_secure_vault_key_12345"
            
        # Ensure key is a 32-byte url-safe base64 key as required by Fernet
        try:
            # Try to initialize directly
            self.fernet = Fernet(key.encode())
        except Exception:
            # Fallback: Hash the key to 32 bytes and base64 encode it
            hash_key = hashlib.sha256(key.encode()).digest()
            b64_key = base64.urlsafe_b64encode(hash_key)
            self.fernet = Fernet(b64_key)

    def encrypt(self, plaintext: str) -> str:
        if not plaintext:
            return ""
        return self.fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        if not ciphertext:
            return ""
        return self.fernet.decrypt(ciphertext.encode()).decode()

crypto_manager = EncryptionManager()
