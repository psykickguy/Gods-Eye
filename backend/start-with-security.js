// Gods Eye with Security System
// This script starts the application with hardware security monitoring

const SecurityManager = require('./services/securityManager');
const app = require('./app');

console.log('🔒 Starting Gods Eye with Hardware Security...\n');

async function startWithSecurity() {
    try {
        // Initialize security manager first
        console.log('1. Initializing Security Manager...');
        const securityManager = new SecurityManager({
            autoShutdown: true,
            strictMode: true,
            allowOverride: false,
            maxViolations: 1, // Shutdown on first violation
            alertThreshold: 1
        });
        
        console.log('2. Starting security monitoring...');
        await securityManager.initialize();
        
        console.log('3. Security system is active and monitoring hardware...');
        console.log('4. Starting main application...\n');
        
        // Handle security violations
        securityManager.on('emergencyShutdown', (violation) => {
            console.log('🚨 EMERGENCY SHUTDOWN TRIGGERED!');
            console.log('❌ USB Storage Device Detected - Security Violation');
            console.log('🔒 Application shutting down for security...');
            process.exit(1);
        });
        
        securityManager.on('securityViolation', (violation) => {
            console.log('⚠️  Security violation detected:', violation.type);
            if (violation.type === 'USB_STORAGE_CONNECTED') {
                console.log('🚨 USB STORAGE DETECTED - SHUTTING DOWN!');
                process.exit(1);
            }
        });
        
        // The app will start normally, but security monitoring is active
        console.log('✅ Application started with security monitoring');
        console.log('💡 Insert a USB drive to test the security system');
        
    } catch (error) {
        console.error('❌ Failed to start with security:', error.message);
        process.exit(1);
    }
}

// Start the application with security
startWithSecurity(); 