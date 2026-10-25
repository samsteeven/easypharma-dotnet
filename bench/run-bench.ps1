# Mesure une API (dotnet | java) sur les trois scénarios k6 : échauffement (non retenu) puis 3 passes.
# Usage : .\bench\run-bench.ps1 -App dotnet -Round 1 -DotnetDir <publish> -JavaJar <jar> -Password <sa> [-Mssql 1435]
param(
    [Parameter(Mandatory)][ValidateSet('dotnet', 'java')][string]$App,
    [int]$Round = 1,
    [Parameter(Mandatory)][string]$DotnetDir,
    [Parameter(Mandatory)][string]$JavaJar,
    [Parameter(Mandatory)][string]$Password,
    [int]$Mssql = 1435,
    [string]$JavaHome = $env:JAVA_HOME,
    [string[]]$Scenarios = @('nearby', 'search_nearest', 'catalogue_search'),
    [int]$Runs = 3
)
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$results = Join-Path $here 'results'
New-Item -ItemType Directory -Force $results | Out-Null
$jwt = 'YmVuY2gtb25seS1zZWNyZXQta2V5LWZvci1lYXN5cGhhcm1hLWJlbmNobWFyay0wMDAwMDAw'  # secret de test, sans valeur

if ($App -eq 'dotnet') {
    $port = 5080
    $env_ = @{
        ConnectionStrings__Default = "Server=localhost,$Mssql;Database=easypharma_db;User Id=sa;Password=$Password;TrustServerCertificate=True;Encrypt=True;Max Pool Size=10"
        Jwt__Secret = $jwt; ASPNETCORE_URLS = "http://localhost:$port"; ASPNETCORE_ENVIRONMENT = 'Production'
        Logging__LogLevel__Default = 'Warning'
    }
    $proc = @{ FilePath = 'dotnet'; ArgumentList = @("$DotnetDir\EasyPharma.Api.dll") }
} else {
    $port = 8080
    $env_ = @{
        SPRING_PROFILES_ACTIVE = 'dev,sqlserver'; MSSQL_SA_PASSWORD = $Password; JWT_SECRET = $jwt
        SPRING_DATASOURCE_URL = "jdbc:sqlserver://localhost:$Mssql;databaseName=easypharma_db;encrypt=true;trustServerCertificate=true"
        SPRING_FLYWAY_ENABLED = 'false'; SPRING_JPA_HIBERNATE_DDL_AUTO = 'none'; SPRING_JPA_SHOW_SQL = 'false'
        LOGGING_LEVEL_ROOT = 'WARN'; LOGGING_LEVEL_COM_APP = 'WARN'; SERVER_PORT = "$port"
    }
    $proc = @{ FilePath = "$JavaHome\bin\java.exe"; ArgumentList = @('-jar', $JavaJar) }
}
# Prêt = la première route publique répond (l'actuator Java renvoie 503 sans Redis, ce n'est pas un signal fiable).
$health = "http://localhost:$port/api/v1/pharmacies/nearby?latitude=4&longitude=10&radiusKm=1"
foreach ($kv in $env_.GetEnumerator()) { Set-Item "env:$($kv.Key)" $kv.Value }

$log = Join-Path $env:TEMP "bench-$App.log"
$p = Start-Process @proc -RedirectStandardOutput $log -RedirectStandardError "$log.err" -PassThru -WindowStyle Hidden
try {
    for ($i = 0; $i -lt 60; $i++) {
        Start-Sleep 2
        try { if ((Invoke-WebRequest $health -UseBasicParsing -TimeoutSec 2).StatusCode -eq 200) { break } } catch { }
    }
    "[$App] démarré (pid $($p.Id)), mémoire $([int]($p.WorkingSet64/1MB)) Mo"
    $base = "http://localhost:$port"
    foreach ($s in $Scenarios) {
        k6 run --quiet -e BASE=$base -e SCENARIO=$s -e DURATION=20s "$here\k6-bench.js" 2>&1 | Out-Null   # échauffement
        for ($r = 1; $r -le $Runs; $r++) {
            $out = Join-Path $results "$App-$s-round$Round-run$r.json"
            k6 run --quiet --summary-export $out -e BASE=$base -e SCENARIO=$s -e DURATION=20s "$here\k6-bench.js" 2>&1 | Out-Null
            $j = Get-Content $out -Raw | ConvertFrom-Json
            $d = $j.metrics.http_req_duration
            "[$App] $s run$r : p50 {0:N1} ms  p95 {1:N1} ms  p99 {2:N1} ms  {3:N0} req/s  échecs {4:P2}" -f $d.med, $d.'p(95)', $d.'p(99)', $j.metrics.http_reqs.rate, $j.metrics.checks.fails
        }
    }
} finally {
    Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
    Get-Process -Name EasyPharma.Api -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep 2
}
