// Hardware Monitor Service - Real-time device detection for Gods Eye
// This service monitors hardware changes during application runtime

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const winston = require('winston');

class HardwareMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            logPath: options.logPath || 'C:\\temp\\gods-eye-hardware-runtime.log',
            strictMode: options.strictMode !== undefined ? options.strictMode : true,
            allowOverride: options.allowOverride || false,
            checkInterval: options.checkInterval || 30000, // 30 seconds
            autoShutdown: options.autoShutdown !== undefined ? options.autoShutdown : true,
            alertThreshold: options.alertThreshold || 1,
            ...options
        };
        
        this.isMonitoring = false;
        this.securityViolations = [];
        this.allowedDevices = new Set();
        this.detectedDevices = new Map();
        this.checkIntervalId = null;
        
        this.initializeLogger();
        this.loadConfiguration();
    }
    
    // Initialize Winston logger
    initializeLogger() {
        this.logger = winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    return `[${timestamp}] [${level.toUpperCase()}] HARDWARE: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: this.options.logPath })
            ]
        });
    }
    
    // Load hardware security configuration
    async loadConfiguration() {
        try {
            const configPath = path.join(__dirname, '..', 'config', 'hardware-security.json');
            const configExists = await fs.access(configPath).then(() => true).catch(() => false);
            
            if (configExists) {
                const configData = await fs.readFile(configPath, 'utf8');
                const config = JSON.parse(configData);
                this.allowedDevices = new Set(config.allowedDevices || []);
                this.logger.info('Hardware security configuration loaded', { deviceCount: this.allowedDevices.size });
            } else {
                this.logger.warn('Hardware security configuration not found, using defaults');
                await this.createDefaultConfiguration();
            }
        } catch (error) {
            this.logger.error('Error loading hardware configuration', { error: error.message });
        }
    }
    
    // Create default hardware security configuration
    async createDefaultConfiguration() {
        const defaultConfig = {
            allowedDevices: [
                'keyboard',
                'mouse',
                'pointing',
                'trackpad',
                'internal'
            ],
            forbiddenDeviceClasses: [
                'USB',
                'WPD',
                'Volume',
                'Image',
                'Media',
                'Ports',
                'Bluetooth',
                'IEEE1394',
                'SCSI',
                'SmartCardReader'
            ],
            securityPolicies: {
                blockUSBStorage: true,
                blockExternalDisplays: false,
                blockUnknownHID: true,
                alertOnViolation: true,
                autoShutdownOnViolation: false
            }
        };
        
        try {
            const configDir = path.join(__dirname, '..', 'config');
            await fs.mkdir(configDir, { recursive: true });
            
            const configPath = path.join(configDir, 'hardware-security.json');
            await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
            
            this.logger.info('Default hardware security configuration created', { path: configPath });
        } catch (error) {
            this.logger.error('Error creating default configuration', { error: error.message });
        }
    }
    
    // Start hardware monitoring
    async startMonitoring() {
        if (this.isMonitoring) {
            this.logger.warn('Hardware monitoring is already running');
            return;
        }
        
        this.logger.info('Starting hardware monitoring service...');
        this.isMonitoring = true;
        
        try {
            // Start USB detection monitoring
            this.startUSBMonitoring();
            
            // Perform initial hardware scan
            await this.performInitialScan();
            
            this.logger.info('Hardware monitoring service started successfully');
            this.emit('monitoringStarted');
            
        } catch (error) {
            this.logger.error('Error starting hardware monitoring', { error: error.message });
            this.isMonitoring = false;
            throw error;
        }
    }
    
    // Stop hardware monitoring
    stopMonitoring() {
        if (!this.isMonitoring) {
            this.logger.warn('Hardware monitoring is not running');
            return;
        }
        
        this.logger.info('Stopping hardware monitoring service...');
        this.isMonitoring = false;
        
        // Stop USB monitoring
        try {
            if (this.deviceCheckInterval) {
                clearInterval(this.deviceCheckInterval);
                this.deviceCheckInterval = null;
            }
            this.logger.info('USB monitoring stopped');
        } catch (error) {
            this.logger.error('Error stopping USB monitoring', { error: error.message });
        }
        
        // Clear periodic checks
        if (this.checkIntervalId) {
            clearInterval(this.checkIntervalId);
            this.checkIntervalId = null;
        }
        
        this.logger.info('Hardware monitoring service stopped');
        this.emit('monitoringStopped');
    }
    
    // Start USB device monitoring using PowerShell
    startUSBMonitoring() {
        this.logger.info('Starting USB device monitoring...');
        
        // Store current device state
        this.currentDevices = new Set();
        
        // Initialize current device list
        this.initializeDeviceList();
        
        // Start periodic device monitoring
        this.deviceCheckInterval = setInterval(async () => {
            await this.checkForDeviceChanges();
        }, 2000); // Check every 2 seconds
        
        this.logger.info('USB monitoring initialized');
    }
    
    // Initialize device list
    async initializeDeviceList() {
        try {
            const devices = await this.getUSBDevicesViaPowerShell();
            devices.forEach(device => {
                this.currentDevices.add(device.DeviceID);
            });
            this.logger.info(`Initialized with ${devices.length} USB devices`);
        } catch (error) {
            this.logger.error('Error initializing device list', { error: error.message });
        }
    }
    
    // Check for device changes
    async checkForDeviceChanges() {
        try {
            const currentDevices = await this.getUSBDevicesViaPowerShell();
            const currentDeviceIds = new Set(currentDevices.map(d => d.DeviceID));
            
            // Find new devices
            for (const device of currentDevices) {
                if (!this.currentDevices.has(device.DeviceID)) {
                    await this.handleUSBDeviceAdded(device);
                }
            }
            
            // Find removed devices
            for (const deviceId of this.currentDevices) {
                if (!currentDeviceIds.has(deviceId)) {
                    await this.handleUSBDeviceRemoved({ DeviceID: deviceId });
                }
            }
            
            // Update current device list
            this.currentDevices = currentDeviceIds;
            
        } catch (error) {
            this.logger.error('Error checking device changes', { error: error.message });
        }
    }
    
    // Get USB devices via PowerShell
    async getUSBDevicesViaPowerShell() {
        return new Promise((resolve, reject) => {
            // Get USB devices
            const usbCommand = `powershell -Command "Get-PnpDevice | Where-Object { $_.Class -eq 'DiskDrive' -or $_.InstanceId -like '*USB*' -or $_.FriendlyName -like '*USB*' } | Select-Object FriendlyName, DeviceID, Status, Class | ConvertTo-Json"`;
            
            // Get logical drives (USB storage)
            const driveCommand = `powershell -Command "Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 } | Select-Object DeviceID, VolumeName, Size, FileSystem | ConvertTo-Json"`;
            
            exec(usbCommand, { timeout: 10000 }, (usbError, usbStdout, usbStderr) => {
                if (usbError) {
                    reject(new Error(`USB PowerShell error: ${usbError.message}`));
                    return;
                }
                
                exec(driveCommand, { timeout: 10000 }, (driveError, driveStdout, driveStderr) => {
                    if (driveError) {
                        reject(new Error(`Drive PowerShell error: ${driveError.message}`));
                        return;
                    }
                    
                    try {
                        const usbDevices = JSON.parse(usbStdout || '[]');
                        const drives = JSON.parse(driveStdout || '[]');
                        
                        // Ensure we always have arrays
                        const usbArray = Array.isArray(usbDevices) ? usbDevices : [usbDevices];
                        const driveArray = Array.isArray(drives) ? drives : [drives];
                        
                        // Combine and format results
                        const allDevices = [
                            ...usbArray.map(device => ({
                                ...device,
                                type: 'USB_DEVICE'
                            })),
                            ...driveArray.map(drive => ({
                                FriendlyName: `USB Drive ${drive.DeviceID}`,
                                DeviceID: drive.DeviceID,
                                Status: 'OK',
                                Class: 'USB_STORAGE',
                                VolumeName: drive.VolumeName,
                                Size: drive.Size,
                                FileSystem: drive.FileSystem,
                                type: 'USB_STORAGE'
                            }))
                        ];
                        
                        resolve(allDevices);
                    } catch (parseError) {
                        resolve([]);
                    }
                });
            });
        });
    }
    
    // Handle USB device added
    async handleUSBDeviceAdded(device) {
        const deviceInfo = {
            deviceName: device.FriendlyName || 'Unknown Device',
            deviceId: device.DeviceID,
            status: device.Status,
            class: device.Class,
            timestamp: new Date(),
            type: device.type || 'USB_ADDED',
            volumeName: device.VolumeName,
            size: device.Size,
            fileSystem: device.FileSystem
        };
        
        this.logger.warn('USB device connected', deviceInfo);
        this.detectedDevices.set(device.DeviceID, deviceInfo);
        
        // Check if this is a USB storage device
        const isStorageDevice = this.isStorageDevice(deviceInfo);
        
        if (isStorageDevice) {
            this.logger.critical('USB STORAGE DEVICE DETECTED - TRIGGERING SECURITY VIOLATION');
            await this.handleSecurityViolation('USB_STORAGE_CONNECTED', deviceInfo);
        } else {
            // Check if device is allowed
            const isAllowed = this.isDeviceAllowed(deviceInfo);
            
            if (!isAllowed) {
                await this.handleSecurityViolation('USB_DEVICE_CONNECTED', deviceInfo);
            }
        }
        
        this.emit('deviceConnected', deviceInfo);
    }
    
    // Handle USB device removed
    async handleUSBDeviceRemoved(device) {
        const deviceInfo = {
            deviceName: 'Unknown Device',
            deviceId: device.DeviceID,
            timestamp: new Date(),
            type: 'USB_REMOVED'
        };
        
        this.logger.info('USB device disconnected', deviceInfo);
        this.detectedDevices.delete(device.DeviceID);
        this.emit('deviceDisconnected', deviceInfo);
    }
    
    // Check if device is allowed
    isDeviceAllowed(deviceInfo) {
        const deviceName = (deviceInfo.deviceName || '').toLowerCase();
        const manufacturer = (deviceInfo.manufacturer || '').toLowerCase();
        
        // Check against allowed devices list
        for (const allowedDevice of this.allowedDevices) {
            if (deviceName.includes(allowedDevice.toLowerCase()) || 
                manufacturer.includes(allowedDevice.toLowerCase())) {
                return true;
            }
        }
        
        // Special handling for known safe devices
        const safeKeywords = ['keyboard', 'mouse', 'pointing', 'trackpad', 'hid'];
        return safeKeywords.some(keyword => 
            deviceName.includes(keyword) || manufacturer.includes(keyword)
        );
    }
    
    // Check if device is a storage device
    isStorageDevice(deviceInfo) {
        const deviceName = (deviceInfo.deviceName || '').toLowerCase();
        const deviceClass = (deviceInfo.class || '').toLowerCase();
        const deviceType = (deviceInfo.type || '').toLowerCase();
        
        // Check if it's explicitly marked as USB storage
        if (deviceType === 'usb_storage' || deviceClass === 'usb_storage') {
            return true;
        }
        
        // Check for storage-related keywords
        const storageKeywords = [
            'usb', 'storage', 'drive', 'disk', 'flash', 'memory', 'stick',
            'thumb', 'pen', 'external', 'portable', 'removable'
        ];
        
        return storageKeywords.some(keyword => 
            deviceName.includes(keyword) || deviceClass.includes(keyword)
        );
    }
    
    // Perform initial hardware scan
    async performInitialScan() {
        this.logger.info('Performing initial hardware scan...');
        
        try {
            // Check for existing USB storage devices
            const currentDevices = await this.getUSBDevicesViaPowerShell();
            
            // Check for any USB storage devices
            for (const device of currentDevices) {
                if (device.type === 'USB_STORAGE' || device.Class === 'USB_STORAGE') {
                    this.logger.critical('USB STORAGE DEVICE FOUND DURING INITIAL SCAN');
                    await this.handleSecurityViolation('USB_STORAGE_CONNECTED', device);
                    return;
                }
            }
            
            this.logger.info('Initial scan completed - no USB storage devices found');
            
        } catch (error) {
            this.logger.error('Error during initial scan', { error: error.message });
        }
    }
    
    // Run PowerShell script
    runPowerShellScript(scriptName, args = []) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, '..', 'scripts', 'hardware-control', scriptName);
            const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" ${args.join(' ')}`;
            
            exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        exitCode: error.code || 1,
                        output: stdout + stderr,
                        error: error.message
                    });
                } else {
                    resolve({
                        exitCode: 0,
                        output: stdout,
                        stderr: stderr
                    });
                }
            });
        });
    }
    
    // Process security report from PowerShell script
    async processSecurityReport() {
        try {
            const reportPath = 'C:\\temp\\security-report.json';
            const reportExists = await fs.access(reportPath).then(() => true).catch(() => false);
            
            if (!reportExists) {
                this.logger.warn('Security report not found');
                return;
            }
            
            const reportData = await fs.readFile(reportPath, 'utf8');
            const report = JSON.parse(reportData);
            
            this.logger.info('Security report processed', {
                status: report.SecurityStatus,
                totalDevices: report.TotalDevices,
                forbiddenDevices: report.ForbiddenDevices?.length || 0,
                usbDevices: report.USBStorageDevices?.length || 0
            });
            
            if (report.SecurityStatus === 'VIOLATION') {
                await this.handleSecurityViolation('HARDWARE_VIOLATION', report);
            }
            
            this.emit('securityReportProcessed', report);
            
        } catch (error) {
            this.logger.error('Error processing security report', { error: error.message });
        }
    }
    
    // Handle security violation
    async handleSecurityViolation(violationType, details) {
        const violation = {
            type: violationType,
            details: details,
            timestamp: new Date(),
            severity: this.getViolationSeverity(violationType)
        };
        
        this.securityViolations.push(violation);
        this.logger.error('Security violation detected', violation);
        
        // Save violation to file
        await this.saveSecurityViolation(violation);
        
        // Emit security event
        this.emit('securityViolation', violation);
        
        // Take action based on violation severity
        await this.handleViolationResponse(violation);
    }
    
    // Get violation severity level
    getViolationSeverity(violationType) {
        const severityMap = {
            'USB_DEVICE_CONNECTED': 'HIGH',
            'USB_STORAGE_CONNECTED': 'CRITICAL',
            'HARDWARE_VIOLATION': 'CRITICAL',
            'HARDWARE_SCAN_FAILED': 'MEDIUM',
            'UNAUTHORIZED_DISPLAY': 'MEDIUM',
            'UNKNOWN_DEVICE': 'MEDIUM'
        };
        
        return severityMap[violationType] || 'LOW';
    }
    
    // Handle violation response
    async handleViolationResponse(violation) {
        if (violation.severity === 'CRITICAL' && this.options.autoShutdown) {
            this.logger.critical('Initiating emergency shutdown due to critical security violation');
            this.emit('emergencyShutdown', violation);
            
            // Actually shutdown the application
            process.exit(1);
        } else if (violation.severity === 'HIGH') {
            this.logger.warn('High severity violation - enhanced monitoring activated');
            // Increase monitoring frequency
            if (this.checkIntervalId) {
                clearInterval(this.checkIntervalId);
                this.startPeriodicChecks(10000); // Check every 10 seconds
            }
        }
    }
    
    // Save security violation to file
    async saveSecurityViolation(violation) {
        try {
            const violationPath = 'C:\\temp\\gods-eye-violations.jsonl';
            const violationLine = JSON.stringify(violation) + '\n';
            await fs.appendFile(violationPath, violationLine);
        } catch (error) {
            this.logger.error('Error saving security violation', { error: error.message });
        }
    }
    
    // Start periodic security checks
    startPeriodicChecks(interval = null) {
        const checkInterval = interval || this.options.checkInterval;
        
        this.checkIntervalId = setInterval(async () => {
            if (this.isMonitoring) {
                await this.performInitialScan();
            }
        }, checkInterval);
        
        this.logger.info('Periodic security checks started', { interval: checkInterval });
    }
    
    // Get current security status
    getSecurityStatus() {
        return {
            isMonitoring: this.isMonitoring,
            violationCount: this.securityViolations.length,
            connectedDevices: Array.from(this.detectedDevices.values()),
            lastCheck: new Date(),
            configuration: {
                strictMode: this.options.strictMode,
                allowOverride: this.options.allowOverride,
                autoShutdown: this.options.autoShutdown
            }
        };
    }
    
    // Create admin override (emergency access)
    async createAdminOverride(adminToken, reason) {
        try {
            const overrideData = {
                token: adminToken,
                reason: reason,
                timestamp: new Date(),
                expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
            };
            
            const overridePath = 'C:\\temp\\admin-override.flag';
            await fs.writeFile(overridePath, JSON.stringify(overrideData));
            
            this.logger.warn('Admin override created', { reason, expiresAt: overrideData.expiresAt });
            this.emit('adminOverride', overrideData);
            
            return true;
        } catch (error) {
            this.logger.error('Error creating admin override', { error: error.message });
            return false;
        }
    }
    
    // Remove admin override
    async removeAdminOverride() {
        try {
            const overridePath = 'C:\\temp\\admin-override.flag';
            await fs.unlink(overridePath);
            this.logger.info('Admin override removed');
            return true;
        } catch (error) {
            this.logger.error('Error removing admin override', { error: error.message });
            return false;
        }
    }
}

module.exports = HardwareMonitor;
