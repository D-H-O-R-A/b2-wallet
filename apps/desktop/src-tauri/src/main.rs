// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tauri::command]
fn generate_mnemonic() -> Result<String, String> {
    b2_wallet_core::generate_mnemonic_rust()
        .map_err(|e| format!("{:?}", e))
}

#[tauri::command]
fn validate_mnemonic(phrase: String) -> bool {
    b2_wallet_core::validate_mnemonic_rust(&phrase)
}

#[tauri::command]
fn encrypt_payload(plaintext: String, password: String) -> Result<String, String> {
    b2_wallet_core::encrypt_payload_rust(&plaintext, &password)
        .map_err(|e| format!("{:?}", e))
}

#[tauri::command]
fn decrypt_payload(encrypted_json: String, password: String) -> Result<String, String> {
    b2_wallet_core::decrypt_payload_rust(&encrypted_json, &password)
        .map_err(|e| format!("{:?}", e))
}

#[tauri::command]
fn derive_private_key(mnemonic_phrase: String, coin_type: u32) -> Result<String, String> {
    b2_wallet_core::derive_private_key_rust(&mnemonic_phrase, coin_type)
        .map_err(|e| format!("{:?}", e))
}

#[tauri::command]
fn derive_address(private_key_hex: String, network_key: String) -> Result<String, String> {
    b2_wallet_core::derive_address_rust(&private_key_hex, &network_key)
        .map_err(|e| format!("{:?}", e))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            generate_mnemonic,
            validate_mnemonic,
            encrypt_payload,
            decrypt_payload,
            derive_private_key,
            derive_address
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
