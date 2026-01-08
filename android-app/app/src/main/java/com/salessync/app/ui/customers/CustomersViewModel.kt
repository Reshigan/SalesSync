package com.salessync.app.ui.customers

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.salessync.app.data.model.Customer
import com.salessync.app.data.repository.SalesSyncRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class CustomersUiState(
    val customers: List<Customer> = emptyList(),
    val totalCount: Int = 0,
    val isLoading: Boolean = true,
    val error: String? = null,
    val searchQuery: String = ""
)

@HiltViewModel
class CustomersViewModel @Inject constructor(
    private val repository: SalesSyncRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CustomersUiState())
    val uiState: StateFlow<CustomersUiState> = _uiState.asStateFlow()

    init {
        loadCustomers()
    }

    fun loadCustomers(search: String? = null) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true, error = null)
            
            repository.getCustomers(search = search)
                .onSuccess { response ->
                    _uiState.value = _uiState.value.copy(
                        customers = response.customers,
                        totalCount = response.pagination.total,
                        isLoading = false
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load customers"
                    )
                }
        }
    }

    fun updateSearchQuery(query: String) {
        _uiState.value = _uiState.value.copy(searchQuery = query)
        loadCustomers(search = query.ifBlank { null })
    }
}
