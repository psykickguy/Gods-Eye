# Install Hardware Security Service for Gods Eye
# This script installs and configures the hardware monitoring service

param(
    [string]$AppPath = "",
    [string]$ServiceName = "GodsEye-HardwareSecurity",
    [switch]$Uninstall = $false,
    [switch]$Force = $false
)

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Initialize logging
$logPath = "C:\temp\gods-eye-installer.log"
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] INSTALLER: $Message"
    Write-Host $logEntry
    Add-Content -Path $logPath -Value $logEntry -Force
}

# Function to create service installation batch file
function New-ServiceBatchFile {
    param([string]$ScriptPath, [string]$BatchPath)
    
    $batchContent = @"
@echo off
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File "$ScriptPath" -AppPath "$AppPath"
"@
    
    try {
        $batchContent | Out-File -FilePath $BatchPath -Encoding ASCII
        Write-Log "Service batch file created: $BatchPath" "INFO"
        return $true
    }
    catch {
        Write-Log "Error creating batch file: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to install Windows service using node-windows
function Install-WindowsService {
    Write-Log "Installing Windows service: $ServiceName" "INFO"
    
    try {
        # Create service wrapper script
        $serviceWrapperPath = Join-Path $PSScriptRoot "service-wrapper.js"
        $serviceWrapper = @"
const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
    name: '$ServiceName',
    description: 'Gods Eye Hardware Security Monitor',
    script: path.join(__dirname, 'startup-monitor.ps1'),
    scriptOptions: '-AppPath "$AppPath"',
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ],
    env: {
        name: "NODE_ENV",
        value: "production"
    }
});

// Listen for the "install" event
svc.on('install', function(){
    console.log('Service installed successfully');
    svc.start();
});

// Listen for the "start" event
svc.on('start', function(){
    console.log('Service started successfully');
});

// Install the service
svc.install();
"@
        
        $serviceWrapper | Out-File -FilePath $serviceWrapperPath -Encoding UTF8
        
        # Execute the service installation
        $nodeCommand = "node `"$serviceWrapperPath`""
        $result = Invoke-Expression $nodeCommand
        
        Write-Log "Windows service installation completed" "INFO"
        return $true
    }
    catch {
        Write-Log "Error installing Windows service: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to install scheduled task
function Install-ScheduledTask {
    Write-Log "Installing scheduled task: $ServiceName" "INFO"
    
    try {
        $scriptPath = Join-Path $PSScriptRoot "startup-monitor.ps1"
        
        # Remove existing task if it exists
        $existingTask = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
        if ($existingTask) {
            Write-Log "Removing existing scheduled task..." "INFO"
            Unregister-ScheduledTask -TaskName $ServiceName -Confirm:$false
        }
        
        # Create task action
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`" -AppPath `"$AppPath`""
        
        # Create task trigger (at startup)
        $trigger = New-ScheduledTaskTrigger -AtStartup
        
        # Create task principal (run as SYSTEM with highest privileges)
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        
        # Create task settings
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 0)
        
        # Create and register the task
        $task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings
        Register-ScheduledTask -TaskName $ServiceName -InputObject $task -Force
        
        Write-Log "Scheduled task installed successfully" "INFO"
        return $true
    }
    catch {
        Write-Log "Error installing scheduled task: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to create registry entries for hardware blocking
function Set-HardwareRegistrySettings {
    Write-Log "Configuring hardware registry settings..." "INFO"
    
    try {
        # USB storage blocking (requires admin privileges)
        $usbStorageKey = "HKLM:\SYSTEM\CurrentControlSet\Services\USBSTOR"
        if (Test-Path $usbStorageKey) {
            Set-ItemProperty -Path $usbStorageKey -Name "Start" -Value 4 -Force
            Write-Log "USB storage devices disabled via registry" "INFO"
        }
        
        # Create Gods Eye registry key for configuration
        $godsEyeKey = "HKLM:\SOFTWARE\GodsEye\HardwareSecurity"
        if (-not (Test-Path $godsEyeKey)) {
            New-Item -Path $godsEyeKey -Force
        }
        
        Set-ItemProperty -Path $godsEyeKey -Name "Installed" -Value 1 -Force
        Set-ItemProperty -Path $godsEyeKey -Name "InstallDate" -Value (Get-Date).ToString() -Force
        Set-ItemProperty -Path $godsEyeKey -Name "Version" -Value "1.0.0" -Force
        
        Write-Log "Registry settings configured successfully" "INFO"
        return $true
    }
    catch {
        Write-Log "Error configuring registry settings: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to uninstall service
function Uninstall-Service {
    Write-Log "Uninstalling hardware security service..." "INFO"
    
    try {
        # Remove scheduled task
        $existingTask = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
        if ($existingTask) {
            Unregister-ScheduledTask -TaskName $ServiceName -Confirm:$false
            Write-Log "Scheduled task removed" "INFO"
        }
        
        # Remove registry settings
        $godsEyeKey = "HKLM:\SOFTWARE\GodsEye\HardwareSecurity"
        if (Test-Path $godsEyeKey) {
            Remove-Item -Path $godsEyeKey -Recurse -Force
            Write-Log "Registry settings removed" "INFO"
        }
        
        # Re-enable USB storage (optional)
        $usbStorageKey = "HKLM:\SYSTEM\CurrentControlSet\Services\USBSTOR"
        if (Test-Path $usbStorageKey) {
            Set-ItemProperty -Path $usbStorageKey -Name "Start" -Value 3 -Force
            Write-Log "USB storage devices re-enabled" "INFO"
        }
        
        Write-Log "Service uninstalled successfully" "INFO"
        return $true
    }
    catch {
        Write-Log "Error uninstalling service: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to test installation
function Test-Installation {
    Write-Log "Testing installation..." "INFO"
    
    try {
        # Check scheduled task
        $task = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
        if ($task) {
            Write-Log "Scheduled task found: $($task.State)" "INFO"
        } else {
            Write-Log "Scheduled task not found" "WARNING"
            return $false
        }
        
        # Check registry
        $godsEyeKey = "HKLM:\SOFTWARE\GodsEye\HardwareSecurity"
        if (Test-Path $godsEyeKey) {
            $installed = Get-ItemProperty -Path $godsEyeKey -Name "Installed" -ErrorAction SilentlyContinue
            if ($installed.Installed -eq 1) {
                Write-Log "Registry configuration verified" "INFO"
            }
        } else {
            Write-Log "Registry configuration not found" "WARNING"
            return $false
        }
        
        # Test hardware scanner
        $scannerScript = Join-Path $PSScriptRoot "device-scanner.ps1"
        if (Test-Path $scannerScript) {
            Write-Log "Hardware scanner script found" "INFO"
        } else {
            Write-Log "Hardware scanner script not found" "ERROR"
            return $false
        }
        
        Write-Log "Installation test completed successfully" "INFO"
        return $true
    }
    catch {
        Write-Log "Error testing installation: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Main execution
try {
    # Create log directory
    $logDir = Split-Path $logPath -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force
    }
    
    Write-Log "Gods Eye Hardware Security Service Installer Started" "INFO"
    
    # Check administrator privileges
    if (-not (Test-Administrator)) {
        Write-Log "This script must be run as Administrator" "ERROR"
        Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Red
        exit 1
    }
    
    if ($Uninstall) {
        # Uninstall service
        $result = Uninstall-Service
        if ($result) {
            Write-Log "Service uninstalled successfully" "INFO"
            Write-Host "Gods Eye Hardware Security Service has been uninstalled." -ForegroundColor Green
            exit 0
        } else {
            Write-Log "Service uninstallation failed" "ERROR"
            exit 1
        }
    } else {
        # Install service
        Write-Log "Installing Gods Eye Hardware Security Service..." "INFO"
        
        # Install scheduled task
        $taskResult = Install-ScheduledTask
        
        # Configure registry settings
        $registryResult = Set-HardwareRegistrySettings
        
        if ($taskResult -and $registryResult) {
            # Test installation
            $testResult = Test-Installation
            
            if ($testResult) {
                Write-Log "Installation completed successfully" "INFO"
                Write-Host "`nGods Eye Hardware Security Service has been installed successfully!" -ForegroundColor Green
                Write-Host "The service will start automatically at system boot." -ForegroundColor Yellow
                Write-Host "`nService Details:" -ForegroundColor Cyan
                Write-Host "  - Scheduled Task: $ServiceName" -ForegroundColor White
                Write-Host "  - Registry Key: HKLM\SOFTWARE\GodsEye\HardwareSecurity" -ForegroundColor White
                Write-Host "  - Log Files: C:\temp\gods-eye-*.log" -ForegroundColor White
                
                # Optionally start the task immediately
                Write-Host "`nWould you like to start the hardware monitoring now? (Y/N): " -ForegroundColor Yellow -NoNewline
                $response = Read-Host
                if ($response -eq "Y" -or $response -eq "y") {
                    Start-ScheduledTask -TaskName $ServiceName
                    Write-Host "Hardware monitoring started!" -ForegroundColor Green
                }
                
                exit 0
            } else {
                Write-Log "Installation test failed" "ERROR"
                exit 1
            }
        } else {
            Write-Log "Installation failed" "ERROR"
            exit 1
        }
    }
}
catch {
    Write-Log "Critical error during installation: $($_.Exception.Message)" "ERROR"
    Write-Host "Installation failed. Check the log file: $logPath" -ForegroundColor Red
    exit 2
}
