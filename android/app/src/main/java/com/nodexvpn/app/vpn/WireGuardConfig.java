package com.nodexvpn.app.vpn;

import android.util.Log;
import org.json.JSONObject;
import org.json.JSONException;

public class WireGuardConfig {
    private static final String TAG = "WireGuardConfig";
    
    private String interfaceAddress;
    private String privateKey;
    private String dns;
    private String publicKey;
    private String endpoint;
    private String allowedIPs;
    private String persistentKeepalive;

    public WireGuardConfig() {
        Log.d(TAG, "WireGuardConfig created");
    }

    public static WireGuardConfig fromJson(String configJson) {
        WireGuardConfig config = new WireGuardConfig();
        
        try {
            Log.d(TAG, "Parsing config JSON: " + configJson);
            JSONObject json = new JSONObject(configJson);
            
            // Parse Interface section
            if (json.has("Interface")) {
                JSONObject interfaceObj = json.getJSONObject("Interface");
                if (interfaceObj.has("Address")) {
                    config.setInterfaceAddress(interfaceObj.getString("Address"));
                }
                if (interfaceObj.has("PrivateKey")) {
                    config.setPrivateKey(interfaceObj.getString("PrivateKey"));
                }
                if (interfaceObj.has("DNS")) {
                    config.setDns(interfaceObj.getString("DNS"));
                }
            }
            
            // Parse Peer section
            if (json.has("Peer")) {
                JSONObject peerObj = json.getJSONObject("Peer");
                if (peerObj.has("PublicKey")) {
                    config.setPublicKey(peerObj.getString("PublicKey"));
                }
                if (peerObj.has("Endpoint")) {
                    config.setEndpoint(peerObj.getString("Endpoint"));
                }
                if (peerObj.has("AllowedIPs")) {
                    config.setAllowedIPs(peerObj.getString("AllowedIPs"));
                }
                if (peerObj.has("PersistentKeepalive")) {
                    config.setPersistentKeepalive(peerObj.getString("PersistentKeepalive"));
                }
            }
            
            Log.d(TAG, "Config parsed successfully");
            
        } catch (JSONException e) {
            Log.e(TAG, "Error parsing config JSON", e);
        }
        
        return config;
    }

    public String toConfigString() {
        StringBuilder sb = new StringBuilder();
        
        sb.append("[Interface]\n");
        if (privateKey != null) sb.append("PrivateKey = ").append(privateKey).append("\n");
        if (interfaceAddress != null) sb.append("Address = ").append(interfaceAddress).append("\n");
        if (dns != null) sb.append("DNS = ").append(dns).append("\n");
        
        sb.append("\n[Peer]\n");
        if (publicKey != null) sb.append("PublicKey = ").append(publicKey).append("\n");
        if (endpoint != null) sb.append("Endpoint = ").append(endpoint).append("\n");
        if (allowedIPs != null) sb.append("AllowedIPs = ").append(allowedIPs).append("\n");
        if (persistentKeepalive != null) sb.append("PersistentKeepalive = ").append(persistentKeepalive).append("\n");
        
        return sb.toString();
    }

    // Getters and Setters
    public String getInterfaceAddress() { return interfaceAddress; }
    public void setInterfaceAddress(String interfaceAddress) { this.interfaceAddress = interfaceAddress; }

    public String getPrivateKey() { return privateKey; }
    public void setPrivateKey(String privateKey) { this.privateKey = privateKey; }

    public String getDns() { return dns; }
    public void setDns(String dns) { this.dns = dns; }

    public String getPublicKey() { return publicKey; }
    public void setPublicKey(String publicKey) { this.publicKey = publicKey; }

    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }

    public String getAllowedIPs() { return allowedIPs; }
    public void setAllowedIPs(String allowedIPs) { this.allowedIPs = allowedIPs; }

    public String getPersistentKeepalive() { return persistentKeepalive; }
    public void setPersistentKeepalive(String persistentKeepalive) { this.persistentKeepalive = persistentKeepalive; }

    @Override
    public String toString() {
        return "WireGuardConfig{" +
                "interfaceAddress='" + interfaceAddress + '\'' +
                ", dns='" + dns + '\'' +
                ", endpoint='" + endpoint + '\'' +
                ", allowedIPs='" + allowedIPs + '\'' +
                '}';
    }
} 