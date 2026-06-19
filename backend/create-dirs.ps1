$modules = @("auth", "users", "creators", "subscriptions", "payments", "payouts", "posts", "media", "videos", "feed", "comments", "likes", "follows", "notifications", "search", "admin", "moderation", "analytics", "audit-logs")
$subfolders = @("controllers", "services", "repositories", "routes", "validators", "dto", "middleware", "events", "utils")
$topLevel = @("common", "database", "cache", "queues", "storage", "jobs")

foreach ($folder in $topLevel) {
    New-Item -ItemType Directory -Force -Path "src/$folder" | Out-Null
}

foreach ($module in $modules) {
    New-Item -ItemType Directory -Force -Path "src/modules/$module" | Out-Null
    New-Item -ItemType File -Force -Path "src/modules/$module/index.js" | Out-Null
    foreach ($sub in $subfolders) {
        New-Item -ItemType Directory -Force -Path "src/modules/$module/$sub" | Out-Null
    }
}
Write-Output "Successfully created all module folders!"
