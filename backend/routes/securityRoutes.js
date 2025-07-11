// Security Routes - API endpoints for hardware monitoring
// Provides REST API interface for hardware security management

const express = require('express');
const SecurityManager = require('../services/securityManager');

const router = express.Router();

// Initialize security manager
let securityManager = null;

// Middleware to ensure security manager is initialized
const ensureSecurityManager = async (req, res, next) => {
    if (!securityManager) {
        securityManager = new SecurityManager({
            adminTokens: process.env.ADMIN_TOKENS ? process.env.ADMIN_TOKENS.split(',') : ['admin123'],
            apiKey: process.env.SECURITY_API_KEY || 'default-api-key'
        });
        
        try {
            await securityManager.initialize();
        } catch (error) {
            return res.status(500).json({
                success: false,
                error: 'Failed to initialize security manager',
                details: error.message
            });
        }
    }
    
    req.securityManager = securityManager;
    next();
};

// Middleware to authenticate API requests
const authenticateAPI = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    const adminToken = req.headers['x-admin-token'] || req.query.adminToken;
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'API key required',
            message: 'Include X-API-Key header or apiKey query parameter'
        });
    }
    
    const auth = req.securityManager.authenticateRequest(apiKey, adminToken);
    if (!auth.success) {
        return res.status(401).json(auth);
    }
    
    req.isAdmin = !!adminToken;
    req.adminToken = adminToken;
    next();
};

// Health check endpoint
router.get('/health', ensureSecurityManager, async (req, res) => {
    try {
        const health = await req.securityManager.healthCheck();
        
        const httpStatus = health.status === 'HEALTHY' ? 200 : 
                          health.status === 'WARNING' ? 200 : 
                          health.status === 'CRITICAL' ? 503 : 500;
        
        res.status(httpStatus).json({
            success: true,
            data: health
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Health check failed',
            details: error.message
        });
    }
});

// Get security status
router.get('/status', ensureSecurityManager, authenticateAPI, (req, res) => {
    try {
        const status = req.securityManager.getSecurityStatus();
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get security status',
            details: error.message
        });
    }
});

// Get security violations
router.get('/violations', ensureSecurityManager, authenticateAPI, (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const violations = req.securityManager.getSecurityViolations(limit);
        
        res.json({
            success: true,
            data: {
                violations: violations,
                count: violations.length,
                limit: limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get security violations',
            details: error.message
        });
    }
});

// Get connected devices
router.get('/devices', ensureSecurityManager, authenticateAPI, (req, res) => {
    try {
        const devices = req.securityManager.getConnectedDevices();
        
        res.json({
            success: true,
            data: {
                devices: devices,
                count: devices.length,
                timestamp: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get connected devices',
            details: error.message
        });
    }
});

// Force hardware scan
router.post('/scan', ensureSecurityManager, authenticateAPI, async (req, res) => {
    try {
        const result = await req.securityManager.forceHardwareScan(req.adminToken);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Hardware scan initiated',
                timestamp: new Date()
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to initiate hardware scan',
            details: error.message
        });
    }
});

// Get system configuration
router.get('/config', ensureSecurityManager, authenticateAPI, (req, res) => {
    try {
        const config = req.securityManager.getSystemConfiguration();
        
        res.json({
            success: true,
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to get system configuration',
            details: error.message
        });
    }
});

// Admin-only routes
const requireAdmin = (req, res, next) => {
    if (!req.isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Admin privileges required',
            message: 'This endpoint requires an admin token'
        });
    }
    next();
};

// Create admin override
router.post('/admin/override', ensureSecurityManager, authenticateAPI, requireAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        
        if (!reason) {
            return res.status(400).json({
                success: false,
                error: 'Reason required',
                message: 'Override reason must be provided'
            });
        }
        
        const result = await req.securityManager.createAdminOverride(req.adminToken, reason);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Admin override created',
                data: {
                    overrideId: result.overrideId,
                    expiresAt: result.expiresAt
                }
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to create admin override',
            details: error.message
        });
    }
});

// Remove admin override
router.delete('/admin/override/:overrideId', ensureSecurityManager, authenticateAPI, requireAdmin, async (req, res) => {
    try {
        const { overrideId } = req.params;
        const result = await req.securityManager.removeAdminOverride(overrideId, req.adminToken);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Admin override removed'
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to remove admin override',
            details: error.message
        });
    }
});

// Restart hardware monitoring
router.post('/admin/restart', ensureSecurityManager, authenticateAPI, requireAdmin, async (req, res) => {
    try {
        const result = await req.securityManager.restartMonitoring(req.adminToken);
        
        if (result.success) {
            res.json({
                success: true,
                message: 'Hardware monitoring restarted'
            });
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to restart monitoring',
            details: error.message
        });
    }
});

// Emergency shutdown endpoint
router.post('/admin/shutdown', ensureSecurityManager, authenticateAPI, requireAdmin, async (req, res) => {
    try {
        const { reason } = req.body;
        
        res.json({
            success: true,
            message: 'Emergency shutdown initiated',
            reason: reason || 'Admin request'
        });
        
        // Shutdown security manager
        await req.securityManager.shutdown();
        
        // Exit the application after a delay
        setTimeout(() => {
            process.exit(0);
        }, 2000);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to initiate shutdown',
            details: error.message
        });
    }
});

// Get security logs
router.get('/admin/logs', ensureSecurityManager, authenticateAPI, requireAdmin, async (req, res) => {
    try {
        const fs = require('fs').promises;
        const logFiles = [
            'C:\\temp\\gods-eye-security-events.jsonl',
            'C:\\temp\\gods-eye-violations.jsonl',
            'C:\\temp\\gods-eye-hardware.log'
        ];
        
        const logs = {};
        
        for (const logFile of logFiles) {
            try {
                const content = await fs.readFile(logFile, 'utf8');
                const fileName = logFile.split('\\').pop();
                
                if (fileName.endsWith('.jsonl')) {
                    // Parse JSONL format
                    logs[fileName] = content.split('\n')
                        .filter(line => line.trim())
                        .map(line => {
                            try {
                                return JSON.parse(line);
                            } catch {
                                return { raw: line };
                            }
                        })
                        .slice(-100); // Last 100 entries
                } else {
                    // Plain text log
                    logs[fileName] = content.split('\n').slice(-100); // Last 100 lines
                }
            } catch (error) {
                logs[logFile.split('\\').pop()] = { error: 'Log file not accessible' };
            }
        }
        
        res.json({
            success: true,
            data: {
                logs: logs,
                timestamp: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve logs',
            details: error.message
        });
    }
});

// API documentation endpoint
router.get('/docs', (req, res) => {
    const documentation = {
        title: 'Gods Eye Hardware Security API',
        version: '1.0.0',
        description: 'REST API for hardware monitoring and security management',
        baseUrl: req.protocol + '://' + req.get('host') + req.baseUrl,
        authentication: {
            apiKey: 'Required for all endpoints (X-API-Key header or apiKey query parameter)',
            adminToken: 'Required for admin endpoints (X-Admin-Token header or adminToken query parameter)'
        },
        endpoints: {
            'GET /health': {
                description: 'System health check',
                authentication: 'None',
                response: 'Health status of all components'
            },
            'GET /status': {
                description: 'Get current security status',
                authentication: 'API Key',
                response: 'Security monitoring status and recent events'
            },
            'GET /violations': {
                description: 'Get security violations',
                authentication: 'API Key',
                parameters: 'limit (optional, default: 50)',
                response: 'List of security violations'
            },
            'GET /devices': {
                description: 'Get connected devices',
                authentication: 'API Key',
                response: 'List of currently connected devices'
            },
            'POST /scan': {
                description: 'Force hardware scan',
                authentication: 'API Key',
                response: 'Scan initiation status'
            },
            'GET /config': {
                description: 'Get system configuration',
                authentication: 'API Key',
                response: 'Current system configuration'
            },
            'POST /admin/override': {
                description: 'Create admin override',
                authentication: 'Admin Token',
                body: '{ "reason": "Override reason" }',
                response: 'Override ID and expiration'
            },
            'DELETE /admin/override/:id': {
                description: 'Remove admin override',
                authentication: 'Admin Token',
                response: 'Removal status'
            },
            'POST /admin/restart': {
                description: 'Restart hardware monitoring',
                authentication: 'Admin Token',
                response: 'Restart status'
            },
            'POST /admin/shutdown': {
                description: 'Emergency system shutdown',
                authentication: 'Admin Token',
                body: '{ "reason": "Shutdown reason" }',
                response: 'Shutdown initiation status'
            },
            'GET /admin/logs': {
                description: 'Get system logs',
                authentication: 'Admin Token',
                response: 'System logs and events'
            }
        }
    };
    
    res.json(documentation);
});

// Error handling middleware
router.use((error, req, res, next) => {
    console.error('Security API Error:', error);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date()
    });
});

module.exports = router;
