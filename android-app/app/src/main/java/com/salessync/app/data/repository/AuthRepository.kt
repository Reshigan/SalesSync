package com.salessync.app.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.salessync.app.data.api.SalesSyncApi
import com.salessync.app.data.model.LoginRequest
import com.salessync.app.data.model.User
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

@Singleton
class AuthRepository @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val dataStore = context.dataStore

    companion object {
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
        private val TENANT_CODE_KEY = stringPreferencesKey("tenant_code")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val USER_ROLE_KEY = stringPreferencesKey("user_role")
    }

    fun getToken(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[TOKEN_KEY]
    }

    fun getTenantCode(): Flow<String?> = dataStore.data.map { preferences ->
        preferences[TENANT_CODE_KEY]
    }

    fun isLoggedIn(): Flow<Boolean> = dataStore.data.map { preferences ->
        preferences[TOKEN_KEY] != null
    }

    fun getCurrentUser(): Flow<User?> = dataStore.data.map { preferences ->
        val id = preferences[USER_ID_KEY] ?: return@map null
        val email = preferences[USER_EMAIL_KEY] ?: return@map null
        val name = preferences[USER_NAME_KEY] ?: ""
        val role = preferences[USER_ROLE_KEY] ?: ""
        val tenantId = preferences[TENANT_CODE_KEY] ?: ""
        
        User(
            id = id,
            tenantId = tenantId,
            email = email,
            firstName = name.split(" ").firstOrNull() ?: "",
            lastName = name.split(" ").drop(1).joinToString(" "),
            role = role
        )
    }

    suspend fun saveAuthData(token: String, tenantCode: String, user: User) {
        dataStore.edit { preferences ->
            preferences[TOKEN_KEY] = token
            preferences[TENANT_CODE_KEY] = tenantCode
            preferences[USER_ID_KEY] = user.id
            preferences[USER_EMAIL_KEY] = user.email
            preferences[USER_NAME_KEY] = "${user.firstName} ${user.lastName}"
            preferences[USER_ROLE_KEY] = user.role
        }
    }

    suspend fun clearAuthData() {
        dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
