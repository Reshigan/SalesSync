package com.salessync.app.data.api

import com.salessync.app.data.repository.AuthRepository
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val authRepository: AuthRepository
) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Skip auth for login endpoint
        if (originalRequest.url.encodedPath.contains("auth/login")) {
            return chain.proceed(originalRequest)
        }

        val token = runBlocking { authRepository.getToken().first() }
        val tenantCode = runBlocking { authRepository.getTenantCode().first() }

        val newRequest = originalRequest.newBuilder().apply {
            token?.let { addHeader("Authorization", "Bearer $it") }
            tenantCode?.let { addHeader("x-tenant-code", it) }
        }.build()

        return chain.proceed(newRequest)
    }
}
