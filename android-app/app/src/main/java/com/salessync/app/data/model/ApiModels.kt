package com.salessync.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val message: String? = null
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class LoginResponse(
    val token: String,
    val user: User
)

@Serializable
data class User(
    val id: String,
    @SerialName("tenant_id") val tenantId: String,
    val email: String,
    @SerialName("first_name") val firstName: String,
    @SerialName("last_name") val lastName: String,
    val role: String
)

@Serializable
data class Customer(
    val id: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    val name: String,
    val code: String,
    val type: String,
    val phone: String? = null,
    val email: String? = null,
    val address: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @SerialName("route_id") val routeId: String? = null,
    @SerialName("credit_limit") val creditLimit: Double = 0.0,
    @SerialName("payment_terms") val paymentTerms: Int = 30,
    val status: String = "active",
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class CustomersResponse(
    val customers: List<Customer>,
    val pagination: Pagination
)

@Serializable
data class Pagination(
    val total: Int,
    val page: Int,
    val limit: Int,
    val totalPages: Int
)

@Serializable
data class Product(
    val id: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    val name: String,
    val code: String,
    val description: String? = null,
    @SerialName("category_id") val categoryId: String? = null,
    @SerialName("brand_id") val brandId: String? = null,
    val unit: String = "unit",
    val price: Double = 0.0,
    val cost: Double = 0.0,
    @SerialName("tax_rate") val taxRate: Double = 0.0,
    @SerialName("stock_quantity") val stockQuantity: Int = 0,
    @SerialName("min_stock") val minStock: Int = 0,
    val status: String = "active",
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Order(
    val id: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    @SerialName("order_number") val orderNumber: String,
    @SerialName("customer_id") val customerId: String,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("order_date") val orderDate: String,
    @SerialName("delivery_date") val deliveryDate: String? = null,
    @SerialName("order_status") val orderStatus: String = "pending",
    @SerialName("payment_status") val paymentStatus: String = "unpaid",
    @SerialName("subtotal") val subtotal: Double = 0.0,
    @SerialName("tax_amount") val taxAmount: Double = 0.0,
    @SerialName("discount_amount") val discountAmount: Double = 0.0,
    @SerialName("total_amount") val totalAmount: Double = 0.0,
    val notes: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class OrderItem(
    val id: String? = null,
    @SerialName("order_id") val orderId: String? = null,
    @SerialName("product_id") val productId: String,
    @SerialName("product_name") val productName: String? = null,
    val quantity: Int,
    @SerialName("unit_price") val unitPrice: Double,
    @SerialName("discount_percent") val discountPercent: Double = 0.0,
    @SerialName("tax_rate") val taxRate: Double = 0.0,
    @SerialName("line_total") val lineTotal: Double = 0.0
)

@Serializable
data class CreateOrderRequest(
    @SerialName("customer_id") val customerId: String,
    @SerialName("delivery_date") val deliveryDate: String? = null,
    val notes: String? = null,
    val items: List<OrderItem>
)

@Serializable
data class VanSale(
    val id: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    @SerialName("van_id") val vanId: String? = null,
    @SerialName("agent_id") val agentId: String? = null,
    @SerialName("customer_id") val customerId: String,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("sale_date") val saleDate: String,
    @SerialName("total_amount") val totalAmount: Double = 0.0,
    val status: String = "completed",
    @SerialName("payment_method") val paymentMethod: String = "cash",
    val notes: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Visit(
    val id: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    @SerialName("agent_id") val agentId: String? = null,
    @SerialName("customer_id") val customerId: String,
    @SerialName("customer_name") val customerName: String? = null,
    @SerialName("visit_date") val visitDate: String,
    @SerialName("check_in_time") val checkInTime: String? = null,
    @SerialName("check_out_time") val checkOutTime: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @SerialName("visit_type") val visitType: String? = null,
    val purpose: String? = null,
    val notes: String? = null,
    val status: String = "in_progress",
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class CreateVisitRequest(
    @SerialName("customer_id") val customerId: String,
    @SerialName("visit_date") val visitDate: String? = null,
    @SerialName("check_in_time") val checkInTime: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @SerialName("visit_type") val visitType: String? = null,
    val purpose: String? = null,
    val notes: String? = null
)

@Serializable
data class DashboardStats(
    val totalCustomers: Int = 0,
    val totalProducts: Int = 0,
    val totalOrders: Int = 0,
    val totalRevenue: Double = 0.0,
    val totalVanSales: Int = 0,
    val vanSalesRevenue: Double = 0.0,
    val totalVisits: Int = 0,
    val pendingOrders: Int = 0,
    val revenueGrowth: Double = 0.0,
    val orderGrowth: Double = 0.0,
    val customerGrowth: Double = 0.0
)

// Trade Marketing Models
@Serializable
data class Campaign(
    val id: String,
    val name: String,
    val description: String? = null,
    @SerialName("campaign_type") val campaignType: String = "promotion",
    @SerialName("start_date") val startDate: String? = null,
    @SerialName("end_date") val endDate: String? = null,
    val budget: Double = 0.0,
    @SerialName("target_audience") val targetAudience: String? = null,
    val status: String = "draft",
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class TradeMarketingMetrics(
    val activeCampaigns: Int = 0,
    val completedCampaigns: Int = 0,
    val totalBudget: Double = 0.0,
    val totalRevenue: Double = 0.0,
    val roi: Double = 0.0,
    val conversionRate: Double = 0.0,
    val reachCount: Int = 0
)

// Competitor Analysis Models
@Serializable
data class Competitor(
    val id: String,
    val name: String,
    @SerialName("market_share") val marketShare: Double = 0.0,
    val strength: String? = null,
    val weakness: String? = null,
    val products: Int = 0,
    val notes: String? = null
)

@Serializable
data class CompetitorAnalysis(
    val ourMarketShare: Double = 0.0,
    val totalMarketSize: Double = 0.0,
    val ourRevenue: Double = 0.0,
    val ourProducts: Int = 0,
    val ourCustomers: Int = 0,
    val competitorCount: Int = 0,
    val marketTrend: String = "stable",
    val growthRate: Double = 0.0
)

// Field Marketing Models
@Serializable
data class FieldMarketingActivity(
    val id: String,
    @SerialName("activity_type") val activityType: String,
    @SerialName("customer_id") val customerId: String? = null,
    @SerialName("customer_name") val customerName: String? = null,
    val location: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val status: String = "pending",
    @SerialName("photo_url") val photoUrl: String? = null,
    val notes: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class FieldMarketingMetrics(
    val totalActivities: Int = 0,
    val completedActivities: Int = 0,
    val todayActivities: Int = 0,
    val boardPlacements: Int = 0,
    val displaySetups: Int = 0,
    val samplingEvents: Int = 0,
    val coverageRate: Double = 0.0,
    val completionRate: Int = 0
)

@Serializable
data class CreateFieldActivityRequest(
    @SerialName("activity_type") val activityType: String,
    @SerialName("customer_id") val customerId: String? = null,
    val location: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    @SerialName("photo_url") val photoUrl: String? = null,
    val notes: String? = null
)

// Analytics Models
@Serializable
data class SalesAnalytics(
    val salesByDate: List<SalesDataPoint> = emptyList(),
    val vanSalesByDate: List<SalesDataPoint> = emptyList(),
    val topProducts: List<TopProduct> = emptyList(),
    val topCustomers: List<TopCustomer> = emptyList(),
    val period: String = "7d"
)

@Serializable
data class SalesDataPoint(
    val date: String,
    val orders: Int = 0,
    val sales: Int = 0,
    val revenue: Double = 0.0
)

@Serializable
data class TopProduct(
    val name: String,
    val quantity: Int = 0,
    val revenue: Double = 0.0
)

@Serializable
data class TopCustomer(
    val name: String,
    val orders: Int = 0,
    val revenue: Double = 0.0
)

// RBAC Models
@Serializable
data class Role(
    val id: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    val name: String,
    val description: String? = null,
    @SerialName("is_system_role") val isSystemRole: Int = 0,
    @SerialName("is_active") val isActive: Int = 1,
    @SerialName("user_count") val userCount: Int = 0,
    @SerialName("permission_count") val permissionCount: Int = 0,
    @SerialName("created_at") val createdAt: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null
)

@Serializable
data class Permission(
    val id: String,
    val name: String,
    val description: String? = null,
    val module: String,
    val action: String
)

@Serializable
data class PermissionsResponse(
    val permissions: List<Permission> = emptyList(),
    val grouped: Map<String, List<Permission>> = emptyMap()
)

@Serializable
data class RoleDetail(
    val id: String,
    @SerialName("tenant_id") val tenantId: String? = null,
    val name: String,
    val description: String? = null,
    @SerialName("is_system_role") val isSystemRole: Int = 0,
    @SerialName("is_active") val isActive: Int = 1,
    val permissions: List<Permission> = emptyList(),
    val users: List<RoleUser> = emptyList()
)

@Serializable
data class RoleUser(
    val id: String,
    val email: String,
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    @SerialName("assigned_at") val assignedAt: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null
)

@Serializable
data class UserRole(
    val id: String,
    val name: String,
    val description: String? = null,
    @SerialName("is_system_role") val isSystemRole: Int = 0,
    @SerialName("assigned_at") val assignedAt: String? = null,
    @SerialName("expires_at") val expiresAt: String? = null,
    @SerialName("is_active") val isActive: Int = 1,
    @SerialName("assigned_by_name") val assignedByName: String? = null
)

@Serializable
data class CreateRoleRequest(
    val name: String,
    val description: String? = null,
    val permissions: List<String> = emptyList()
)

@Serializable
data class UpdateRoleRequest(
    val name: String,
    val description: String? = null,
    @SerialName("is_active") val isActive: Boolean = true,
    val permissions: List<String>? = null
)

@Serializable
data class AssignRoleRequest(
    @SerialName("role_id") val roleId: String,
    @SerialName("expires_at") val expiresAt: String? = null
)

@Serializable
data class UserPermissions(
    val userId: String,
    val role: String,
    val permissions: List<String> = emptyList(),
    val isAdmin: Boolean = false
)

@Serializable
data class InitializeRolesResult(
    val name: String,
    val status: String,
    val id: String
)
