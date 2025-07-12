# Device Scanner - Hardware Access Control for Gods Eye
# This script scans connected hardware devices and validates against security policies

param(
    [string]$LogPath = "C:\temp\gods-eye-hardware.log",
    [string]$ConfigPath = "C:\temp\gods-eye-config.json",
    [switch]$AllowOverride = $false,
    [switch]$StrictMode = $true
)

# Initialize logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    Write-Host $logEntry
    Add-Content -Path $LogPath -Value $logEntry -Force
}

# Define allowed device classes (whitelist)
$AllowedDeviceClasses = @(
    "HIDClass",           # Human Interface Devices (keyboard, mouse)
    "System",             # System devices
    "Computer",           # Computer system
    "Processor",          # CPU
    "DiskDrive",          # Internal disk drives (not removable)
    "CDRom",              # CD/DVD drives (can be restricted if needed)
    "Display",            # Display adapters (internal)
    "Net",                # Network adapters
    "AudioEndpoint",      # Audio devices
    "SoftwareDevice"      # Software devices
)

# Define forbidden device classes (blacklist)
$ForbiddenDeviceClasses = @(
    "USB",                # USB storage devices
    "WPD",                # Windows Portable Devices
    "Volume",             # Removable volumes
    "Image",              # Imaging devices (cameras, scanners)
    "Media",              # Media devices
    "Ports",              # Serial/parallel ports
    "Bluetooth",          # Bluetooth devices
    "IEEE1394",           # FireWire devices
    "SCSI",               # SCSI devices (external)
    "SmartCardReader"     # Smart card readers
)

# Function to check if device is allowed
function Test-DeviceAllowed {
    param(
        [string]$DeviceClass,
        [string]$DeviceName,
        [string]$DeviceId
    )
    
    # Special handling for HID devices - only allow keyboard and mouse
    if ($DeviceClass -eq "HIDClass") {
        if ($DeviceName -match "keyboard|mouse|pointing|trackpad" -or 
            $DeviceId -match "keyboard|mouse|pointing|trackpad") {
            return $true
        }
        else {
            Write-Log "Suspicious HID device detected: $DeviceName ($DeviceId)" "WARNING"
            return $false
        }
    }
    
    # Check against forbidden list first
    foreach ($forbiddenClass in $ForbiddenDeviceClasses) {
        if ($DeviceClass -match $forbiddenClass) {
            return $false
        }
    }
    
    # Check against allowed list
    foreach ($allowedClass in $AllowedDeviceClasses) {
        if ($DeviceClass -match $allowedClass) {
            return $true
        }
    }
    
    # If not in either list, default to forbidden in strict mode
    return -not $StrictMode
}

# Function to get all connected devices
function Get-ConnectedDevices {
    Write-Log "Scanning for connected hardware devices..."
    
    try {
        $devices = Get-PnpDevice | Where-Object { $_.Status -eq "OK" }
        $deviceList = @()
        
        foreach ($device in $devices) {
            $deviceInfo = @{
                Name = $device.FriendlyName
                Class = $device.Class
                DeviceID = $device.DeviceID
                Status = $device.Status
                Manufacturer = $device.Manufacturer
                Service = $device.Service
                IsAllowed = Test-DeviceAllowed -DeviceClass $device.Class -DeviceName $device.FriendlyName -DeviceId $device.DeviceID
            }
            $deviceList += $deviceInfo
        }
        
        return $deviceList
    }
    catch {
        Write-Log "Error scanning devices: $($_.Exception.Message)" "ERROR"
        return @()
    }
}

# Function to detect USB storage devices specifically
function Get-USBStorageDevices {
    Write-Log "Scanning for USB storage devices..."
    
    try {
        $usbDevices = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DriveType -eq 2 }
        $storageDevices = @()
        
        foreach ($usb in $usbDevices) {
            $deviceInfo = @{
                DriveLetter = $usb.DeviceID
                Label = $usb.VolumeName
                Size = $usb.Size
                FreeSpace = $usb.FreeSpace
                FileSystem = $usb.FileSystem
                IsRemovable = $true
            }
            $storageDevices += $deviceInfo
            Write-Log "USB Storage Device Detected: $($usb.DeviceID) - $($usb.VolumeName)" "WARNING"
        }
        
        return $storageDevices
    }
    catch {
        Write-Log "Error scanning USB storage: $($_.Exception.Message)" "ERROR"
        return @()
    }
}

# Function to check for external displays
function Get-ExternalDisplays {
    Write-Log "Scanning for external displays..."
    
    try {
        $displays = Get-WmiObject -Class Win32_DesktopMonitor
        $externalDisplays = @()
        
        foreach ($display in $displays) {
            if ($display.MonitorType -ne "Internal") {
                $displayInfo = @{
                    Name = $display.Name
                    Type = $display.MonitorType
                    Manufacturer = $display.MonitorManufacturer
                    Status = $display.Status
                }
                $externalDisplays += $displayInfo
                Write-Log "External Display Detected: $($display.Name)" "WARNING"
            }
        }
        
        return $externalDisplays
    }
    catch {
        Write-Log "Error scanning displays: $($_.Exception.Message)" "ERROR"
        return @()
    }
}

# Main security check function
function Invoke-SecurityCheck {
    Write-Log "Starting hardware security check..." "INFO"
    
    $securityReport = @{
        Timestamp = Get-Date
        AllowedDevices = @()
        ForbiddenDevices = @()
        USBStorageDevices = @()
        ExternalDisplays = @()
        SecurityStatus = "UNKNOWN"
        TotalDevices = 0
    }
    
    # Get all connected devices
    $allDevices = Get-ConnectedDevices
    $securityReport.TotalDevices = $allDevices.Count
    
    foreach ($device in $allDevices) {
        if ($device.IsAllowed) {
            $securityReport.AllowedDevices += $device
        }
        else {
            $securityReport.ForbiddenDevices += $device
            Write-Log "FORBIDDEN DEVICE: $($device.Name) - Class: $($device.Class)" "ERROR"
        }
    }
    
    # Check USB storage devices
    $securityReport.USBStorageDevices = Get-USBStorageDevices
    
    # Check external displays
    $securityReport.ExternalDisplays = Get-ExternalDisplays
    
    # Determine security status
    $forbiddenCount = $securityReport.ForbiddenDevices.Count + 
                      $securityReport.USBStorageDevices.Count + 
                      $securityReport.ExternalDisplays.Count
    
    if ($forbiddenCount -eq 0) {
        $securityReport.SecurityStatus = "SECURE"
        Write-Log "Security Status: SECURE - No forbidden devices detected" "INFO"
    }
    else {
        $securityReport.SecurityStatus = "VIOLATION"
        Write-Log "Security Status: VIOLATION - $forbiddenCount forbidden devices detected" "ERROR"
    }
    
    return $securityReport
}

# Function to save security report
function Save-SecurityReport {
    param([object]$Report)
    
    try {
        $reportPath = Join-Path (Split-Path $LogPath -Parent) "security-report.json"
        $Report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
        Write-Log "Security report saved to: $reportPath" "INFO"
    }
    catch {
        Write-Log "Error saving security report: $($_.Exception.Message)" "ERROR"
    }
}

# Main execution
try {
    # Create log directory if it doesn't exist
    $logDir = Split-Path $LogPath -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force
    }
    
    Write-Log "Gods Eye Hardware Security Scanner Started" "INFO"
    Write-Log "Strict Mode: $StrictMode" "INFO"
    Write-Log "Allow Override: $AllowOverride" "INFO"
    
    # Perform security check
    $securityReport = Invoke-SecurityCheck
    
    # Save the report
    Save-SecurityReport -Report $securityReport
    
    # Return appropriate exit code
    if ($securityReport.SecurityStatus -eq "SECURE") {
        Write-Log "Hardware security check completed successfully" "INFO"
        exit 0
    }
    else {
        Write-Log "Hardware security check failed - unauthorized devices detected" "ERROR"
        
        # If override is allowed, check for override file
        if ($AllowOverride) {
            $overridePath = Join-Path (Split-Path $LogPath -Parent) "admin-override.flag"
            if (Test-Path $overridePath) {
                Write-Log "Admin override detected - allowing execution" "WARNING"
                exit 0
            }
        }
        
        exit 1
    }
}
catch {
    Write-Log "Critical error in hardware scanner: $($_.Exception.Message)" "ERROR"
    exit 2
}
