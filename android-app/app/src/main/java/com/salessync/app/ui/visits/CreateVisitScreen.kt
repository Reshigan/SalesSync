package com.salessync.app.ui.visits

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.salessync.app.R
import com.salessync.app.data.model.CreateVisitRequest
import com.salessync.app.data.model.Customer
import com.salessync.app.data.repository.SalesSyncRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject

data class CreateVisitUiState(
    val customers: List<Customer> = emptyList(),
    val selectedCustomer: Customer? = null,
    val visitType: String = "sales",
    val purpose: String = "",
    val notes: String = "",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val isLoadingCustomers: Boolean = true,
    val isLoadingLocation: Boolean = false,
    val isSubmitting: Boolean = false,
    val error: String? = null,
    val visitCreated: Boolean = false,
    val step: Int = 1 // 1 = Select Customer, 2 = Visit Details
)

@HiltViewModel
class CreateVisitViewModel @Inject constructor(
    private val repository: SalesSyncRepository,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreateVisitUiState())
    val uiState: StateFlow<CreateVisitUiState> = _uiState.asStateFlow()

    private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)

    init {
        loadCustomers()
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

    fun selectCustomer(customer: Customer) {
        _uiState.value = _uiState.value.copy(
            selectedCustomer = customer,
            step = 2
        )
        getCurrentLocation()
    }

    @SuppressLint("MissingPermission")
    fun getCurrentLocation() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoadingLocation = true)
            try {
                val cancellationToken = CancellationTokenSource()
                val location = fusedLocationClient.getCurrentLocation(
                    Priority.PRIORITY_HIGH_ACCURACY,
                    cancellationToken.token
                ).await()
                
                location?.let {
                    _uiState.value = _uiState.value.copy(
                        latitude = it.latitude,
                        longitude = it.longitude,
                        isLoadingLocation = false
                    )
                } ?: run {
                    _uiState.value = _uiState.value.copy(
                        isLoadingLocation = false,
                        error = "Could not get current location"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoadingLocation = false,
                    error = "Location error: ${e.message}"
                )
            }
        }
    }

    fun setVisitType(type: String) {
        _uiState.value = _uiState.value.copy(visitType = type)
    }

    fun setPurpose(purpose: String) {
        _uiState.value = _uiState.value.copy(purpose = purpose)
    }

    fun setNotes(notes: String) {
        _uiState.value = _uiState.value.copy(notes = notes)
    }

    fun goToStep(step: Int) {
        _uiState.value = _uiState.value.copy(step = step)
    }

    fun checkIn() {
        val state = _uiState.value
        val customer = state.selectedCustomer ?: return

        viewModelScope.launch {
            _uiState.value = state.copy(isSubmitting = true, error = null)
            
            val now = LocalDateTime.now()
            val request = CreateVisitRequest(
                customerId = customer.id,
                visitDate = now.format(DateTimeFormatter.ISO_LOCAL_DATE),
                checkInTime = now.format(DateTimeFormatter.ISO_LOCAL_TIME),
                latitude = state.latitude,
                longitude = state.longitude,
                visitType = state.visitType,
                purpose = state.purpose.ifBlank { null },
                notes = state.notes.ifBlank { null }
            )
            
            repository.createVisit(request)
                .onSuccess {
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        visitCreated = true
                    )
                }
                .onFailure { e ->
                    _uiState.value = _uiState.value.copy(
                        isSubmitting = false,
                        error = e.message ?: "Failed to check in"
                    )
                }
        }
    }

    fun clearError() {
        _uiState.value = _uiState.value.copy(error = null)
    }
}

@OptIn(ExperimentalMaterial3Api::class, ExperimentalPermissionsApi::class)
@Composable
fun CreateVisitScreen(
    onNavigateBack: () -> Unit,
    onVisitCreated: () -> Unit,
    viewModel: CreateVisitViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val locationPermissionState = rememberPermissionState(Manifest.permission.ACCESS_FINE_LOCATION)

    LaunchedEffect(uiState.visitCreated) {
        if (uiState.visitCreated) {
            onVisitCreated()
        }
    }

    LaunchedEffect(locationPermissionState.status.isGranted) {
        if (locationPermissionState.status.isGranted && uiState.step == 2 && uiState.latitude == null) {
            viewModel.getCurrentLocation()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(
                        when (uiState.step) {
                            1 -> "Select Customer"
                            2 -> "Check In"
                            else -> "New Visit"
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

            // Location Permission Request
            if (!locationPermissionState.status.isGranted && uiState.step == 2) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            Icons.Default.LocationOff,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = stringResource(R.string.location_required),
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onTertiaryContainer
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Button(onClick = { locationPermissionState.launchPermissionRequest() }) {
                            Text("Grant Permission")
                        }
                    }
                }
            }

            when (uiState.step) {
                1 -> VisitCustomerSelectionStep(
                    customers = uiState.customers,
                    isLoading = uiState.isLoadingCustomers,
                    onCustomerSelected = viewModel::selectCustomer
                )
                2 -> VisitDetailsStep(
                    customer = uiState.selectedCustomer,
                    visitType = uiState.visitType,
                    purpose = uiState.purpose,
                    notes = uiState.notes,
                    latitude = uiState.latitude,
                    longitude = uiState.longitude,
                    isLoadingLocation = uiState.isLoadingLocation,
                    isSubmitting = uiState.isSubmitting,
                    onVisitTypeChanged = viewModel::setVisitType,
                    onPurposeChanged = viewModel::setPurpose,
                    onNotesChanged = viewModel::setNotes,
                    onRefreshLocation = viewModel::getCurrentLocation,
                    onCheckIn = viewModel::checkIn
                )
            }
        }
    }
}

@Composable
private fun VisitCustomerSelectionStep(
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
                            Icons.Default.Store,
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
                            customer.address?.let { address ->
                                Text(
                                    text = address,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VisitDetailsStep(
    customer: Customer?,
    visitType: String,
    purpose: String,
    notes: String,
    latitude: Double?,
    longitude: Double?,
    isLoadingLocation: Boolean,
    isSubmitting: Boolean,
    onVisitTypeChanged: (String) -> Unit,
    onPurposeChanged: (String) -> Unit,
    onNotesChanged: (String) -> Unit,
    onRefreshLocation: () -> Unit,
    onCheckIn: () -> Unit
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
                        Icons.Default.Store,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.size(40.dp)
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column {
                        Text(
                            text = customer?.name ?: "",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        customer?.address?.let { address ->
                            Text(
                                text = address,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }
        }

        // Location Card
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = "Location",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        IconButton(
                            onClick = onRefreshLocation,
                            enabled = !isLoadingLocation
                        ) {
                            if (isLoadingLocation) {
                                CircularProgressIndicator(modifier = Modifier.size(24.dp))
                            } else {
                                Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    if (latitude != null && longitude != null) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.LocationOn,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.secondary,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "%.6f, %.6f".format(latitude, longitude),
                                style = MaterialTheme.typography.bodyMedium
                            )
                        }
                    } else {
                        Text(
                            text = "Location not available",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
        }

        // Visit Type
        item {
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Visit Type",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    listOf(
                        "sales" to "Sales Visit",
                        "delivery" to "Delivery",
                        "collection" to "Collection",
                        "service" to "Service Call",
                        "other" to "Other"
                    ).forEach { (value, label) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onVisitTypeChanged(value) }
                                .padding(vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = visitType == value,
                                onClick = { onVisitTypeChanged(value) }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(label)
                        }
                    }
                }
            }
        }

        // Purpose
        item {
            OutlinedTextField(
                value = purpose,
                onValueChange = onPurposeChanged,
                label = { Text("Purpose") },
                placeholder = { Text("e.g., Product presentation, Order follow-up") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
        }

        // Notes
        item {
            OutlinedTextField(
                value = notes,
                onValueChange = onNotesChanged,
                label = { Text(stringResource(R.string.visit_notes)) },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3,
                maxLines = 5
            )
        }

        // Check In Button
        item {
            Button(
                onClick = onCheckIn,
                enabled = !isSubmitting && latitude != null,
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
                    Icon(Icons.Default.LocationOn, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = stringResource(R.string.check_in),
                        style = MaterialTheme.typography.titleMedium
                    )
                }
            }
        }
    }
}
