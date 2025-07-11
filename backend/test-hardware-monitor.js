// Test Hardware Monitor Integration
// This tests the actual HardwareMonitor class

const HardwareMonitor = require('./services/hardwareMonitor');

console.log('🔍 Testing Hardware Monitor Class...\n');

async function testHardwareMonitor() {
    try {
        const monitor = new HardwareMonitor({
            autoShutdown: false,
            allowOverride: false,
            strictMode: true,
            checkInterval: 2000
        });
        
        console.log('✅ Hardware monitor created');
        
        // Set up event handlers
        monitor.on('securityViolation', (violation) => {
            console.error('🚨 SECURITY VIOLATION:', violation);
        });
        
        monitor.on('deviceConnected', (device) => {
            console.log('🔌 Device connected:', device);
            
            // Check for USB storage
            if (device.class === 'USB' || 
                device.class === 'DiskDrive' ||
                device.class === 'WPD' ||
                (device.deviceName && (
                  device.deviceName.toLowerCase().includes('storage') || 
                  device.deviceName.toLowerCase().includes('drive') ||
                  device.deviceName.toLowerCase().includes('disk') ||
                  device.deviceName.toLowerCase().includes('usb') ||
                  device.deviceName.toLowerCase().includes('sandisk')
                ))) {
                console.error('🚨 USB STORAGE DETECTED - WOULD SHUTDOWN APP!');
                console.error('Device:', device);
            }
        });
        
        monitor.on('deviceDisconnected', (device) => {
            console.log('🔌 Device disconnected:', device);
        });
        
        monitor.on('monitoringStarted', () => {
            console.log('✅ Hardware monitoring is now active');
        });
        
        monitor.on('error', (error) => {
            console.error('❌ Hardware monitor error:', error);
        });
        
        // Start monitoring
        console.log('🔄 Starting hardware monitoring...');
        await monitor.startMonitoring();
        
        console.log('✅ Hardware monitor started successfully');
        console.log('💡 Insert a USB drive to test detection\n');
        
        // Let it run for testing
        console.log('Press Ctrl+C to stop monitoring');
        
    } catch (error) {
        console.error('❌ Error testing hardware monitor:', error);
    }
}

testHardwareMonitor();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping hardware monitor test...');
    process.exit(0);
});
