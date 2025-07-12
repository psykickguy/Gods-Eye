# Gods Eye Hardware Security System

A comprehensive hardware access control mechanism for Windows-based enterprise applications that prevents unauthorized device interactions at the system level.

## 🔒 Overview

This security system provides multi-layered hardware access control including:

- **Pre-launch hardware validation** - Scans hardware before application startup
- **Real-time device monitoring** - Monitors device changes during runtime
- **Automatic security enforcement** - Blocks unauthorized devices and enforces policies
- **Admin override capabilities** - Emergency access controls for authorized personnel
- **Comprehensive logging** - Full audit trail of all hardware events

## 🏗️ Architecture

### Components

1. **PowerShell Scripts** (`backend/scripts/hardware-control/`)
   - `device-scanner.ps1` - Core hardware detection and validation
   - `startup-monitor.ps1` - Boot-time security checks
   - `install-service.ps1` - Service installation and configuration

2. **Node.js Services** (`backend/services/`)
   - `hardwareMonitor.js` - Real-time USB and device monitoring
   - `securityManager.js` - Security policy enforcement and API management

3. **API Endpoints** (`backend/routes/`)
   - `securityRoutes.js` - REST API for security management

4. **Electron Integration**
   - Hardware monitoring integrated into main application
   - Automatic shutdown on security violations

## 🚀 Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Install Hardware Security Service (Administrator Required)

```powershell
# Run PowerShell as Administrator
cd "C:\projects\Gods-Eye\backend\scripts\hardware-control"
.\install-service.ps1 -AppPath "C:\path\to\your\gods-eye.exe"
```

### 3. Configure Environment Variables

Create or update `backend/.env`:

```env
# Hardware Security Configuration
ADMIN_TOKENS=your-secure-admin-token-here,another-admin-token
SECURITY_API_KEY=your-secure-api-key-here
HARDWARE_STRICT_MODE=true
HARDWARE_AUTO_SHUTDOWN=false
```

## 🔧 Configuration

### Security Policies

The system uses configurable security policies defined in `backend/config/hardware-security.json`:

```json
{
  "allowedDevices": [
    "keyboard",
    "mouse",
    "pointing",
    "trackpad",
    "internal"
  ],
  "forbiddenDeviceClasses": [
    "USB",
    "WPD", 
    "Volume",
    "Image",
    "Media",
    "Ports",
    "Bluetooth",
    "IEEE1394",
    "SCSI",
    "SmartCardReader"
  ],
  "securityPolicies": {
    "blockUSBStorage": true,
    "blockExternalDisplays": false,
    "blockUnknownHID": true,
    "alertOnViolation": true,
    "autoShutdownOnViolation": false
  }
}
```

### Hardware Classes

#### ✅ Allowed Devices
- **HID Devices**: Keyboards, mice, trackpads, pointing devices
- **System Devices**: Internal system components
- **Display Adapters**: Internal graphics cards
- **Network Adapters**: Built-in network interfaces
- **Audio Devices**: Internal audio hardware

#### ❌ Blocked Devices
- **USB Storage**: External drives, flash drives
- **Portable Devices**: Smartphones, tablets, media players
- **Imaging Devices**: Cameras, scanners, webcams
- **Communication Ports**: Serial, parallel, Bluetooth
- **External Storage**: FireWire drives, external SCSI devices

## 🔐 API Usage

### Authentication

All API endpoints require authentication:

```bash
# API Key (required for all endpoints)
curl -H "X-API-Key: your-api-key" http://localhost:3001/api/security/status

# Admin Token (required for admin endpoints)
curl -H "X-API-Key: your-api-key" -H "X-Admin-Token: your-admin-token" http://localhost:3001/api/security/admin/restart
```

### Available Endpoints

#### Public Endpoints

- `GET /api/security/health` - System health check
- `GET /api/security/docs` - API documentation

#### Authenticated Endpoints

- `GET /api/security/status` - Current security status
- `GET /api/security/violations` - Security violation history
- `GET /api/security/devices` - Connected devices list
- `POST /api/security/scan` - Force hardware scan
- `GET /api/security/config` - System configuration

#### Admin Endpoints

- `POST /api/security/admin/override` - Create admin override
- `DELETE /api/security/admin/override/:id` - Remove admin override
- `POST /api/security/admin/restart` - Restart monitoring
- `POST /api/security/admin/shutdown` - Emergency shutdown
- `GET /api/security/admin/logs` - Security logs

### Example API Calls

```bash
# Check security status
curl -H "X-API-Key: your-api-key" \
  http://localhost:3001/api/security/status

# Get recent violations
curl -H "X-API-Key: your-api-key" \
  "http://localhost:3001/api/security/violations?limit=10"

# Create admin override
curl -X POST \
  -H "X-API-Key: your-api-key" \
  -H "X-Admin-Token: your-admin-token" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Emergency maintenance access"}' \
  http://localhost:3001/api/security/admin/override

# Force hardware scan
curl -X POST \
  -H "X-API-Key: your-api-key" \
  http://localhost:3001/api/security/scan
```

## 📊 Monitoring and Logging

### Log Files

All security events are logged to `C:\temp\`:

- `gods-eye-hardware.log` - PowerShell scanner logs
- `gods-eye-startup.log` - Startup monitoring logs
- `gods-eye-security-events.jsonl` - Structured security events
- `gods-eye-violations.jsonl` - Security violations
- `gods-eye-security-manager.log` - Security manager logs

### Event Types

- **DEVICE_CONNECTED** - New device detected
- **DEVICE_DISCONNECTED** - Device removed
- **SECURITY_VIOLATION** - Unauthorized device or policy violation
- **ADMIN_OVERRIDE** - Admin emergency access granted
- **EMERGENCY_SHUTDOWN** - System shutdown due to security breach

## 🛠️ Troubleshooting

### Common Issues

1. **Service Installation Fails**
   ```powershell
   # Ensure running as Administrator
   # Check execution policy
   Get-ExecutionPolicy
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

2. **USB Detection Not Working**
   ```bash
   # Check Node.js dependencies
   npm install usb-detection --save
   
   # Verify Windows USB driver
   # Device Manager > Universal Serial Bus controllers
   ```

3. **False Positives**
   ```json
   // Add device to allowed list in hardware-security.json
   {
     "allowedDevices": [
       "keyboard",
       "mouse",
       "your-device-name"
     ]
   }
   ```

### Debug Mode

Enable debug logging:

```powershell
# Run scanner with verbose output
.\device-scanner.ps1 -Verbose

# Check detailed logs
Get-Content C:\temp\gods-eye-hardware.log -Tail 50
```

## 🔧 Development

### Testing Hardware Detection

```bash
# Test hardware scanner
cd backend/scripts/hardware-control
powershell -ExecutionPolicy Bypass -File device-scanner.ps1

# Test Node.js monitoring
cd backend
node -e "
const HardwareMonitor = require('./services/hardwareMonitor');
const monitor = new HardwareMonitor();
monitor.startMonitoring();
"
```

### Custom Device Rules

Add custom device detection logic in `hardwareMonitor.js`:

```javascript
// Custom device validation
isDeviceAllowed(deviceInfo) {
    // Add your custom logic here
    if (deviceInfo.manufacturer === 'YourTrustedManufacturer') {
        return true;
    }
    
    // Call parent method
    return super.isDeviceAllowed(deviceInfo);
}
```

## 📋 Security Checklist

### Pre-Deployment

- [ ] Configure admin tokens and API keys
- [ ] Test hardware detection with known devices
- [ ] Verify PowerShell execution policy
- [ ] Install Windows service with admin privileges
- [ ] Test emergency override procedures
- [ ] Configure logging and monitoring
- [ ] Document authorized devices

### Runtime Monitoring

- [ ] Monitor security event logs
- [ ] Check system health endpoints
- [ ] Verify hardware scan intervals
- [ ] Test violation alert systems
- [ ] Validate admin access procedures

## 🚨 Emergency Procedures

### Admin Override

1. **Create Emergency Access**:
   ```bash
   curl -X POST \
     -H "X-API-Key: your-api-key" \
     -H "X-Admin-Token: emergency-admin-token" \
     -d '{"reason": "Emergency access required"}' \
     http://localhost:3001/api/security/admin/override
   ```

2. **Disable Hardware Monitoring**:
   ```bash
   curl -X POST \
     -H "X-Admin-Token: emergency-admin-token" \
     http://localhost:3001/api/security/admin/shutdown
   ```

### Service Management

```powershell
# Stop scheduled task
Stop-ScheduledTask -TaskName "GodsEye-HardwareSecurity"

# Disable USB blocking (requires admin)
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\USBSTOR" -Name "Start" -Value 3

# Uninstall service
.\install-service.ps1 -Uninstall
```

## 📞 Support

For issues and support:

1. Check logs in `C:\temp\gods-eye-*.log`
2. Verify API endpoints with `/api/security/health`
3. Test hardware scanner manually
4. Review security configuration
5. Use admin override for emergency access

## 🔐 Security Considerations

- **Admin Tokens**: Use strong, unique tokens for admin access
- **API Keys**: Rotate API keys regularly
- **Log Security**: Protect log files from unauthorized access
- **Network Security**: Secure API endpoints with HTTPS in production
- **Physical Security**: Ensure physical access to system is controlled

## 📝 License

This hardware security system is part of the Gods Eye application and follows the same licensing terms.
