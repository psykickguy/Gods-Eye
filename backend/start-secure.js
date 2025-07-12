// Gods Eye with USB Security
// This script starts the application with USB storage monitoring

const SimpleUSBMonitor = require('./simple-usb-monitor');
const app = require('./app');

console.log('🔒 Starting Gods Eye with USB Security...\n');

async function startWithUSBSecurity() {
    try {
        // Initialize USB monitor first
        console.log('1. Initializing USB Security Monitor...');
        const usbMonitor = new SimpleUSBMonitor({
            checkInterval: 1000, // Check every 1 second
            autoShutdown: true
        });
        
        console.log('2. Starting USB monitoring...');
        await usbMonitor.startMonitoring();
        
        console.log('3. USB security is active and monitoring...');
        console.log('4. Starting main application...\n');
        
        // Handle USB storage detection
        usbMonitor.on('usbStorageDetected', (drive) => {
            console.log('🚨 USB STORAGE DETECTED - SHUTTING DOWN!');
            console.log('❌ Security violation: USB storage device connected');
            console.log(`   Drive: ${drive.DeviceID}`);
            console.log(`   Label: ${drive.VolumeName || 'No Label'}`);
            console.log(`   Size: ${drive.Size ? Math.round(drive.Size / 1024 / 1024 / 1024 * 100) / 100 + ' GB' : 'Unknown'}`);
            console.log('🔒 Application shutting down for security...');
            
            // Shutdown the application
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });
        
        // The app will start normally, but USB monitoring is active
        console.log('✅ Application started with USB security monitoring');
        console.log('💡 Insert a USB drive to test the security system');
        
    } catch (error) {
        console.error('❌ Failed to start with USB security:', error.message);
        process.exit(1);
    }
}

// Start the application with USB security
startWithUSBSecurity(); 