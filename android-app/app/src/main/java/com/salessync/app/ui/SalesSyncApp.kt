package com.salessync.app.ui

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.salessync.app.ui.analytics.AnalyticsScreen
import com.salessync.app.ui.auth.LoginScreen
import com.salessync.app.ui.auth.LoginViewModel
import com.salessync.app.ui.competitors.CompetitorAnalysisScreen
import com.salessync.app.ui.customers.CustomerDetailScreen
import com.salessync.app.ui.customers.CustomersScreen
import com.salessync.app.ui.dashboard.DashboardScreen
import com.salessync.app.ui.fieldmarketing.FieldMarketingScreen
import com.salessync.app.ui.orders.CreateOrderScreenEnhanced
import com.salessync.app.ui.orders.OrdersScreen
import com.salessync.app.ui.products.ProductsScreen
import com.salessync.app.ui.settings.SettingsScreen
import com.salessync.app.ui.trademarketing.TradeMarketingScreen
import com.salessync.app.ui.vansales.CreateVanSaleScreen
import com.salessync.app.ui.vansales.VanSalesScreen
import com.salessync.app.ui.visits.CreateVisitScreen
import com.salessync.app.ui.visits.VisitsScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Dashboard : Screen("dashboard")
    object Customers : Screen("customers")
    object CustomerDetail : Screen("customers/{customerId}") {
        fun createRoute(customerId: String) = "customers/$customerId"
    }
    object Products : Screen("products")
    object Orders : Screen("orders")
    object CreateOrder : Screen("orders/create")
    object VanSales : Screen("van-sales")
    object CreateVanSale : Screen("van-sales/create")
    object Visits : Screen("visits")
    object CreateVisit : Screen("visits/create")
    object Settings : Screen("settings")
    object TradeMarketing : Screen("trade-marketing")
    object CompetitorAnalysis : Screen("competitor-analysis")
    object FieldMarketing : Screen("field-marketing")
    object Analytics : Screen("analytics")
}

@Composable
fun SalesSyncApp() {
    val navController = rememberNavController()
    val loginViewModel: LoginViewModel = hiltViewModel()
    val isLoggedIn by loginViewModel.isLoggedIn.collectAsState(initial = false)

    val startDestination = if (isLoggedIn) Screen.Dashboard.route else Screen.Login.route

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Dashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onNavigateToCustomers = { navController.navigate(Screen.Customers.route) },
                onNavigateToProducts = { navController.navigate(Screen.Products.route) },
                onNavigateToOrders = { navController.navigate(Screen.Orders.route) },
                onNavigateToVanSales = { navController.navigate(Screen.VanSales.route) },
                onNavigateToVisits = { navController.navigate(Screen.Visits.route) },
                onNavigateToSettings = { navController.navigate(Screen.Settings.route) },
                onNavigateToTradeMarketing = { navController.navigate(Screen.TradeMarketing.route) },
                onNavigateToCompetitorAnalysis = { navController.navigate(Screen.CompetitorAnalysis.route) },
                onNavigateToFieldMarketing = { navController.navigate(Screen.FieldMarketing.route) },
                onNavigateToAnalytics = { navController.navigate(Screen.Analytics.route) },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Customers.route) {
            CustomersScreen(
                onNavigateBack = { navController.popBackStack() },
                onCustomerClick = { customerId ->
                    navController.navigate(Screen.CustomerDetail.createRoute(customerId))
                }
            )
        }

        composable(
            route = Screen.CustomerDetail.route,
            arguments = listOf(navArgument("customerId") { type = NavType.StringType })
        ) { backStackEntry ->
            val customerId = backStackEntry.arguments?.getString("customerId") ?: return@composable
            CustomerDetailScreen(
                customerId = customerId,
                onNavigateBack = { navController.popBackStack() },
                onCreateOrder = { navController.navigate(Screen.CreateOrder.route) }
            )
        }

        composable(Screen.Products.route) {
            ProductsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Orders.route) {
            OrdersScreen(
                onNavigateBack = { navController.popBackStack() },
                onCreateOrder = { navController.navigate(Screen.CreateOrder.route) }
            )
        }

        composable(Screen.CreateOrder.route) {
            CreateOrderScreenEnhanced(
                onNavigateBack = { navController.popBackStack() },
                onOrderCreated = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.VanSales.route) {
            VanSalesScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.CreateVanSale.route) {
            CreateVanSaleScreen(
                onNavigateBack = { navController.popBackStack() },
                onSaleCreated = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Visits.route) {
            VisitsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.CreateVisit.route) {
            CreateVisitScreen(
                onNavigateBack = { navController.popBackStack() },
                onVisitCreated = {
                    navController.popBackStack()
                }
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                onNavigateBack = { navController.popBackStack() },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.TradeMarketing.route) {
            TradeMarketingScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.CompetitorAnalysis.route) {
            CompetitorAnalysisScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.FieldMarketing.route) {
            FieldMarketingScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.Analytics.route) {
            AnalyticsScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
