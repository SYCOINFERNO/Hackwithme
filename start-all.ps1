# start-all.ps1
Write-Host "Starting all services in separate windows..."

# Start APIs
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Ingestion API && node server.js" -WorkingDirectory "$PSScriptRoot\api" -WindowStyle Normal
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Dashboard API && node dashboard-server.js" -WorkingDirectory "$PSScriptRoot\api" -WindowStyle Normal

# Start Worker
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Worker && node consumer.js" -WorkingDirectory "$PSScriptRoot\worker" -WindowStyle Normal

# Start Frontends
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Ecommerce Demo && npx vite --port 5000" -WorkingDirectory "$PSScriptRoot\ecommerce-demo" -WindowStyle Normal
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Analytics Dashboard && npx vite --port 5001" -WorkingDirectory "$PSScriptRoot\analytics-dashboard" -WindowStyle Normal

Write-Host "All services have been launched! Ensure RabbitMQ and MongoDB are running as well."
