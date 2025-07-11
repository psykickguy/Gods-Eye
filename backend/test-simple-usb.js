// Test Simple USB Monitor
// This script tests the streamlined USB storage detection

const SimpleUSBMonitor = require('./simple-usb-monitor');

console.log('🔒 Testing Simple USB Monitor...\n');

async function testSimpleUSB() {
    try {
        console.log('1. Creating USB monitor...');
        const monitor = new SimpleUSBMonitor({
            checkInterval: 1000, // Check every 1 second
            autoShutdown: true
        });
        
        console.log('2. Starting monitoring...');
        await monitor.startMonitoring();
        
        console.log('3. USB monitoring is now active!');
        console.log('4. Insert a USB drive to test shutdown...');
        console.log('5. The application should shutdown immediately when USB storage is detected\n');
        
        // Handle USB storage detection
        monitor.on('usbStorageDetected', (drive) => {
            console.log('🚨 USB STORAGE DETECTED EVENT FIRED:', drive);
        });
        
        // Keep the process running
        console.log('Monitoring active... Press Ctrl+C to stop');
        
        // Show status every 10 seconds
        setInterval(() => {
            const status = monitor.getStatus();
            console.log(`📊 Status: Monitoring=${status.isMonitoring}, Connected drives: ${status.connectedDrives.length}`);
        }, 10000);
        
    } catch (error) {
        console.error('❌ Error testing USB monitor:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping USB test...');
    process.exit(0);
});

// Start the test
testSimpleUSB(); 