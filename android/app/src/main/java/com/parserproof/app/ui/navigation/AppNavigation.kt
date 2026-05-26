package com.parserproof.app.ui.navigation

import androidx.compose.runtime.*
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.parserproof.app.ui.screens.*

@Composable
fun AppNavigation() {
    val navController = rememberNavController()
    var sharedResumeText by remember { mutableStateOf("") }

    NavHost(
        navController = navController,
        startDestination = Screen.Splash.route
    ) {
        composable(Screen.Splash.route) {
            SplashScreen(
                onNavigateNext = { isLoggedIn ->
                    if (isLoggedIn) {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                    } else {
                        navController.navigate(Screen.Auth.route) {
                            popUpTo(Screen.Splash.route) { inclusive = true }
                        }
                    }
                }
            )
        }

        composable(Screen.Auth.route) {
            AuthScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Auth.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToUpload = {
                    navController.navigate(Screen.Upload.route)
                },
                onNavigateToProject = { id ->
                    navController.navigate(Screen.Results.createRoute(id))
                },
                onNavigateToChat = { id ->
                    navController.navigate(Screen.ChatAssistant.createRoute(id))
                },
                onNavigateToSettings = {
                    navController.navigate(Screen.Settings.route)
                },
                onNavigateToHistory = {
                    navController.navigate(Screen.History.route)
                }
            )
        }

        composable(Screen.Upload.route) {
            UploadScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToJobDesc = { text ->
                    sharedResumeText = text
                    navController.navigate(Screen.JobDesc.route)
                }
            )
        }

        composable(Screen.JobDesc.route) {
            JobDescScreen(
                resumeText = sharedResumeText,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToResults = { id ->
                    navController.navigate(Screen.Results.createRoute(id)) {
                        popUpTo(Screen.Upload.route) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.Results.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId") ?: ""
            ResultsScreen(
                projectId = projectId,
                onNavigateBack = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                },
                onNavigateToChat = { id ->
                    navController.navigate(Screen.ChatAssistant.createRoute(id))
                }
            )
        }

        composable(
            route = Screen.ChatAssistant.route,
            arguments = listOf(navArgument("projectId") { type = NavType.StringType })
        ) { backStackEntry ->
            val projectId = backStackEntry.arguments?.getString("projectId")
            ChatAssistantScreen(
                projectId = projectId,
                onNavigateBack = {
                    navController.popBackStack()
                },
                onNavigateToAuth = {
                    navController.navigate(Screen.Auth.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.History.route) {
            HistoryScreen(
                onNavigateToDashboard = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                },
                onNavigateToProject = { id ->
                    navController.navigate(Screen.Results.createRoute(id))
                }
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = {
                    navController.popBackStack()
                },
                onLogoutSuccess = {
                    navController.navigate(Screen.Auth.route) {
                        popUpTo(Screen.Dashboard.route) { inclusive = true }
                    }
                }
            )
        }
    }
}
