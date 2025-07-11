# Startup Monitor - Pre-launch Hardware Security Check for Gods Eye
# This script runs at system startup to validate hardware before allowing app launch

param(
    [string]$AppPath = "",
    [string]$LogPath = "C:\temp\gods-eye-startup.log",
    [switch]$BlockMode = $true,
    [switch]$AllowOverride = $false,
    [int]$RetryCount = 3,
    [int]$RetryDelay = 5
)

# Initialize logging
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] STARTUP: $Message"
    Write-Host $logEntry
    Add-Content -Path $LogPath -Value $logEntry -Force
}

# Function to create startup flag file
function Set-StartupFlag {
    param([string]$Status)
    
    $flagPath = "C:\temp\gods-eye-startup.flag"
    $flagData = @{
        Status = $Status
        Timestamp = Get-Date
        ProcessId = $PID
        ComputerName = $env:COMPUTERNAME
        UserName = $env:USERNAME
    }
    
    try {
        $flagData | ConvertTo-Json | Out-File -FilePath $flagPath -Encoding UTF8
        Write-Log "Startup flag created: $Status" "INFO"
    }
    catch {
        Write-Log "Error creating startup flag: $($_.Exception.Message)" "ERROR"
    }
}

# Function to check if Gods Eye is already running
function Test-GodsEyeRunning {
    try {
        $processes = Get-Process -Name "Gods Eye" -ErrorAction SilentlyContinue
        if ($processes) {
            Write-Log "Gods Eye is already running (PID: $($processes.Id -join ', '))" "INFO"
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Function to run hardware security check
function Invoke-HardwareSecurityCheck {
    Write-Log "Starting hardware security validation..." "INFO"
    
    $scannerScript = Join-Path $PSScriptRoot "device-scanner.ps1"
    
    if (-not (Test-Path $scannerScript)) {
        Write-Log "Hardware scanner script not found: $scannerScript" "ERROR"
        return $false
    }
    
    try {
        # Execute the hardware scanner with strict mode
        $result = & $scannerScript -StrictMode:$true -AllowOverride:$AllowOverride
        $exitCode = $LASTEXITCODE
        
        Write-Log "Hardware scanner exit code: $exitCode" "INFO"
        
        switch ($exitCode) {
            0 { 
                Write-Log "Hardware security check PASSED" "INFO"
                return $true
            }
            1 { 
                Write-Log "Hardware security check FAILED - Unauthorized devices detected" "ERROR"
                return $false
            }
            2 { 
                Write-Log "Hardware security check ERROR - Scanner malfunction" "ERROR"
                return $false
            }
            default { 
                Write-Log "Hardware security check UNKNOWN - Unexpected exit code: $exitCode" "ERROR"
                return $false
            }
        }
    }
    catch {
        Write-Log "Error executing hardware scanner: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to create scheduled task for hardware monitoring
function Install-HardwareMonitorTask {
    Write-Log "Installing hardware monitor scheduled task..." "INFO"
    
    try {
        $taskName = "GodsEye-HardwareMonitor"
        $scriptPath = $PSCommandPath
        
        # Check if task already exists
        $existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
        if ($existingTask) {
            Write-Log "Removing existing scheduled task..." "INFO"
            Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        }
        
        # Create new task
        $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
        
        $task = New-ScheduledTask -Action $action -Trigger $trigger -Principal $principal -Settings $settings
        Register-ScheduledTask -TaskName $taskName -InputObject $task
        
        Write-Log "Hardware monitor scheduled task installed successfully" "INFO"
        return $true
    }
    catch {
        Write-Log "Error installing scheduled task: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to block unauthorized devices
function Block-UnauthorizedDevices {
    Write-Log "Attempting to block unauthorized devices..." "WARNING"
    
    try {
        # Get the security report
        $reportPath = "C:\temp\security-report.json"
        if (-not (Test-Path $reportPath)) {
            Write-Log "Security report not found: $reportPath" "ERROR"
            return $false
        }
        
        $report = Get-Content $reportPath | ConvertFrom-Json
        
        # Disable USB storage devices
        if ($report.USBStorageDevices.Count -gt 0) {
            Write-Log "Disabling USB storage devices..." "WARNING"
            foreach ($usbDevice in $report.USBStorageDevices) {
                Write-Log "Blocking USB device: $($usbDevice.DriveLetter)" "WARNING"
                # Note: This requires admin privileges and registry modifications
            }
        }
        
        # Log forbidden devices
        if ($report.ForbiddenDevices.Count -gt 0) {
            Write-Log "Found $($report.ForbiddenDevices.Count) forbidden devices:" "ERROR"
            foreach ($device in $report.ForbiddenDevices) {
                Write-Log "  - $($device.Name) [$($device.Class)]" "ERROR"
            }
        }
        
        return $true
    }
    catch {
        Write-Log "Error blocking devices: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Function to send security alert
function Send-SecurityAlert {
    param([string]$AlertType, [string]$Details)
    
    Write-Log "Sending security alert: $AlertType" "WARNING"
    
    try {
        $alertData = @{
            Type = $AlertType
            Details = $Details
            Timestamp = Get-Date
            ComputerName = $env:COMPUTERNAME
            UserName = $env:USERNAME
        }
        
        $alertPath = "C:\temp\gods-eye-security-alert.json"
        $alertData | ConvertTo-Json | Out-File -FilePath $alertPath -Encoding UTF8
        
        Write-Log "Security alert saved to: $alertPath" "INFO"
        
        # Here you could add email/webhook notifications
        # This would integrate with your backend notification system
        
    }
    catch {
        Write-Log "Error sending security alert: $($_.Exception.Message)" "ERROR"
    }
}

# Function to perform system shutdown (if configured)
function Invoke-SecurityShutdown {
    param([string]$Reason)
    
    Write-Log "SECURITY SHUTDOWN INITIATED: $Reason" "CRITICAL"
    
    try {
        # Log the shutdown reason
        $shutdownData = @{
            Reason = $Reason
            Timestamp = Get-Date
            ComputerName = $env:COMPUTERNAME
            UserName = $env:USERNAME
        }
        
        $shutdownPath = "C:\temp\gods-eye-shutdown.json"
        $shutdownData | ConvertTo-Json | Out-File -FilePath $shutdownPath -Encoding UTF8
        
        # Send alert before shutdown
        Send-SecurityAlert -AlertType "SECURITY_SHUTDOWN" -Details $Reason
        
        # Perform shutdown (uncomment to enable)
        # shutdown /s /t 30 /c "Gods Eye Security: Unauthorized hardware detected"
        
        Write-Log "System shutdown would be initiated in 30 seconds (disabled for safety)" "WARNING"
        
    }
    catch {
        Write-Log "Error during security shutdown: $($_.Exception.Message)" "ERROR"
    }
}

# Main execution function
function Start-HardwareMonitoring {
    Write-Log "Gods Eye Startup Hardware Monitor Started" "INFO"
    Write-Log "Block Mode: $BlockMode" "INFO"
    Write-Log "Allow Override: $AllowOverride" "INFO"
    
    Set-StartupFlag -Status "CHECKING"
    
    # Check if Gods Eye is already running
    if (Test-GodsEyeRunning) {
        Write-Log "Gods Eye is already running - monitoring will continue in background" "INFO"
        Set-StartupFlag -Status "MONITORING"
        return $true
    }
    
    # Perform hardware security check with retries
    $securityPassed = $false
    $attempt = 0
    
    while ($attempt -lt $RetryCount -and -not $securityPassed) {
        $attempt++
        Write-Log "Hardware security check attempt $attempt of $RetryCount" "INFO"
        
        $securityPassed = Invoke-HardwareSecurityCheck
        
        if (-not $securityPassed -and $attempt -lt $RetryCount) {
            Write-Log "Waiting $RetryDelay seconds before retry..." "INFO"
            Start-Sleep -Seconds $RetryDelay
        }
    }
    
    if ($securityPassed) {
        Write-Log "Hardware security validation PASSED - System is secure" "INFO"
        Set-StartupFlag -Status "SECURE"
        
        # Launch Gods Eye if app path is provided
        if ($AppPath -and (Test-Path $AppPath)) {
            Write-Log "Launching Gods Eye application..." "INFO"
            try {
                Start-Process -FilePath $AppPath -WindowStyle Normal
                Write-Log "Gods Eye launched successfully" "INFO"
            }
            catch {
                Write-Log "Error launching Gods Eye: $($_.Exception.Message)" "ERROR"
            }
        }
        
        return $true
    }
    else {
        Write-Log "Hardware security validation FAILED - Unauthorized devices detected" "ERROR"
        Set-StartupFlag -Status "VIOLATION"
        
        # Send security alert
        Send-SecurityAlert -AlertType "HARDWARE_VIOLATION" -Details "Unauthorized hardware devices detected at startup"
        
        if ($BlockMode) {
            Write-Log "Block mode enabled - preventing application launch" "ERROR"
            
            # Block unauthorized devices
            Block-UnauthorizedDevices
            
            # Optional: Shutdown system (uncomment to enable)
            # Invoke-SecurityShutdown -Reason "Unauthorized hardware detected"
            
            return $false
        }
        else {
            Write-Log "Block mode disabled - allowing application launch with warning" "WARNING"
            return $true
        }
    }
}

# Main script execution
try {
    # Create log directory if it doesn't exist
    $logDir = Split-Path $LogPath -Parent
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force
    }
    
    # Install scheduled task if running with admin privileges
    if (([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
        Install-HardwareMonitorTask
    }
    
    # Start hardware monitoring
    $result = Start-HardwareMonitoring
    
    if ($result) {
        Write-Log "Startup hardware monitoring completed successfully" "INFO"
        exit 0
    }
    else {
        Write-Log "Startup hardware monitoring failed - security violation detected" "ERROR"
        exit 1
    }
}
catch {
    Write-Log "Critical error in startup monitor: $($_.Exception.Message)" "ERROR"
    Set-StartupFlag -Status "ERROR"
    exit 2
}
finally {
    Write-Log "Startup monitor execution completed" "INFO"
}
