# Gods Eye Hardware Security System

This document explains how the hardware security system works and how to test it.

## Overview

The Gods Eye application includes a comprehensive hardware security system that monitors for unauthorized USB storage devices and other security threats. When a USB storage device is detected, the application will automatically shutdown to prevent data exfiltration.

## How It Works

### 1. Hardware Monitoring
- **Real-time USB Detection**: Monitors for USB devices every 2 seconds
- **Storage Device Detection**: Specifically detects USB storage devices (flash drives, external hard drives)
- **PowerShell Integration**: Uses Windows PowerShell to scan hardware
- **Event-driven Architecture**: Responds immediately to device changes

### 2. Security Violations
- **USB Storage Connected**: Critical violation that triggers immediate shutdown
- **Unauthorized USB Devices**: High severity violation
- **Hardware Scan Failures**: Medium severity violation

### 3. Response Actions
- **Immediate Shutdown**: Application exits when USB storage is detected
- **Logging**: All security events are logged to files
- **Admin Override**: Emergency access system (disabled by default)

## Testing the Security System

### Quick Test
```bash
# Test the security system without starting the full application
npm run test:security
```

### USB Detection Test
```bash
# Test USB detection specifically
npm run test:usb
```

### Start Application with Security
```bash
# Start the application with security monitoring enabled
npm run start:secure
```

### Normal Start (Security Disabled)
```bash
# Start the application normally (security still active but less strict)
npm start
```

## Security Configuration

### Default Settings
- **Auto Shutdown**: Enabled
- **Strict Mode**: Enabled
- **Allow Override**: Disabled
- **Check Interval**: 2 seconds for USB monitoring
- **Max Violations**: 1 (shutdown on first violation)

### Allowed Devices
- Keyboard
- Mouse
- Pointing devices
- Trackpad
- HID devices

### Forbidden Devices
- USB storage devices
- External drives
- Flash drives
- Memory sticks
- Any removable storage

## Log Files

The security system creates several log files in `C:\temp\`:

- `gods-eye-security-manager.log` - Security manager logs
- `gods-eye-hardware-runtime.log` - Hardware monitoring logs
- `gods-eye-violations.jsonl` - Security violations
- `gods-eye-security-events.jsonl` - All security events
- `security-report.json` - Latest security scan report

## Testing Procedure

1. **Start the security test**:
   ```bash
   npm run test:security
   ```

2. **Wait for initialization**:
   ```
   🔒 Testing Security System...
   1. Initializing Security Manager...
   2. Starting security monitoring...
   3. Security system is now active!
   4. Insert a USB drive to test shutdown...
   ```

3. **Insert a USB drive**:
   - The application should detect the USB storage device
   - Log a security violation
   - Shutdown immediately

4. **Check the logs**:
   - Review the log files in `C:\temp\`
   - Verify the violation was recorded

## Troubleshooting

### Security System Not Starting
- Check if PowerShell execution policy allows scripts
- Ensure the `C:\temp\` directory exists
- Check for any error messages in the console

### USB Detection Not Working
- Run `npm run test:usb` to test USB detection specifically
- Check if the USB device is properly recognized by Windows
- Verify the PowerShell commands work manually

### Application Not Shutting Down
- Check if `autoShutdown` is enabled in the configuration
- Verify the security violation severity is set to 'CRITICAL'
- Check the logs for any errors

## Emergency Override

If you need to temporarily disable the security system:

1. Create an override file:
   ```powershell
   # Run as Administrator
   New-Item -Path "C:\temp\admin-override.flag" -ItemType File
   ```

2. The override will expire after 1 hour

3. Remove the override:
   ```powershell
   Remove-Item "C:\temp\admin-override.flag"
   ```

## Security Best Practices

1. **Regular Testing**: Test the security system regularly
2. **Log Monitoring**: Review security logs periodically
3. **Configuration Review**: Verify security settings are appropriate
4. **Backup Procedures**: Ensure data is backed up before testing
5. **User Training**: Train users on security policies

## API Endpoints

The security system provides REST API endpoints:

- `GET /api/security/status` - Get security status
- `GET /api/security/violations` - Get security violations
- `POST /api/security/override` - Create admin override
- `DELETE /api/security/override` - Remove admin override

## Support

If you encounter issues with the security system:

1. Check the log files for detailed error messages
2. Run the test scripts to isolate the problem
3. Verify PowerShell execution policies
4. Ensure Windows permissions are correct 