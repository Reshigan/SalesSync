package com.salessync.app.data.api

import com.salessync.app.data.model.*
import retrofit2.http.*

interface SalesSyncApi {

    // Auth
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<LoginResponse>

    // Dashboard
    @GET("analytics/dashboard")
    suspend fun getDashboardStats(): ApiResponse<DashboardStats>

    // Customers
    @GET("customers")
    suspend fun getCustomers(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
        @Query("search") search: String? = null,
        @Query("status") status: String? = null
    ): ApiResponse<CustomersResponse>

    @GET("customers/{id}")
    suspend fun getCustomer(@Path("id") id: String): ApiResponse<Customer>

    @POST("customers")
    suspend fun createCustomer(@Body customer: Customer): ApiResponse<Customer>

    @PUT("customers/{id}")
    suspend fun updateCustomer(@Path("id") id: String, @Body customer: Customer): ApiResponse<Customer>

    // Products
    @GET("products")
    suspend fun getProducts(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
        @Query("search") search: String? = null,
        @Query("category_id") categoryId: String? = null
    ): ApiResponse<List<Product>>

    @GET("products/{id}")
    suspend fun getProduct(@Path("id") id: String): ApiResponse<Product>

    // Orders
    @GET("orders")
    suspend fun getOrders(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
        @Query("status") status: String? = null,
        @Query("customer_id") customerId: String? = null
    ): ApiResponse<List<Order>>

    @GET("orders/{id}")
    suspend fun getOrder(@Path("id") id: String): ApiResponse<Order>

    @POST("orders")
    suspend fun createOrder(@Body request: CreateOrderRequest): ApiResponse<Order>

    // Van Sales
    @GET("van-sales")
    suspend fun getVanSales(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
        @Query("status") status: String? = null
    ): ApiResponse<List<VanSale>>

    @POST("van-sales")
    suspend fun createVanSale(@Body vanSale: VanSale): ApiResponse<VanSale>

    // Visits
    @GET("visits")
    suspend fun getVisits(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50,
        @Query("date") date: String? = null,
        @Query("customer_id") customerId: String? = null
    ): ApiResponse<List<Visit>>

    @POST("visits")
    suspend fun createVisit(@Body request: CreateVisitRequest): ApiResponse<Visit>

    @PUT("visits/{id}")
    suspend fun updateVisit(@Path("id") id: String, @Body visit: Visit): ApiResponse<Visit>

    // Trade Marketing
    @GET("trade-marketing/campaigns")
    suspend fun getCampaigns(
        @Query("status") status: String? = null
    ): ApiResponse<List<Campaign>>

    @POST("trade-marketing/campaigns")
    suspend fun createCampaign(@Body campaign: Campaign): ApiResponse<Campaign>

    @GET("trade-marketing/metrics")
    suspend fun getTradeMarketingMetrics(): ApiResponse<TradeMarketingMetrics>

    // Competitor Analysis
    @GET("competitors")
    suspend fun getCompetitors(): ApiResponse<List<Competitor>>

    @POST("competitors")
    suspend fun addCompetitor(@Body competitor: Competitor): ApiResponse<Competitor>

    @GET("competitors/analysis")
    suspend fun getCompetitorAnalysis(): ApiResponse<CompetitorAnalysis>

    // Field Marketing
    @GET("field-marketing/activities")
    suspend fun getFieldMarketingActivities(
        @Query("status") status: String? = null,
        @Query("type") type: String? = null
    ): ApiResponse<List<FieldMarketingActivity>>

    @POST("field-marketing/activities")
    suspend fun createFieldMarketingActivity(@Body request: CreateFieldActivityRequest): ApiResponse<FieldMarketingActivity>

    @GET("field-marketing/metrics")
    suspend fun getFieldMarketingMetrics(): ApiResponse<FieldMarketingMetrics>

    // Analytics
    @GET("analytics/sales")
    suspend fun getSalesAnalytics(
        @Query("period") period: String = "7d"
    ): ApiResponse<SalesAnalytics>
}
