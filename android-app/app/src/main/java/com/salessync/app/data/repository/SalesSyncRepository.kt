package com.salessync.app.data.repository

import com.salessync.app.data.api.SalesSyncApi
import com.salessync.app.data.model.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SalesSyncRepository @Inject constructor(
    private val api: SalesSyncApi,
    private val authRepository: AuthRepository
) {
    // Auth
    suspend fun login(email: String, password: String, tenantCode: String): Result<User> {
        return try {
            val response = api.login(LoginRequest(email, password))
            if (response.success && response.data != null) {
                authRepository.saveAuthData(
                    token = response.data.token,
                    tenantCode = tenantCode,
                    user = response.data.user
                )
                Result.success(response.data.user)
            } else {
                Result.failure(Exception(response.message ?: "Login failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        authRepository.clearAuthData()
    }

    // Dashboard
    suspend fun getDashboardStats(): Result<DashboardStats> {
        return try {
            val response = api.getDashboardStats()
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to load dashboard"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Customers
    suspend fun getCustomers(
        page: Int = 1,
        limit: Int = 50,
        search: String? = null,
        status: String? = null
    ): Result<CustomersResponse> {
        return try {
            val response = api.getCustomers(page, limit, search, status)
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to load customers"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getCustomer(id: String): Result<Customer> {
        return try {
            val response = api.getCustomer(id)
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to load customer"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Products
    suspend fun getProducts(
        page: Int = 1,
        limit: Int = 50,
        search: String? = null,
        categoryId: String? = null
    ): Result<List<Product>> {
        return try {
            val response = api.getProducts(page, limit, search, categoryId)
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to load products"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Orders
    suspend fun getOrders(
        page: Int = 1,
        limit: Int = 50,
        status: String? = null,
        customerId: String? = null
    ): Result<List<Order>> {
        return try {
            val response = api.getOrders(page, limit, status, customerId)
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to load orders"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createOrder(request: CreateOrderRequest): Result<Order> {
        return try {
            val response = api.createOrder(request)
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to create order"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Van Sales
    suspend fun getVanSales(
        page: Int = 1,
        limit: Int = 50,
        status: String? = null
    ): Result<List<VanSale>> {
        return try {
            val response = api.getVanSales(page, limit, status)
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to load van sales"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Visits
    suspend fun getVisits(
        page: Int = 1,
        limit: Int = 50,
        date: String? = null,
        customerId: String? = null
    ): Result<List<Visit>> {
        return try {
            val response = api.getVisits(page, limit, date, customerId)
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to load visits"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createVisit(request: CreateVisitRequest): Result<Visit> {
        return try {
            val response = api.createVisit(request)
            if (response.success && response.data != null) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message ?: "Failed to create visit"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
