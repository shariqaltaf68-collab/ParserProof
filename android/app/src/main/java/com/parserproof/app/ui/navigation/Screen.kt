package com.parserproof.app.ui.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash")
    object Auth : Screen("auth")
    object Dashboard : Screen("dashboard")
    object Upload : Screen("upload")
    object JobDesc : Screen("job_desc")
    object Results : Screen("results/{projectId}") {
        fun createRoute(projectId: String) = "results/$projectId"
    }
    object ChatAssistant : Screen("chat/{projectId}") {
        fun createRoute(projectId: String) = "chat/$projectId"
    }
    object History : Screen("history")
    object Settings : Screen("settings")
}
