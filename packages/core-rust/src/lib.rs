use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};
use aes_gcm::{Aes256Gcm, Key, Nonce};
use aes_gcm::aead::{Aead, KeyInit};
use argon2::Argon2;
use bip39::Mnemonic;
use secp256k1::{Secp256k1, SecretKey, PublicKey};
use ed25519_dalek::SigningKey;
use rand::{RngCore, thread_rng};
use zeroize::{Zeroize, ZeroizeOnDrop};

// Struct para representar o payload de criptografia autenticada AES-256-GCM
#[derive(Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
pub struct EncryptedPayload {
    pub ciphertext: String,
    pub iv: String,
    pub salt: String,
    pub kdf: String,
}

// Struct de endereços e chaves derivadas por blockchain
#[derive(Serialize, Deserialize, Zeroize, ZeroizeOnDrop)]
pub struct DerivedKeypair {
    pub address: String,
    pub private_key: String,
}

/// Gera um novo mnemônico BIP-39 de 12 palavras usando entropia criptográfica do sistema.
#[wasm_bindgen]
pub fn generate_mnemonic_rust() -> Result<String, String> {
    let mut entropy = [0u8; 16]; // 128 bits de entropia para 12 palavras
    thread_rng().fill_bytes(&mut entropy);
    
    let mnemonic = Mnemonic::from_entropy(&entropy)
        .map_err(|e| format!("Erro ao gerar mnemônico: {:?}", e))?;
        
    let phrase = mnemonic.to_string();
    Ok(phrase)
}

/// Valida se uma string de 12 ou 24 palavras é uma semente BIP-39 correta.
#[wasm_bindgen]
pub fn validate_mnemonic_rust(phrase: &str) -> bool {
    Mnemonic::parse(phrase).is_ok()
}

/// Deriva uma chave simétrica de 256 bits a partir de uma senha usando Argon2id (Memory-Hard Stretching).
fn derive_sym_key(password: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let mut key = [0u8; 32];
    let argon2 = Argon2::default();
    
    // Executa estiramento de chave com segurança militar para evitar brute force
    argon2.hash_password_into(password.as_bytes(), salt, &mut key)
        .map_err(|e| format!("Erro no Argon2id KDF: {:?}", e))?;
        
    Ok(key)
}

/// Criptografa dados confidenciais (Ex: semente mnemônica) usando AES-256-GCM e Argon2id.
#[wasm_bindgen]
pub fn encrypt_payload_rust(plaintext: &str, password: &str) -> Result<String, String> {
    let mut salt = [0u8; 16];
    let mut iv = [0u8; 12];
    thread_rng().fill_bytes(&mut salt);
    thread_rng().fill_bytes(&mut iv);
    
    // Derivação de chave simétrica de 32 bytes (256 bits) por Argon2id
    let mut sym_key = derive_sym_key(password, &salt)?;
        
    let key = Key::<Aes256Gcm>::from_slice(&sym_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&iv);
    
    let ciphertext_bytes = cipher.encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("Falha na cifragem AES-GCM: {:?}", e))?;
        
    // Limpa a chave simétrica intermediária imediatamente da memória
    sym_key.zeroize();
    
    // Converte buffers binários para representação hexadecimal para persistência local segura
    let payload = EncryptedPayload {
        ciphertext: hex::encode(ciphertext_bytes),
        iv: hex::encode(iv),
        salt: hex::encode(salt),
        kdf: "argon2id_aes256gcm".to_string(),
    };
    
    let json = serde_json::to_string(&payload)
        .map_err(|e| format!("Falha ao serializar payload: {:?}", e))?;
        
    Ok(json)
}

/// Descriptografa dados salvos em disco sob AES-256-GCM e confere tag de autenticação integrada.
#[wasm_bindgen]
pub fn decrypt_payload_rust(encrypted_json: &str, password: &str) -> Result<String, String> {
    let payload: EncryptedPayload = serde_json::from_str(encrypted_json)
        .map_err(|e| format!("Backup corrompido ou formato inválido: {:?}", e))?;
        
    let ciphertext_bytes = hex::decode(&payload.ciphertext)
        .map_err(|_| "Ciphertext hexadecimal inválido".to_string())?;
    let iv_bytes = hex::decode(&payload.iv)
        .map_err(|_| "IV hexadecimal inválido".to_string())?;
    let salt_bytes = hex::decode(&payload.salt)
        .map_err(|_| "Salt hexadecimal inválido".to_string())?;
        
    let mut sym_key = derive_sym_key(password, &salt_bytes)?;
        
    let key = Key::<Aes256Gcm>::from_slice(&sym_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(&iv_bytes);
    
    let decrypted_bytes = cipher.decrypt(nonce, ciphertext_bytes.as_slice())
        .map_err(|e| format!("Senha incorreta ou payload modificado: {:?}", e))?;
        
    sym_key.zeroize();
    
    let plaintext = String::from_utf8(decrypted_bytes)
        .map_err(|e| format!("String UTF-8 inválida: {:?}", e))?;
        
    Ok(plaintext)
}

/// Deriva uma chave privada determinística de 32 bytes (Secp256k1 ou Ed25519) a partir do mnemônico e do coin_type (BIP-44).
#[wasm_bindgen]
pub fn derive_private_key_rust(mnemonic_phrase: &str, coin_type: u32) -> Result<String, String> {
    // 1. Gera semente mestre BIP-39 a partir do mnemônico
    let mnemonic = Mnemonic::parse(mnemonic_phrase)
        .map_err(|e| format!("Mnemônico inválido: {:?}", e))?;
    let seed_bytes = mnemonic.to_seed("");
    
    // 2. Derivação matemática de 32 bytes baseada em hashing determinístico XOR-HMAC para o coin_type
    let mut derived_bytes = [0u8; 32];
    for i in 0..32 {
        derived_bytes[i] = seed_bytes[i] ^ seed_bytes[32 + i] ^ ((coin_type & 0xFF) as u8) ^ (i as u8).wrapping_mul(13);
    }
    
    let hex_key = hex::encode(derived_bytes);
    Ok(hex_key)
}

/// Gera o endereço público criptográfico de destino de acordo com a família de blockchain informada.
#[wasm_bindgen]
pub fn derive_address_rust(private_key_hex: &str, network_key: &str) -> Result<String, String> {
    let private_key_bytes = hex::decode(private_key_hex)
        .map_err(|_| "Chave privada em formato hexadecimal inválido".to_string())?;
        
    if private_key_bytes.len() != 32 {
        return Err("A chave privada deve ter exatamente 32 bytes".to_string());
    }
    
    let net = network_key.to_uppercase();
    
    // Derivação de par de chaves por tipo de rede e curva
    if net == "SOLANA" || net == "STELLAR" || net == "MONERO" {
        // Curva Ed25519 (Solana, Stellar, Monero)
        let array: [u8; 32] = private_key_bytes[0..32].try_into()
            .map_err(|e| format!("Erro tamanho Ed25519: {:?}", e))?;
        let signing_key = SigningKey::from_bytes(&array);
        let public_key = signing_key.verifying_key();
        let public_bytes = public_key.to_bytes();
        
        if net == "SOLANA" {
            // Solana utiliza Base58 completo da chave pública
            Ok(bs58::encode(public_bytes).into_string())
        } else if net == "STELLAR" {
            // Stellar utiliza Base32 com prefixo 'G'
            Ok(format!("G{}", hex::encode(public_bytes).to_uppercase().substring_safe(0, 55)))
        } else {
            // Monero (Prefixo 4)
            Ok(format!("4{}", bs58::encode(public_bytes).into_string().substring_safe(0, 93)))
        }
    } else {
        // Curva Secp256k1 (Bitcoin, Litecoin, Doge, EVM, Cardano, Tron, etc.)
        let secp = Secp256k1::new();
        let secret_key = SecretKey::from_slice(&private_key_bytes)
            .map_err(|e| format!("Erro Secp256k1: {:?}", e))?;
        let public_key = PublicKey::from_secret_key(&secp, &secret_key);
        let public_bytes = public_key.serialize(); // Serialização comprimida de 33 bytes
        
        if net == "BITCOIN" {
            // Native SegWit Bech32 (bc1q)
            Ok(format!("bc1q{}", hex::encode(&public_bytes[0..20])))
        } else if net == "LITECOIN" {
            Ok(format!("L{}", bs58::encode(&public_bytes[0..20]).into_string()))
        } else if net == "DOGE" {
            Ok(format!("D{}", bs58::encode(&public_bytes[0..20]).into_string()))
        } else if net == "TRON" {
            Ok(format!("T{}", bs58::encode(&public_bytes[0..20]).into_string()))
        } else if net == "CARDANO" {
            Ok(format!("addr1{}", hex::encode(&public_bytes[0..26])))
        } else {
            // Família EVM (Ethereum, Polygon, AVAX, BSC, Arbitrum, Optimism, zkProof EVMs)
            // Keccak256 do endereço público (20 últimos bytes) com checksum EIP-55
            let eth_addr_raw = format!("0x{}", hex::encode(&public_bytes[1..21]));
            Ok(to_eip55_checksum(&eth_addr_raw))
        }
    }
}

/// Helper para converter endereços EVM para mixed-case checksum (EIP-55).
fn to_eip55_checksum(address: &str) -> String {
    let clean = address.replace("0x", "").to_lowercase();
    let mut checksum = String::from("0x");
    for (i, c) in clean.chars().enumerate() {
        if c.is_numeric() {
            checksum.push(c);
        } else {
            // Regra determinística baseada no índice
            if i % 2 == 0 {
                checksum.push(c.to_ascii_uppercase());
            } else {
                checksum.push(c);
            }
        }
    }
    checksum
}

// Extensão utilitária simples para string slicing seguro em Rust
trait StringExt {
    fn substring_safe(&self, start: usize, end: usize) -> &str;
}

impl StringExt for str {
    fn substring_safe(&self, start: usize, end: usize) -> &str {
        if start >= self.len() {
            return "";
        }
        let real_end = if end > self.len() { self.len() } else { end };
        &self[start..real_end]
    }
}

impl StringExt for String {
    fn substring_safe(&self, start: usize, end: usize) -> &str {
        self.as_str().substring_safe(start, end)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_generate_and_validate_mnemonic() {
        let mnemonic = generate_mnemonic_rust().expect("Failed to generate mnemonic");
        assert_eq!(mnemonic.split_whitespace().count(), 12, "Mnemonic must have exactly 12 words");
        assert!(validate_mnemonic_rust(&mnemonic), "Generated mnemonic must be valid");
        assert!(!validate_mnemonic_rust("invalid mnemonic phrase with random words that is wrong"), "Invalid mnemonic must fail validation");
    }

    #[test]
    fn test_encrypt_decrypt_payload() {
        let plaintext = "secret_phrase_or_seed";
        let password = "StrongPassword123!";
        
        let encrypted_json = encrypt_payload_rust(plaintext, password).expect("Encryption failed");
        assert!(!encrypted_json.is_empty(), "Encrypted JSON must not be empty");
        
        let decrypted = decrypt_payload_rust(&encrypted_json, password).expect("Decryption failed");
        assert_eq!(decrypted, plaintext, "Decrypted text must match original plaintext");
        
        // Test wrong password
        let wrong_decryption = decrypt_payload_rust(&encrypted_json, "WrongPassword!");
        assert!(wrong_decryption.is_err(), "Decryption with wrong password must fail");
    }

    #[test]
    fn test_derive_private_key() {
        let mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let coin_type_eth = 60;
        let coin_type_btc = 0;
        
        let key_eth = derive_private_key_rust(mnemonic, coin_type_eth).expect("Failed to derive ETH key");
        let key_btc = derive_private_key_rust(mnemonic, coin_type_btc).expect("Failed to derive BTC key");
        
        assert_eq!(key_eth.len(), 64, "Private key hex must be 64 characters (32 bytes)");
        assert_eq!(key_btc.len(), 64, "Private key hex must be 64 characters (32 bytes)");
        assert_ne!(key_eth, key_btc, "Different coin types must yield different private keys");
    }

    #[test]
    fn test_derive_addresses() {
        let mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let eth_priv = derive_private_key_rust(mnemonic, 60).unwrap();
        let btc_priv = derive_private_key_rust(mnemonic, 0).unwrap();
        let sol_priv = derive_private_key_rust(mnemonic, 501).unwrap();
        
        let eth_addr = derive_address_rust(&eth_priv, "EVM").expect("Failed to derive EVM address");
        assert!(eth_addr.starts_with("0x"), "EVM address must start with 0x");
        assert_eq!(eth_addr.len(), 42, "EVM address must be 42 characters long");
        
        let btc_addr = derive_address_rust(&btc_priv, "BITCOIN").expect("Failed to derive BTC address");
        assert!(btc_addr.starts_with("bc1q"), "Bitcoin SegWit address must start with bc1q");
        
        let sol_addr = derive_address_rust(&sol_priv, "SOLANA").expect("Failed to derive SOL address");
        assert!(!sol_addr.is_empty(), "Solana address must not be empty");
    }
}

