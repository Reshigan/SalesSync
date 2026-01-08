package com.salessync.app.ui.orders

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.salessync.app.data.model.*
import com.salessync.app.data.repository.SalesSyncRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class OrderLineItem(
    val product: Product,
    var quantity: Int = 1
) {
    val lineTotal: Double get() = product.price * quantity
}

data class CreateOrderUiState(
    val customers: List<Customer> = emptyList(),
    val products: List<Product> = emptyList(),
    val selectedCustomer: Customer? = null,
    val orderItems: List<OrderLineItem> = emptyList(),
    val notes: String = "",
    val isLoadingCustomers: Boolean = true,
    val isLoadingProducts: Boolean = true,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val orderCreated: Boolean = false,
    val step: Int = 1 // 1 = Select Customer, 2 = Add Products, 3 = Review
) {
    val subtotal: Double get() = orderItems.sumOf { it.lineTotal }
    val taxAmount: Double get() = subtotal * 0.15 // 15% VAT
    val total: Double get() = subtotal + taxAmount
}

@HiltViewModel
class CreateOrderViewModel @Inject constructor(
    private val repository: SalesSyncRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreateOrderUiState())
    val uiState: StateFlow<CreateOrderUiState> = _uiState.asStateFlow()

    init {
        loadCustomers()
        loadProducts()
    }

    private fun loadCustomers() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingCustomers = true)
            repository.getCustomers()
                .onSuccess { response ->
                    _uiState.value = _uiState.value.copy(
                        customers = response.customers,
                        isLoadingCustomers = false
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoadingCustomers = false,
                        error = e.message
                    )
                }
        }
    }

    private fun loadProducts() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingProducts = true)
            repository.getProducts()
                .onSuccess { products ->
                    _uiState.value = _uiState.value.copy(
                        products = products,
                        isLoadingProducts = false
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoadingProducts = false,
                        error = e.message
                    )
                }
        }
    }

    fun selectCustomer(customer: Customer) {
        _uiState.value = _uiState.value.copy(
            selectedCustomer = customer,
            step = 2
        )
    }

    fun addProduct(product: Product) {
        val currentItems = _uiState.value.orderItems.toMutableList()
        val existingItem = currentItems.find { it.product.id == product.id }
        
        if (existingItem != null) {
            existingItem.quantity++
            _uiState.value = _uiState.value.copy(orderItems = currentItems.toList())
        } else {
            currentItems.add(OrderLineItem(product))
            _uiState.value = _uiState.value.copy(orderItems = currentItems)
        }
    }

    fun removeProduct(productId: String) {
        val currentItems = _uiState.value.orderItems.toMutableList()
        currentItems.removeAll { it.product.id == productId }
        _uiState.value = _uiState.value.copy(orderItems = currentItems)
    }

    fun updateQuantity(productId: String, quantity: Int) {
        if (quantity <= 0) {
            removeProduct(productId)
            return
        }
        
        val currentItems = _uiState.value.orderItems.toMutableList()
        val item = currentItems.find { it.product.id == productId }
        item?.quantity = quantity
        _uiState.value = _uiState.value.copy(orderItems = currentItems.toList())
    }

    fun updateNotes(notes: String) {
        _uiState.value = _uiState.value.copy(notes = notes)
    }

    fun goToStep(step: Int) {
        _uiState.value = _uiState.value.copy(step = step)
    }

    fun submitOrder() {
        val state = _uiState.value
        val customer = state.selectedCustomer ?: return
        
        if (state.orderItems.isEmpty()) {
            _uiState.value = state.copy(error = "Please add at least one product")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isSubmitting = true, error = null)
            
            val request = CreateOrderRequest(
                customerId = customer.id,
                notes = state.notes.ifBlank { null },
                items = state.orderItems.map { item ->
                    OrderItem(
                        productId = item.product.id,
                        productName = item.product.name,
                        quantity = item.quantity,
                        unitPrice = item.product.price,
                        taxRate = item.product.taxRate,
                        lineTotal = item.lineTotal
                    )
                }
            )
            
            repository.createOrder(request)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        orderCreated = true
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        error = e.message ?: "Failed to create order"
                    )
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}
