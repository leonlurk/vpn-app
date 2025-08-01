package com.nodexvpn.app.vpn;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.VpnService;
import android.os.Build;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;

import com.nodexvpn.app.MainActivity;

// ✅ IMPORTAR: Librería oficial WireGuard para VpnService
import com.wireguard.android.backend.GoBackend;
import com.wireguard.android.backend.Tunnel;
import com.wireguard.config.Config;
import com.wireguard.config.BadConfigException;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Servicio VPN que maneja correctamente el GoBackend de WireGuard
 * dentro del contexto del VpnService (arquitectura correcta)
 */
public class WireGuardVpnService extends VpnService {
    private static final String TAG = "WireGuardVpnService";
    private static final String CHANNEL_ID = "VPN_CHANNEL";
    private static final int NOTIFICATION_ID = 1;
    
    // Acciones del servicio
    public static final String ACTION_CONNECT_WIREGUARD = "CONNECT_WIREGUARD";
    public static final String ACTION_DISCONNECT = "DISCONNECT";
    public static final String ACTION_START_FOREGROUND = "start_foreground_notification";
    public static final String ACTION_STOP = "stop";
    
    // Extras
    public static final String EXTRA_WIREGUARD_CONFIG = "WIREGUARD_CONFIG";
    
    // Broadcast para comunicación con React Native
    public static final String ACTION_VPN_STATUS_CHANGED = "com.nodexvpn.app.VPN_STATUS_CHANGED";

    // ✅ GoBackend manejado correctamente dentro del VpnService
    private GoBackend goBackend;
    private Tunnel currentTunnel;
    private boolean isConnected = false;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "🚀 WireGuardVpnService creado");
        
        // ✅ Inicializar GoBackend dentro del VpnService (CORRECTO)
        try {
            this.goBackend = new GoBackend(this);
            Log.d(TAG, "✅ GoBackend inicializado correctamente dentro del VpnService");
        } catch (Exception e) {
            Log.e(TAG, "❌ Error inicializando GoBackend: " + e.getMessage(), e);
            sendStatusUpdate("error", false, "Error inicializando GoBackend: " + e.getMessage());
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String action = intent.getAction();
            Log.d(TAG, "🔄 Acción recibida: " + action);
            
            if (ACTION_CONNECT_WIREGUARD.equals(action)) {
                String configString = intent.getStringExtra(EXTRA_WIREGUARD_CONFIG);
                if (configString != null) {
                    connectWireGuard(configString);
                }
            } else if (ACTION_DISCONNECT.equals(action)) {
                disconnectWireGuard();
            } else if (ACTION_START_FOREGROUND.equals(action)) {
                String endpoint = intent.getStringExtra("config_endpoint");
                startForegroundNotificationOnly(endpoint);
            } else if (ACTION_STOP.equals(action)) {
                disconnectWireGuard();
                stopSelf();
            }
        }
        return START_STICKY;
    }

    /**
     * Conectar usando GoBackend REAL dentro del VpnService
     */
    private void connectWireGuard(String configString) {
        try {
            Log.d(TAG, "🚀 Conectando WireGuard con GoBackend...");
            
            if (goBackend == null) {
                Log.e(TAG, "❌ GoBackend no inicializado");
                sendStatusUpdate("error", false, "GoBackend no inicializado");
                return;
            }

            // Parsear configuración usando librería oficial
            InputStream configStream = new ByteArrayInputStream(configString.getBytes(StandardCharsets.UTF_8));
            Config wireGuardConfig = Config.parse(configStream);
            
            Log.d(TAG, "✅ Configuración WireGuard parseada exitosamente");

            // Crear túnel
            currentTunnel = new Tunnel() {
                @Override
                public String getName() {
                    return "NodexVPN_Real";
                }

                @Override
                public void onStateChange(State newState) {
                    Log.d(TAG, "🔄 Estado del túnel cambió: " + newState);
                    
                    boolean connected = (newState == State.UP);
                    String status = connected ? "connected" : "disconnected";
                    
                    isConnected = connected;
                    sendStatusUpdate(status, connected, "Estado del túnel: " + newState);
                }
            };

            // ✅ Establecer conexión usando GoBackend dentro del VpnService (CORRECTO)
            Log.d(TAG, "🔗 Estableciendo túnel con GoBackend...");
            Tunnel.State state = goBackend.setState(currentTunnel, Tunnel.State.UP, wireGuardConfig);
            
            Log.d(TAG, "✅ GoBackend.setState() exitoso! Estado: " + state);
            
            if (state == Tunnel.State.UP) {
                isConnected = true;
                
                // Extraer endpoint para la notificación
                String endpoint = extractEndpoint(configString);
                startForegroundNotificationOnly(endpoint);
                
                sendStatusUpdate("connected", true, "VPN conectado exitosamente");
                Log.d(TAG, "🎉 VPN REAL conectado exitosamente!");
                
            } else {
                Log.w(TAG, "⚠️ Estado inesperado después de conectar: " + state);
                sendStatusUpdate("connecting", false, "Conectando... Estado: " + state);
            }

        } catch (BadConfigException e) {
            Log.e(TAG, "❌ Configuración WireGuard inválida: " + e.getMessage(), e);
            sendStatusUpdate("error", false, "Configuración inválida: " + e.getMessage());
        } catch (Exception e) {
            Log.e(TAG, "❌ Error conectando WireGuard: " + e.getMessage(), e);
            sendStatusUpdate("error", false, "Error de conexión: " + e.getMessage());
        }
    }

    /**
     * Desconectar WireGuard
     */
    private void disconnectWireGuard() {
        try {
            Log.d(TAG, "🔌 Desconectando WireGuard...");

            if (goBackend != null && currentTunnel != null) {
                Tunnel.State state = goBackend.setState(currentTunnel, Tunnel.State.DOWN, null);
                Log.d(TAG, "✅ VPN desconectado. Estado: " + state);
            }

            isConnected = false;
            currentTunnel = null;
            
            stopForeground(true);
            sendStatusUpdate("disconnected", false, "VPN desconectado");
            
        } catch (Exception e) {
            Log.e(TAG, "❌ Error desconectando: " + e.getMessage(), e);
            sendStatusUpdate("error", false, "Error desconectando: " + e.getMessage());
        }
    }

    /**
     * Extraer endpoint de la configuración para mostrar en notificación
     */
    private String extractEndpoint(String configString) {
        try {
            String[] lines = configString.split("\n");
            for (String line : lines) {
                line = line.trim();
                if (line.startsWith("Endpoint = ")) {
                    return line.substring(11);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error extrayendo endpoint: " + e.getMessage());
        }
        return "Servidor VPN";
    }

    /**
     * Enviar actualización de estado a React Native
     */
    private void sendStatusUpdate(String status, boolean connected, String message) {
        Intent broadcast = new Intent(ACTION_VPN_STATUS_CHANGED);
        broadcast.putExtra("status", status);
        broadcast.putExtra("connected", connected);
        broadcast.putExtra("message", message);
        
        LocalBroadcastManager.getInstance(this).sendBroadcast(broadcast);
        Log.d(TAG, "📡 Estado enviado: " + status + " (" + connected + ") - " + message);
    }

    /**
     * Iniciar notificación persistente
     */
    private void startForegroundNotificationOnly(String endpoint) {
        Log.d(TAG, "📱 Iniciando notificación persistente...");
        
        createNotificationChannel();
        Notification notification = createVpnNotification(endpoint);
        startForeground(NOTIFICATION_ID, notification);
        
        Log.d(TAG, "✅ Notificación persistente iniciada");
    }

    /**
     * Crear notificación para VPN
     */
    private Notification createVpnNotification(String endpoint) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, 
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0
        );

        String connectionInfo = "Túnel WireGuard activo";
        if (endpoint != null && !endpoint.isEmpty()) {
            connectionInfo = "Conectado a " + endpoint;
        }

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🔒 NodeX VPN Activo")
            .setContentText(connectionInfo)
            .setSubText("WireGuard Real - Toca para gestionar")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setAutoCancel(false)
            .setShowWhen(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build();
    }

    /**
     * Crear canal de notificación
     */
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "VPN Service",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("NodeX VPN Service con WireGuard");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "🔚 WireGuardVpnService destruido");
        disconnectWireGuard();
    }

    @Override
    public android.os.IBinder onBind(Intent intent) {
        return null;
    }
} 