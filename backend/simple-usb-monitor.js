// Simple USB Monitor - Focused on USB Storage Detection
// This is a streamlined version that specifically detects USB storage devices

const { exec } = require('child_process');
const EventEmitter = require('events');

class SimpleUSBMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            checkInterval: options.checkInterval || 1000, // Check every 1 second
            autoShutdown: options.autoShutdown !== undefined ? options.autoShutdown : true,
            ...options
        };
        
        this.isMonitoring = false;
        this.checkIntervalId = null;
        this.previousDrives = new Set();
        
        console.log('🔒 Simple USB Monitor initialized');
        console.log(`📊 Check interval: ${this.options.checkInterval}ms`);
        console.log(`🚨 Auto shutdown: ${this.options.autoShutdown ? 'ENABLED' : 'DISABLED'}\n`);
    }
    
    // Start monitoring
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️  Monitoring already active');
            return;
        }
        
        console.log('🚀 Starting USB storage monitoring...');
        this.isMonitoring = true;
        
        // Get initial state
        await this.checkForUSBStorage();
        
        // Start periodic checking
        this.checkIntervalId = setInterval(async () => {
            if (this.isMonitoring) {
                await this.checkForUSBStorage();
            }
        }, this.options.checkInterval);
        
        console.log('✅ USB monitoring active - Insert USB drive to test\n');
    }
    
    // Stop monitoring
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }
        
        console.log('🛑 Stopping USB monitoring...');
        this.isMonitoring = false;
        
        if (this.checkIntervalId) {
            clearInterval(this.checkIntervalId);
            this.checkIntervalId = null;
        }
        
        console.log('✅ USB monitoring stopped');
    }
    
    // Check for USB storage devices
    async checkForUSBStorage() {
        try {
            const drives = await this.getUSBDrives();
            const currentDrives = new Set(drives.map(d => d.DeviceID));
            
            // Find new drives
            for (const drive of drives) {
                if (!this.previousDrives.has(drive.DeviceID)) {
                    console.log('🚨 NEW USB STORAGE DEVICE DETECTED!');
                    console.log(`   Drive: ${drive.DeviceID}`);
                    console.log(`   Label: ${drive.VolumeName || 'No Label'}`);
                    console.log(`   Size: ${drive.Size ? Math.round(drive.Size / 1024 / 1024 / 1024 * 100) / 100 + ' GB' : 'Unknown'}`);
                    console.log(`   File System: ${drive.FileSystem || 'Unknown'}`);
                    
                    this.emit('usbStorageDetected', drive);
                    
                    if (this.options.autoShutdown) {
                        console.log('🚨 SECURITY VIOLATION - SHUTTING DOWN APPLICATION!');
                        console.log('❌ USB storage device detected - Application terminated for security');
                        
                        // Give a moment for the message to be seen
                        setTimeout(() => {
                            process.exit(1);
                        }, 1000);
                    }
                }
            }
            
            // Find removed drives
            for (const driveId of this.previousDrives) {
                if (!currentDrives.has(driveId)) {
                    console.log(`💾 USB drive removed: ${driveId}`);
                }
            }
            
            this.previousDrives = currentDrives;
            
        } catch (error) {
            console.error('❌ Error checking USB drives:', error.message);
        }
    }
    
    // Get USB drives via PowerShell
    getUSBDrives() {
        return new Promise((resolve, reject) => {
            const command = `powershell -Command "Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 } | Select-Object DeviceID, VolumeName, Size, FileSystem | ConvertTo-Json"`;
            
            exec(command, { timeout: 5000 }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(`PowerShell error: ${error.message}`));
                    return;
                }
                
                try {
                    const drives = JSON.parse(stdout || '[]');
                    resolve(Array.isArray(drives) ? drives : [drives]);
                } catch (parseError) {
                    resolve([]);
                }
            });
        });
    }
    
    // Get status
    getStatus() {
        return {
            isMonitoring: this.isMonitoring,
            checkInterval: this.options.checkInterval,
            autoShutdown: this.options.autoShutdown,
            connectedDrives: Array.from(this.previousDrives)
        };
    }
}

module.exports = SimpleUSBMonitor; 