package com.salessync.app.ui.vansales

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.salessync.app.R
import com.salessync.app.data.model.Customer
import com.salessync.app.data.model.Product
import com.salessync.app.data.repository.SalesSyncRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.Locale
import javax.inject.Inject

data class VanSaleItem(
    val product: Product,
    var quantity: Int = 1
) {
    val lineTotal: Double get() = product.price * quantity
}

data class CreateVanSaleUiState(
    val customers: List<Customer> = emptyList(),
    val products: List<Product> = emptyList(),
    val selectedCustomer: Customer? = null,
    val saleItems: List<VanSaleItem> = emptyList(),
    val paymentMethod: String = "cash",
    val notes: String = "",
    val isLoadingCustomers: Boolean = true,
    val isLoadingProducts: Boolean = true,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val saleCreated: Boolean = false,
    val step: Int = 1
) {
    val total: Double get() = saleItems.sumOf { it.lineTotal }
}

@HiltViewModel
class CreateVanSaleViewModel @Inject constructor(
    private val repository: SalesSyncRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreateVanSaleUiState())
    val uiState: StateFlow<CreateVanSaleUiState> = _uiState.asStateFlow()

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
        val currentItems = _uiState.value.saleItems.toMutableList()
        val existingItem = currentItems.find { it.product.id == product.id }
        
        if (existingItem != null) {
            existingItem.quantity++
            _uiState.value = _uiState.value.copy(saleItems = currentItems.toList())
        } else {
            currentItems.add(VanSaleItem(product))
            _uiState.value = _uiState.value.copy(saleItems = currentItems)
        }
    }

    fun updateQuantity(productId: String, quantity: Int) {
        if (quantity <= 0) {
            removeProduct(productId)
            return
        }
        
        val currentItems = _uiState.value.saleItems.toMutableList()
        val item = currentItems.find { it.product.id == productId }
        item?.quantity = quantity
        _uiState.value = _uiState.value.copy(saleItems = currentItems.toList())
    }

    fun removeProduct(productId: String) {
        val currentItems = _uiState.value.saleItems.toMutableList()
        currentItems.removeAll { it.product.id == productId }
        _uiState.value = _uiState.value.copy(saleItems = currentItems)
    }

    fun setPaymentMethod(method: String) {
        _uiState.value = _uiState.value.copy(paymentMethod = method)
    }

    fun updateNotes(notes: String) {
        _uiState.value = _uiState.value.copy(notes = notes)
    }

    fun goToStep(step: Int) {
        _uiState.value = _uiState.value.copy(step = step)
    }

    fun completeSale() {
        val state = _uiState.value
        if (state.selectedCustomer == null || state.saleItems.isEmpty()) {
            _uiState.value = state.copy(error = "Please select a customer and add products")
            return
        }

        viewModelScope.launch {
            _uiState.value = state.copy(isSubmitting = true, error = null)
            
            // TODO: Call API to create van sale
            // For now, simulate success
            kotlinx.coroutines.delay(1000)
            _uiState.value = _uiState.value.copy(
                isSubmitting = false,
                saleCreated = true
            )
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateVanSaleScreen(
    onNavigateBack: () -> Unit,
    onSaleCreated: () -> Unit,
    viewModel: CreateVanSaleViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.saleCreated) {
        if (uiState.saleCreated) {
            onSaleCreated()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        when (uiState.step) {
                            1 -> "Select Customer"
                            2 -> "Add Products"
                            3 -> "Payment"
                            else -> "Van Sale"
                        }
                    ) 
                },
                navigationIcon = {
                    IconButton(onClick = {
                        when (uiState.step) {
                            1 -> onNavigateBack()
                            else -> viewModel.goToStep(uiState.step - 1)
                        }
                    }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Error Message
            uiState.error?.let { error ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Error,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onErrorContainer
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = error,
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            modifier = Modifier.weight(1f)
                        )
                        IconButton(onClick = { viewModel.clearError() }) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Dismiss",
                                tint = MaterialTheme.colorScheme.onErrorContainer
                            )
                        }
                    }
                }
            }

            when (uiState.step) {
                1 -> VanSaleCustomerStep(
                    customers = uiState.customers,
                    isLoading = uiState.isLoadingCustomers,
                    onCustomerSelected = viewModel::selectCustomer
                )
                2 -> VanSaleProductStep(
                    products = uiState.products,
                    saleItems = uiState.saleItems,
                    isLoading = uiState.isLoadingProducts,
                    onAddProduct = viewModel::addProduct,
                    onUpdateQuantity = viewModel::updateQuantity,
                    onContinue = { viewModel.goToStep(3) },
                    total = uiState.total
                )
                3 -> VanSalePaymentStep(
                    customer = uiState.selectedCustomer,
                    saleItems = uiState.saleItems,
                    total = uiState.total,
                    paymentMethod = uiState.paymentMethod,
                    notes = uiState.notes,
                    isSubmitting = uiState.isSubmitting,
                    onPaymentMethodChanged = viewModel::setPaymentMethod,
                    onNotesChanged = viewModel::updateNotes,
                    onCompleteSale = viewModel::completeSale
                )
            }
        }
    }
}

@Composable
private fun VanSaleCustomerStep(
    customers: List<Customer>,
    isLoading: Boolean,
    onCustomerSelected: (Customer) -> Unit
) {
    if (isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(customers) { customer ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onCustomerSelected(customer) }
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Person,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary
                        )
                        Spacer(modifier = Modifier.width(16.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = customer.name,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = customer.address ?: customer.code,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Icon(
                            Icons.Default.ChevronRight,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun VanSaleProductStep(
    products: List<Product>,
    saleItems: List<VanSaleItem>,
    isLoading: Boolean,
    onAddProduct: (Product) -> Unit,
    onUpdateQuantity: (String, Int) -> Unit,
    onContinue: () -> Unit,
    total: Double
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Cart Summary
        if (saleItems.isNotEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "${saleItems.sumOf { it.quantity }} items",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = "Total: ${formatCurrency(total)}",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                    Button(onClick = onContinue) {
                        Text("Payment")
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(Icons.Default.ArrowForward, contentDescription = null)
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        if (isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(products) { product ->
                    val saleItem = saleItems.find { it.product.id == product.id }
                    VanSaleProductCard(
                        product = product,
                        quantity = saleItem?.quantity ?: 0,
                        onAdd = { onAddProduct(product) },
                        onUpdateQuantity = { qty -> onUpdateQuantity(product.id, qty) }
                    )
                }
            }
        }
    }
}

@Composable
private fun VanSaleProductCard(
    product: Product,
    quantity: Int,
    onAdd: () -> Unit,
    onUpdateQuantity: (Int) -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = product.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = formatCurrency(product.price),
                    style = MaterialTheme.typography.titleSmall,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            if (quantity > 0) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = { onUpdateQuantity(quantity - 1) }) {
                        Icon(Icons.Default.Remove, contentDescription = "Decrease")
                    }
                    Text(
                        text = quantity.toString(),
                        style = MaterialTheme.typography.titleMedium,
                        modifier = Modifier.padding(horizontal = 8.dp)
                    )
                    IconButton(onClick = { onUpdateQuantity(quantity + 1) }) {
                        Icon(Icons.Default.Add, contentDescription = "Increase")
                    }
                }
            } else {
                Button(onClick = onAdd) {
                    Icon(Icons.Default.Add, contentDescription = null)
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VanSalePaymentStep(
    customer: Customer?,
    saleItems: List<VanSaleItem>,
    total: Double,
    paymentMethod: String,
    notes: String,
    isSubmitting: Boolean,
    onPaymentMethodChanged: (String) -> Unit,
    onNotesChanged: (String) -> Unit,
    onCompleteSale: () -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Customer Info
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(
                            text = customer?.name ?: "",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = customer?.address ?: "",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Order Summary
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Order Summary",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    saleItems.forEach { item ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("${item.quantity}x ${item.product.name}")
                            Text(formatCurrency(item.lineTotal))
                        }
                    }
                    Divider(modifier = Modifier.padding(vertical = 8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "Total",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = formatCurrency(total),
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }

        // Payment Method
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Payment Method",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    listOf("cash" to "Cash", "card" to "Card", "credit" to "Credit").forEach { (value, label) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onPaymentMethodChanged(value) }
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = paymentMethod == value,
                                onClick = { onPaymentMethodChanged(value) }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(label)
                        }
                    }
                }
            }
        }

        // Notes
        item {
            OutlinedTextField(
                value = notes,
                onValueChange = onNotesChanged,
                label = { Text("Notes (optional)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
                maxLines = 4
            )
        }

        // Complete Sale Button
        item {
            Button(
                onClick = onCompleteSale,
                enabled = !isSubmitting,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Icon(Icons.Default.Check, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.complete_sale),
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}

private fun formatCurrency(amount: Double): String {
    val format = NumberFormat.getCurrencyInstance(Locale("en", "ZA"))
    return format.format(amount)
}
