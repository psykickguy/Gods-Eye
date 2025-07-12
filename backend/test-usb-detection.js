// Quick USB Detection Test
// Run this to test if USB detection is working

const { exec } = require('child_process');
const { broadcastShutdown } = require('./ws-shutdown-server');

console.log('🔍 Testing USB Detection...\n');

// Function to get USB devices
async function getUSBDevices() {
    return new Promise((resolve, reject) => {
        const command = `powershell -Command "Get-PnpDevice | Where-Object { $_.Class -eq 'DiskDrive' -or $_.InstanceId -like '*USB*' -or $_.FriendlyName -like '*USB*' } | Select-Object FriendlyName, DeviceID, Status, Class | ConvertTo-Json"`;
        
        exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`PowerShell error: ${error.message}`));
                return;
            }
            
            try {
                const devices = JSON.parse(stdout || '[]');
                resolve(Array.isArray(devices) ? devices : [devices]);
            } catch (parseError) {
                resolve([]);
            }
        });
    });
}

// Function to get logical drives (USB storage)
async function getLogicalDrives() {
    return new Promise((resolve, reject) => {
        const command = `powershell -Command "Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 } | Select-Object DeviceID, VolumeName, Size, FileSystem | ConvertTo-Json"`;
        
        exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
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

// Monitor for changes
async function monitorUSB() {
    let previousDevices = new Set();
    let previousDrives = new Set();
    
    console.log('📊 Starting USB monitoring...');
    console.log('💡 Insert a USB drive to test detection\n');
    
    const checkForChanges = async () => {
        try {
            // Check USB devices
            const devices = await getUSBDevices();
            const currentDevices = new Set(devices.map(d => d.DeviceID));
            
            // Check logical drives (USB storage)
            const drives = await getLogicalDrives();
            const currentDrives = new Set(drives.map(d => d.DeviceID));
            
            // Find new devices
            for (const device of devices) {
                if (!previousDevices.has(device.DeviceID)) {
                    console.log('🔌 NEW USB DEVICE DETECTED:');
                    console.log(`   Name: ${device.FriendlyName}`);
                    console.log(`   Class: ${device.Class}`);
                    console.log(`   Status: ${device.Status}`);
                    console.log(`   ID: ${device.DeviceID}\n`);
                    
                    // Check if it's a storage device
                    if (device.Class === 'DiskDrive' || 
                        device.FriendlyName.toLowerCase().includes('usb') ||
                        device.FriendlyName.toLowerCase().includes('storage') ||
                        device.FriendlyName.toLowerCase().includes('drive')) {
                        console.log('🚨 USB STORAGE DEVICE DETECTED - APP WOULD SHUTDOWN NOW!');
                        console.log('❌ Security violation triggered\n');
                        broadcastShutdown();
                        setTimeout(() => process.exit(1), 1000);
                    }
                }
            }
            
            // Find new drives
            for (const drive of drives) {
                if (!previousDrives.has(drive.DeviceID)) {
                    console.log('💾 NEW USB DRIVE DETECTED:');
                    console.log(`   Drive: ${drive.DeviceID}`);
                    console.log(`   Label: ${drive.VolumeName || 'No Label'}`);
                    console.log(`   Size: ${drive.Size ? Math.round(drive.Size / 1024 / 1024 / 1024 * 100) / 100 + ' GB' : 'Unknown'}`);
                    console.log(`   File System: ${drive.FileSystem || 'Unknown'}\n`);
                    
                    console.log('🚨 USB STORAGE DRIVE DETECTED - APP WOULD SHUTDOWN NOW!');
                    console.log('❌ Security violation triggered\n');
                    broadcastShutdown();
                    setTimeout(() => process.exit(1), 1000);
                }
            }
            
            // Find removed devices
            for (const deviceId of previousDevices) {
                if (!currentDevices.has(deviceId)) {
                    console.log('🔌 USB DEVICE REMOVED:', deviceId);
                }
            }
            
            // Find removed drives
            for (const driveId of previousDrives) {
                if (!currentDrives.has(driveId)) {
                    console.log('💾 USB DRIVE REMOVED:', driveId);
                }
            }
            
            previousDevices = currentDevices;
            previousDrives = currentDrives;
            
        } catch (error) {
            console.error('❌ Error checking devices:', error.message);
        }
    };
    
    // Initial scan
    await checkForChanges();
    
    // Check every 2 seconds
    setInterval(checkForChanges, 2000);
}

// Start monitoring
monitorUSB().catch(console.error);

console.log('Press Ctrl+C to stop monitoring');

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping USB monitoring...');
    process.exit(0);
});
