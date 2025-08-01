package com.nodexvpn.app.vpn;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.VpnService;
import android.util.Log;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import androidx.annotation.NonNull;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

/**
 * Módulo React Native que se comunica con WireGuardVpnService
 * para manejo correcto del GoBackend dentro del VpnService
 */
public class RealWireGuardModule extends ReactContextBaseJavaModule {
    
    private static final String TAG = "RealWireGuardModule";
    private static final int VPN_REQUEST_CODE = 1001;
    
    private ReactApplicationContext reactContext;
    
    // Para manejar el resultado de permisos VPN
    private Promise pendingVpnPromise = null;
    private ReadableMap pendingVpnConfig = null;
    
    // Estado actual del VPN
    private String currentStatus = "disconnected";
    private boolean isConnected = false;

    public RealWireGuardModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        
        // Registrar listener para resultados de Activities
        reactContext.addActivityEventListener(activityEventListener);
        
        // Registrar receiver para actualizaciones de estado del VPN
        IntentFilter filter = new IntentFilter(WireGuardVpnService.ACTION_VPN_STATUS_CHANGED);
        LocalBroadcastManager.getInstance(reactContext).registerReceiver(vpnStatusReceiver, filter);
        
        Log.d(TAG, "✅ RealWireGuardModule inicializado con comunicación por Intent");
    }

    @NonNull
    @Override
    public String getName() {
        return "RealWireGuardModule";
    }

    /**
     * Receiver para actualizaciones de estado del VPN
     */
    private final BroadcastReceiver vpnStatusReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (WireGuardVpnService.ACTION_VPN_STATUS_CHANGED.equals(intent.getAction())) {
                String status = intent.getStringExtra("status");
                boolean connected = intent.getBooleanExtra("connected", false);
                String message = intent.getStringExtra("message");
                
                Log.d(TAG, "📡 Estado VPN actualizado: " + status + " (conectado: " + connected + ")");
                
                currentStatus = status != null ? status : "disconnected";
                isConnected = connected;
                
                // Si hay un promise pendiente (de conexión), resolverlo
                if (pendingVpnPromise != null) {
                    WritableMap result = new WritableNativeMap();
                    result.putString("status", currentStatus);
                    result.putBoolean("connected", isConnected);
                    result.putString("message", message != null ? message : "Estado actualizado");
                    
                    if ("connected".equals(currentStatus)) {
                        pendingVpnPromise.resolve(result);
                    } else if ("error".equals(currentStatus)) {
                        pendingVpnPromise.reject("VPN_ERROR", message != null ? message : "Error de conexión");
                    }
                    
                    pendingVpnPromise = null;
                    pendingVpnConfig = null;
                }
            }
        }
    };

    /**
     * Listener para manejar resultados de permisos VPN
     */
    private final ActivityEventListener activityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent data) {
            if (requestCode == VPN_REQUEST_CODE) {
                Log.d(TAG, "📱 Resultado de permisos VPN: " + resultCode);
                
                if (resultCode == Activity.RESULT_OK) {
                    Log.d(TAG, "✅ Permisos VPN aprobados");
                    // Continuar con la conexión
                    if (pendingVpnConfig != null) {
                        connectWithService(pendingVpnConfig);
                    }
                } else {
                    Log.d(TAG, "❌ Permisos VPN denegados");
                    if (pendingVpnPromise != null) {
                        pendingVpnPromise.reject("PERMISSION_DENIED", "Permisos VPN denegados por el usuario");
                        pendingVpnPromise = null;
                        pendingVpnConfig = null;
                    }
                }
            }
        }
    };

    /**
     * Conectar VPN usando WireGuardVpnService
     */
    @ReactMethod
    public void connect(ReadableMap config, Promise promise) {
        try {
            Log.d(TAG, "🚀 Iniciando conexión VPN vía WireGuardVpnService...");

            // Verificar permisos VPN
            Intent vpnIntent = VpnService.prepare(reactContext);
            if (vpnIntent != null) {
                Log.d(TAG, "📋 Permisos VPN requeridos - mostrando diálogo...");
                
                // Guardar para usar después de los permisos
                pendingVpnPromise = promise;
                pendingVpnConfig = config;
                
                // Mostrar diálogo de permisos VPN
                Activity currentActivity = getCurrentActivity();
                if (currentActivity != null) {
                    currentActivity.startActivityForResult(vpnIntent, VPN_REQUEST_CODE);
                } else {
                    promise.reject("NO_ACTIVITY", "No se puede mostrar diálogo de permisos - actividad no disponible");
                }
                return;
            }

            // Si llegamos aquí, ya tenemos permisos
            pendingVpnPromise = promise;
            connectWithService(config);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error al conectar VPN: " + e.getMessage(), e);
            promise.reject("CONNECTION_FAILED", "Error al conectar VPN: " + e.getMessage());
        }
    }

    /**
     * Conectar usando el servicio cuando ya tenemos permisos
     */
    private void connectWithService(ReadableMap config) {
        try {
            // Construir configuración WireGuard string
            String configString = buildWireGuardConfigString(config);
            Log.d(TAG, "📋 Enviando configuración al servicio...");

            // Iniciar WireGuardVpnService con la configuración
            Intent serviceIntent = new Intent(reactContext, WireGuardVpnService.class);
            serviceIntent.setAction(WireGuardVpnService.ACTION_CONNECT_WIREGUARD);
            serviceIntent.putExtra(WireGuardVpnService.EXTRA_WIREGUARD_CONFIG, configString);
            reactContext.startService(serviceIntent);
            
            Log.d(TAG, "✅ Servicio VPN iniciado - esperando confirmación...");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error conectando con servicio: " + e.getMessage(), e);
            if (pendingVpnPromise != null) {
                pendingVpnPromise.reject("SERVICE_ERROR", "Error conectando con servicio: " + e.getMessage());
                pendingVpnPromise = null;
            }
        }
    }

    /**
     * Desconectar VPN
     */
    @ReactMethod
    public void disconnect(Promise promise) {
        try {
            Log.d(TAG, "🔌 Desconectando VPN vía servicio...");

            Intent serviceIntent = new Intent(reactContext, WireGuardVpnService.class);
            serviceIntent.setAction(WireGuardVpnService.ACTION_DISCONNECT);
            reactContext.startService(serviceIntent);
            
            // Actualizar estado local
            currentStatus = "disconnected";
            isConnected = false;
            
            WritableMap result = new WritableNativeMap();
            result.putString("status", "disconnected");
            result.putString("message", "Desconectando VPN...");
            promise.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error desconectando VPN: " + e.getMessage(), e);
            promise.reject("DISCONNECTION_ERROR", "Error desconectando VPN: " + e.getMessage());
        }
    }

    /**
     * Obtener estado actual del VPN
     */
    @ReactMethod
    public void getStatus(Promise promise) {
        try {
            WritableMap result = new WritableNativeMap();
            result.putString("status", currentStatus);
            result.putBoolean("connected", isConnected);
            
            promise.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error obteniendo estado: " + e.getMessage(), e);
            promise.reject("STATUS_ERROR", "Error obteniendo estado: " + e.getMessage());
        }
    }

    /**
     * Construir configuración WireGuard string
     */
    private String buildWireGuardConfigString(ReadableMap config) {
        StringBuilder configBuilder = new StringBuilder();
        
        // Manejar estructura anidada (Interface/Peer) o directa
        ReadableMap interfaceConfig = null;
        ReadableMap peerConfig = null;
        
        if (config.hasKey("Interface") && config.getMap("Interface") != null) {
            interfaceConfig = config.getMap("Interface");
            peerConfig = config.getMap("Peer");
        } else {
            interfaceConfig = config;
            peerConfig = config;
        }
        
        // Sección [Interface]
        configBuilder.append("[Interface]\n");
        
        if (interfaceConfig.hasKey("PrivateKey")) {
            configBuilder.append("PrivateKey = ").append(interfaceConfig.getString("PrivateKey")).append("\n");
        }
        
        if (interfaceConfig.hasKey("Address")) {
            configBuilder.append("Address = ").append(interfaceConfig.getString("Address")).append("\n");
        }
        
        if (interfaceConfig.hasKey("DNS")) {
            configBuilder.append("DNS = ").append(interfaceConfig.getString("DNS")).append("\n");
        }
        
        // Sección [Peer]
        configBuilder.append("\n[Peer]\n");
        
        if (peerConfig.hasKey("PublicKey")) {
            configBuilder.append("PublicKey = ").append(peerConfig.getString("PublicKey")).append("\n");
        }
        
        if (peerConfig.hasKey("Endpoint")) {
            configBuilder.append("Endpoint = ").append(peerConfig.getString("Endpoint")).append("\n");
        }
        
        if (peerConfig.hasKey("AllowedIPs")) {
            configBuilder.append("AllowedIPs = ").append(peerConfig.getString("AllowedIPs")).append("\n");
        } else {
            configBuilder.append("AllowedIPs = 0.0.0.0/0, ::/0\n");
        }
        
        if (peerConfig.hasKey("PersistentKeepalive")) {
            configBuilder.append("PersistentKeepalive = ").append(peerConfig.getString("PersistentKeepalive")).append("\n");
        }
        
        return configBuilder.toString();
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        // Desregistrar receiver
        try {
            LocalBroadcastManager.getInstance(reactContext).unregisterReceiver(vpnStatusReceiver);
        } catch (Exception e) {
            Log.w(TAG, "Error unregistering receiver: " + e.getMessage());
        }
    }
} 