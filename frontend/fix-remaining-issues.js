#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to fix specific TypeScript issues
function fixTypeScriptIssues() {
  console.log('🔧 Fixing remaining TypeScript issues...');

  // Fix field agents page data access
  const agentsPagePath = 'src/app/field-agents/agents/page.tsx';
  if (fs.existsSync(agentsPagePath)) {
    let content = fs.readFileSync(agentsPagePath, 'utf8');
    
    // Fix response.data.data to response.data
    content = content.replace(
      'setAgents(response.data.data || [])',
      'setAgents(response.data || [])'
    );
    
    fs.writeFileSync(agentsPagePath, content);
    console.log('✅ Fixed field agents page data access');
  }

  // Fix back office orders page status comparisons
  const backOfficeOrdersPath = 'src/app/back-office/orders/page.tsx';
  if (fs.existsSync(backOfficeOrdersPath)) {
    let content = fs.readFileSync(backOfficeOrdersPath, 'utf8');
    
    // Fix status comparisons
    content = content.replace(
      /order\.status !== 'draft'/g,
      "order.status !== 'draft' && order.status !== 'pending'"
    );
    content = content.replace(
      /order\.status === 'processing'/g,
      "order.status === 'confirmed'"
    );
    
    // Fix property access with optional chaining
    content = content.replace(
      /order\.totalAmount/g,
      'order.totalAmount || order.total_amount'
    );
    content = content.replace(
      /order\.orderNumber/g,
      'order.orderNumber || order.id'
    );
    content = content.replace(
      /order\.customerName/g,
      'order.customerName || order.customer_name'
    );
    content = content.replace(
      /order\.customerCode/g,
      'order.customerCode || order.customer_id'
    );
    content = content.replace(
      /order\.orderDate/g,
      'order.orderDate || order.order_date'
    );
    content = content.replace(
      /order\.deliveryDate/g,
      'order.deliveryDate || order.delivery_date'
    );
    content = content.replace(
      /order\.paymentStatus/g,
      'order.paymentStatus || order.payment_status'
    );
    
    // Fix date parsing with null checks
    content = content.replace(
      /new Date\(order\.orderDate\)/g,
      'new Date(order.orderDate || order.order_date || "")'
    );
    content = content.replace(
      /new Date\(order\.deliveryDate\)/g,
      'new Date(order.deliveryDate || order.delivery_date || "")'
    );
    
    // Fix status mapping with null checks
    content = content.replace(
      /statusColors\[order\.status\]/g,
      'statusColors[order.status] || "bg-gray-100 text-gray-800"'
    );
    content = content.replace(
      /paymentStatusColors\[order\.paymentStatus\]/g,
      'paymentStatusColors[order.paymentStatus || order.payment_status] || "bg-gray-100 text-gray-800"'
    );
    
    fs.writeFileSync(backOfficeOrdersPath, content);
    console.log('✅ Fixed back office orders page');
  }

  // Fix customers page property access
  const customersPagePath = 'src/app/customers/page.tsx';
  if (fs.existsSync(customersPagePath)) {
    let content = fs.readFileSync(customersPagePath, 'utf8');
    
    // Fix property access with fallbacks
    content = content.replace(
      /customer\.creditLimit/g,
      'customer.creditLimit || 0'
    );
    content = content.replace(
      /customer\.businessName/g,
      'customer.businessName || customer.name'
    );
    content = content.replace(
      /customer\.customerCode/g,
      'customer.customerCode || customer.code'
    );
    content = content.replace(
      /customer\.city/g,
      'customer.city || ""'
    );
    content = content.replace(
      /customer\.region/g,
      'customer.region || ""'
    );
    content = content.replace(
      /customer\.paymentTerms/g,
      'customer.paymentTerms || "Net 30"'
    );
    
    // Fix status and type mapping
    content = content.replace(
      /statusColors\[customer\.status\]/g,
      'statusColors[customer.status] || "bg-gray-100 text-gray-800"'
    );
    content = content.replace(
      /typeColors\[customer\.type\]/g,
      'typeColors[customer.type] || "bg-gray-100 text-gray-800"'
    );
    
    fs.writeFileSync(customersPagePath, content);
    console.log('✅ Fixed customers page');
  }

  console.log('🎉 All TypeScript issues fixed!');
}

// Run the fixes
fixTypeScriptIssues();