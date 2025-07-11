// Security Manager Service - API interface for hardware monitoring
// This service provides REST API endpoints for hardware security management

const HardwareMonitor = require('./hardwareMonitor');
const winston = require('winston');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SecurityManager {
    constructor(options = {}) {
        this.options = {
            adminTokens: options.adminTokens || [],
            apiKey: options.apiKey || this.generateSecureKey(),
            enableAPI: options.enableAPI !== undefined ? options.enableAPI : true,
            maxViolations: options.maxViolations || 5,
            alertThreshold: options.alertThreshold || 3,
            autoShutdown: options.autoShutdown !== undefined ? options.autoShutdown : true,
            ...options
        };
        
        this.hardwareMonitor = null;
        this.securityEvents = [];
        this.adminSessions = new Map();
        this.isInitialized = false;
        
        this.initializeLogger();
    }
    
    // Initialize logger
    initializeLogger() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `[${timestamp}] [${level.toUpperCase()}] SECURITY: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: 'C:\\temp\\gods-eye-security-manager.log' })
            ]
        });
    }
    
    // Generate secure API key
    generateSecureKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    // Initialize security manager
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('Security manager already initialized');
            return;
        }
        
        this.logger.info('Initializing security manager...');
        
        try {
            // Initialize hardware monitor
            this.hardwareMonitor = new HardwareMonitor({
                strictMode: true,
                allowOverride: false,
                autoShutdown: false // We handle shutdown through API
            });
            
            // Set up event handlers
            this.setupEventHandlers();
            
            // Start hardware monitoring
            await this.hardwareMonitor.startMonitoring();
            
            this.isInitialized = true;
            this.logger.info('Security manager initialized successfully');
            
        } catch (error) {
            this.logger.error('Error initializing security manager', { error: error.message });
            throw error;
        }
    }
    
    // Set up hardware monitor event handlers
    setupEventHandlers() {
        this.hardwareMonitor.on('securityViolation', (violation) => {
            this.handleSecurityViolation(violation);
        });
        
        this.hardwareMonitor.on('deviceConnected', (device) => {
            this.logger.info('Device connected', device);
            this.addSecurityEvent('DEVICE_CONNECTED', device);
        });
        
        this.hardwareMonitor.on('deviceDisconnected', (device) => {
            this.logger.info('Device disconnected', device);
            this.addSecurityEvent('DEVICE_DISCONNECTED', device);
        });
        
        this.hardwareMonitor.on('emergencyShutdown', (violation) => {
            this.logger.critical('Emergency shutdown triggered', violation);
            this.addSecurityEvent('EMERGENCY_SHUTDOWN', violation);
        });
    }
    
    // Handle security violation
    async handleSecurityViolation(violation) {
        this.logger.error('Security violation handled by manager', violation);
        
        this.addSecurityEvent('SECURITY_VIOLATION', violation);
        
        // Check violation count threshold
        const recentViolations = this.securityEvents.filter(event => 
            event.type === 'SECURITY_VIOLATION' && 
            (new Date() - event.timestamp) < 60000 // Last 1 minute
        );
        
        if (recentViolations.length >= this.options.maxViolations) {
            await this.triggerSecurityLockdown();
        }
    }
    
    // Add security event to log
    addSecurityEvent(type, data) {
        const event = {
            id: crypto.randomUUID(),
            type: type,
            data: data,
            timestamp: new Date(),
            severity: this.getEventSeverity(type)
        };
        
        this.securityEvents.push(event);
        
        // Keep only last 1000 events
        if (this.securityEvents.length > 1000) {
            this.securityEvents = this.securityEvents.slice(-1000);
        }
        
        // Save to file
        this.saveSecurityEvent(event);
    }
    
    // Get event severity
    getEventSeverity(eventType) {
        const severityMap = {
            'SECURITY_VIOLATION': 'HIGH',
            'EMERGENCY_SHUTDOWN': 'CRITICAL',
            'DEVICE_CONNECTED': 'MEDIUM',
            'DEVICE_DISCONNECTED': 'LOW',
            'ADMIN_OVERRIDE': 'HIGH',
            'SECURITY_LOCKDOWN': 'CRITICAL'
        };
        
        return severityMap[eventType] || 'LOW';
    }
    
    // Save security event to file
    async saveSecurityEvent(event) {
        try {
            const eventPath = 'C:\\temp\\gods-eye-security-events.jsonl';
            const eventLine = JSON.stringify(event) + '\n';
            await fs.appendFile(eventPath, eventLine);
        } catch (error) {
            this.logger.error('Error saving security event', { error: error.message });
        }
    }
    
    // Trigger security lockdown
    async triggerSecurityLockdown() {
        this.logger.critical('Security lockdown triggered - too many violations');
        
        this.addSecurityEvent('SECURITY_LOCKDOWN', {
            reason: 'Maximum violations exceeded',
            violationCount: this.options.maxViolations,
            timestamp: new Date()
        });
        
        // Stop hardware monitoring
        if (this.hardwareMonitor) {
            this.hardwareMonitor.stopMonitoring();
        }
        
        // Create lockdown flag
        const lockdownPath = 'C:\\temp\\gods-eye-lockdown.flag';
        await fs.writeFile(lockdownPath, JSON.stringify({
            lockdownTime: new Date(),
            reason: 'Security violation threshold exceeded'
        }));
        
        // Exit application
        process.exit(1);
    }
    
    // API Methods
    
    // Authenticate API request
    authenticateRequest(apiKey, adminToken = null) {
        if (apiKey !== this.options.apiKey) {
            return { success: false, error: 'Invalid API key' };
        }
        
        if (adminToken && !this.options.adminTokens.includes(adminToken)) {
            return { success: false, error: 'Invalid admin token' };
        }
        
        return { success: true };
    }
    
    // Get security status
    getSecurityStatus() {
        if (!this.hardwareMonitor) {
            return {
                status: 'NOT_INITIALIZED',
                message: 'Hardware monitor not initialized'
            };
        }
        
        const status = this.hardwareMonitor.getSecurityStatus();
        const recentEvents = this.securityEvents.slice(-10);
        
        return {
            ...status,
            recentEvents: recentEvents,
            totalEvents: this.securityEvents.length,
            apiStatus: 'ACTIVE',
            lastUpdate: new Date()
        };
    }
    
    // Get security violations
    getSecurityViolations(limit = 50) {
        return this.securityEvents
            .filter(event => event.type === 'SECURITY_VIOLATION')
            .slice(-limit)
            .reverse();
    }
    
    // Get connected devices
    getConnectedDevices() {
        if (!this.hardwareMonitor) {
            return [];
        }
        
        return this.hardwareMonitor.getSecurityStatus().connectedDevices;
    }
    
    // Create admin override
    async createAdminOverride(adminToken, reason) {
        const auth = this.authenticateRequest(null, adminToken);
        if (!auth.success) {
            return auth;
        }
        
        if (!this.hardwareMonitor) {
            return { success: false, error: 'Hardware monitor not available' };
        }
        
        const overrideId = crypto.randomUUID();
        const override = {
            id: overrideId,
            adminToken: adminToken,
            reason: reason,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            isActive: true
        };
        
        this.adminSessions.set(overrideId, override);
        
        const result = await this.hardwareMonitor.createAdminOverride(adminToken, reason);
        
        this.addSecurityEvent('ADMIN_OVERRIDE', override);
        
        return {
            success: result,
            overrideId: overrideId,
            expiresAt: override.expiresAt
        };
    }
    
    // Remove admin override
    async removeAdminOverride(overrideId, adminToken) {
        const auth = this.authenticateRequest(null, adminToken);
        if (!auth.success) {
            return auth;
        }
        
        const override = this.adminSessions.get(overrideId);
        if (!override || override.adminToken !== adminToken) {
            return { success: false, error: 'Invalid override ID or admin token' };
        }
        
        this.adminSessions.delete(overrideId);
        
        if (this.hardwareMonitor) {
            await this.hardwareMonitor.removeAdminOverride();
        }
        
        this.logger.info('Admin override removed', { overrideId });
        
        return { success: true };
    }
    
    // Restart hardware monitoring
    async restartMonitoring(adminToken) {
        const auth = this.authenticateRequest(null, adminToken);
        if (!auth.success) {
            return auth;
        }
        
        try {
            if (this.hardwareMonitor) {
                this.hardwareMonitor.stopMonitoring();
                await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
                await this.hardwareMonitor.startMonitoring();
            }
            
            this.logger.info('Hardware monitoring restarted by admin');
            return { success: true };
        } catch (error) {
            this.logger.error('Error restarting monitoring', { error: error.message });
            return { success: false, error: error.message };
        }
    }
    
    // Force hardware scan
    async forceHardwareScan(adminToken = null) {
        if (adminToken) {
            const auth = this.authenticateRequest(null, adminToken);
            if (!auth.success) {
                return auth;
            }
        }
        
        try {
            if (this.hardwareMonitor) {
                await this.hardwareMonitor.performHardwareScan();
            }
            
            this.logger.info('Hardware scan forced');
            return { success: true };
        } catch (error) {
            this.logger.error('Error during forced scan', { error: error.message });
            return { success: false, error: error.message };
        }
    }
    
    // Get system configuration
    getSystemConfiguration() {
        return {
            version: '1.0.0',
            apiEnabled: this.options.enableAPI,
            maxViolations: this.options.maxViolations,
            alertThreshold: this.options.alertThreshold,
            monitoringActive: this.hardwareMonitor ? this.hardwareMonitor.isMonitoring : false,
            adminSessionsActive: this.adminSessions.size,
            configuration: this.hardwareMonitor ? this.hardwareMonitor.options : null
        };
    }
    
    // Shutdown security manager
    async shutdown() {
        this.logger.info('Shutting down security manager...');
        
        try {
            if (this.hardwareMonitor) {
                this.hardwareMonitor.stopMonitoring();
            }
            
            // Clear admin sessions
            this.adminSessions.clear();
            
            this.isInitialized = false;
            this.logger.info('Security manager shutdown complete');
            
        } catch (error) {
            this.logger.error('Error during shutdown', { error: error.message });
        }
    }
    
    // Health check
    async healthCheck() {
        const health = {
            status: 'UNKNOWN',
            timestamp: new Date(),
            components: {}
        };
        
        try {
            // Check hardware monitor
            if (this.hardwareMonitor && this.hardwareMonitor.isMonitoring) {
                health.components.hardwareMonitor = 'HEALTHY';
            } else {
                health.components.hardwareMonitor = 'UNHEALTHY';
            }
            
            // Check log files
            try {
                await fs.access('C:\\temp\\gods-eye-security-events.jsonl');
                health.components.logging = 'HEALTHY';
            } catch {
                health.components.logging = 'UNHEALTHY';
            }
            
            // Check recent violations
            const recentViolations = this.securityEvents.filter(event => 
                event.type === 'SECURITY_VIOLATION' && 
                (new Date() - event.timestamp) < 300000 // Last 5 minutes
            );
            
            if (recentViolations.length === 0) {
                health.components.security = 'HEALTHY';
            } else if (recentViolations.length < this.options.alertThreshold) {
                health.components.security = 'WARNING';
            } else {
                health.components.security = 'CRITICAL';
            }
            
            // Overall status
            const componentStatuses = Object.values(health.components);
            if (componentStatuses.every(status => status === 'HEALTHY')) {
                health.status = 'HEALTHY';
            } else if (componentStatuses.some(status => status === 'CRITICAL')) {
                health.status = 'CRITICAL';
            } else {
                health.status = 'WARNING';
            }
            
        } catch (error) {
            health.status = 'ERROR';
            health.error = error.message;
        }
        
        return health;
    }
}

module.exports = SecurityManager;
