package integrations

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
)

// Cipher encrypts/decrypts OAuth tokens at rest with AES-256-GCM. The key comes
// from INTEGRATION_ENCRYPTION_KEY (base64 of exactly 32 bytes). When that env var
// is unset or malformed NewCipher returns an error and the integration routes
// respond 503 — tokens are never stored in plaintext.
type Cipher struct{ gcm cipher.AEAD }

// NewCipher builds a Cipher from a base64-encoded 32-byte key.
func NewCipher(base64Key string) (*Cipher, error) {
	if base64Key == "" {
		return nil, errors.New("INTEGRATION_ENCRYPTION_KEY not set")
	}
	key, err := base64.StdEncoding.DecodeString(base64Key)
	if err != nil {
		return nil, errors.New("INTEGRATION_ENCRYPTION_KEY is not valid base64")
	}
	if len(key) != 32 {
		return nil, errors.New("INTEGRATION_ENCRYPTION_KEY must decode to 32 bytes (AES-256)")
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	return &Cipher{gcm: gcm}, nil
}

// Encrypt returns base64(nonce || ciphertext). A fresh random nonce is prepended
// so the same plaintext encrypts differently each time.
func (c *Cipher) Encrypt(plaintext string) (string, error) {
	nonce := make([]byte, c.gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	sealed := c.gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(sealed), nil
}

// Decrypt reverses Encrypt. Returns an error on a bad key, tampering, or a
// truncated payload.
func (c *Cipher) Decrypt(b64 string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(b64)
	if err != nil {
		return "", errors.New("ciphertext is not valid base64")
	}
	ns := c.gcm.NonceSize()
	if len(data) < ns {
		return "", errors.New("ciphertext too short")
	}
	nonce, ct := data[:ns], data[ns:]
	pt, err := c.gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", errors.New("decryption failed")
	}
	return string(pt), nil
}
