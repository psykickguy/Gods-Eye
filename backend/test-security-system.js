// Security System Test
// Run this to test if the security system is working

const SecurityManager = require('./services/securityManager');

console.log('🔒 Testing Security System...\n');

async function testSecuritySystem() {
    try {
        console.log('1. Initializing Security Manager...');
        const securityManager = new SecurityManager({
            autoShutdown: true,
            strictMode: true,
            allowOverride: false
        });
        
        console.log('2. Starting security monitoring...');
        await securityManager.initialize();
        
        console.log('3. Security system is now active!');
        console.log('4. Insert a USB drive to test shutdown...');
        console.log('5. The application should shutdown immediately when USB storage is detected\n');
        
        // Handle security violations
        securityManager.on('emergencyShutdown', (violation) => {
            console.log('🚨 EMERGENCY SHUTDOWN TRIGGERED:', violation);
            console.log('✅ Security system is working correctly!');
            process.exit(0);
        });
        
        securityManager.on('securityViolation', (violation) => {
            console.log('⚠️  Security violation detected:', violation.type);
        });
        
        // Keep the process running
        console.log('Monitoring active... Press Ctrl+C to stop');
        
    } catch (error) {
        console.error('❌ Error testing security system:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Stopping security test...');
    process.exit(0);
});

// Start the test
testSecuritySystem(); 