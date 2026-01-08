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
