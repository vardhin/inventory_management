<script>
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabase'
  import NavBar from '../NavBar.svelte'

  let inventoryItems = []
  let selectedItems = []
  let customerInfo = {
    name: '',
    phone: ''
  }
  let isLoading = false
  let errorMessage = ''
  let billGenerated = false
  let billDetails = null

  // New item entry template with proper reactive declaration
  $: newItemEntry = {
    item_id: '',
    quantity: 1,
    unit_price: 0,
    total: 0
  }

  async function fetchInventory() {
    try {
      isLoading = true
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name')
      if (error) throw error
      inventoryItems = data
    } catch (error) {
      errorMessage = `Error fetching inventory: ${error.message}`
    } finally {
      isLoading = false
    }
  }

  // Update the reactive statement to avoid infinite loops
  $: if (newItemEntry.item_id && inventoryItems.length > 0) {
    const selectedItem = inventoryItems.find(item => item.id === newItemEntry.item_id)
    if (selectedItem) {
      newItemEntry.unit_price = selectedItem.unit_price
      newItemEntry.total = newItemEntry.quantity * selectedItem.unit_price
    }
  }

  // Modify the select element binding
  function handleItemSelection(event) {
    const selectedId = event.target.value
    newItemEntry = {
      ...newItemEntry,
      item_id: selectedId,
      quantity: 1,
      unit_price: 0,
      total: 0
    }
  }

  async function addItemToBill() {
    if (!newItemEntry.item_id || newItemEntry.quantity < 1) {
      errorMessage = 'Please select an item and specify quantity'
      return
    }

    const selectedItem = inventoryItems.find(item => item.id === newItemEntry.item_id)
    if (!selectedItem) {
      errorMessage = 'Selected item not found in inventory'
      return
    }

    if (selectedItem.quantity < newItemEntry.quantity) {
      errorMessage = 'Not enough items in stock'
      return
    }

    // Check if item already exists in selectedItems
    const existingItemIndex = selectedItems.findIndex(item => item.item_id === newItemEntry.item_id)
    
    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedQuantity = selectedItems[existingItemIndex].quantity + newItemEntry.quantity
      if (selectedItem.quantity < updatedQuantity) {
        errorMessage = 'Not enough items in stock for the combined quantity'
        return
      }

      selectedItems[existingItemIndex] = {
        ...selectedItems[existingItemIndex],
        quantity: updatedQuantity,
        total: updatedQuantity * selectedItem.unit_price
      }
      selectedItems = [...selectedItems] // Trigger reactivity
    } else {
      // Add new item
      selectedItems = [...selectedItems, {
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        quantity: newItemEntry.quantity,
        unit_price: selectedItem.unit_price,
        total: newItemEntry.quantity * selectedItem.unit_price
      }]
    }

    // Reset new item entry
    newItemEntry = {
      item_id: '',
      quantity: 1,
      unit_price: 0,
      total: 0
    }
    errorMessage = ''
  }

  function calculateTotal() {
    return selectedItems.reduce((sum, item) => sum + item.total, 0)
  }

  function removeItem(index) {
    selectedItems = selectedItems.filter((_, i) => i !== index)
  }

  async function generateBill() {
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      errorMessage = 'Please fill in customer information'
      return
    }

    if (selectedItems.length === 0) {
      errorMessage = 'Please add items to the bill'
      return
    }

    isLoading = true
    errorMessage = ''

    try {
      // Create bill record
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert([{
          customer_name: customerInfo.name.trim(),
          customer_phone: customerInfo.phone.trim(),
          total_amount: calculateTotal(),
          items: selectedItems
        }])
        .select()
      
      if (billError) throw billError

      // Update inventory quantities
      for (const item of selectedItems) {
        const { error: updateError } = await supabase
          .from('inventory')
          .update({ 
            quantity: inventoryItems.find(i => i.id === item.item_id).quantity - item.quantity 
          })
          .eq('id', item.item_id)
        
        if (updateError) throw updateError
      }

      billDetails = billData[0]
      billGenerated = true
      
      // Refresh inventory
      await fetchInventory()
    } catch (error) {
      errorMessage = `Error generating bill: ${error.message}`
      billGenerated = false
      billDetails = null
    } finally {
      isLoading = false
    }
  }

  onMount(() => {
    fetchInventory()
  })
</script>

<NavBar />
<div class="container">
  {#if errorMessage}
    <div class="error-message">
      {errorMessage}
      <button class="close-button" on:click={() => errorMessage = ''}>×</button>
    </div>
  {/if}

  {#if !billGenerated}
    <div class="billing-form">
      <div class="customer-info">
        <h2>Customer Information</h2>
        <input
          type="text"
          bind:value={customerInfo.name}
          placeholder="Customer Name *"
          required
          disabled={isLoading}
        />
        <input
          type="tel"
          bind:value={customerInfo.phone}
          placeholder="Phone Number *"
          required
          disabled={isLoading}
        />
      </div>

      <div class="item-selection">
        <h2>Add Items</h2>
        <div class="form-grid">
          <select 
            value={newItemEntry.item_id} 
            on:change={handleItemSelection}
            disabled={isLoading}
          >
            <option value="">Select Item</option>
            {#each inventoryItems as item}
              <option 
                value={item.id} 
                disabled={item.quantity === 0}
              >
                {item.name} {item.quantity === 0 ? '(Out of stock)' : `(In stock: ${item.quantity})`}
              </option>
            {/each}
          </select>
          <input
            type="number"
            bind:value={newItemEntry.quantity}
            min="1"
            placeholder="Quantity"
            disabled={isLoading || !newItemEntry.item_id}
          />
          <button on:click={addItemToBill} disabled={isLoading || !newItemEntry.item_id} class="add-button">
            Add to Bill
          </button>
        </div>
      </div>

      {#if selectedItems.length > 0}
        <div class="selected-items">
          <h2>Selected Items</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {#each selectedItems as item, i}
                <tr>
                  <td>{item.item_name}</td>
                  <td>{item.quantity}</td>
                  <td>${item.unit_price.toFixed(2)}</td>
                  <td>${item.total.toFixed(2)}</td>
                  <td>
                    <button class="icon-button" on:click={() => removeItem(i)}>🗑️</button>
                  </td>
                </tr>
              {/each}
              <tr class="total-row">
                <td colspan="3">Total Amount</td>
                <td colspan="2">${calculateTotal().toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <button class="generate-bill" on:click={generateBill} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Bill'}
          </button>
        </div>
      {/if}
    </div>
  {:else}
    <div class="bill-preview">
      <h2>Bill Generated Successfully</h2>
      <div class="bill-details">
        <p><strong>Customer Name:</strong> {billDetails.customer_name}</p>
        <p><strong>Phone Number:</strong> {billDetails.customer_phone}</p>
        <p><strong>Date:</strong> {new Date(billDetails.created_at).toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {#each billDetails.items as item}
              <tr>
                <td>{item.item_name}</td>
                <td>{item.quantity}</td>
                <td>${item.unit_price.toFixed(2)}</td>
                <td>${item.total.toFixed(2)}</td>
              </tr>
            {/each}
            <tr class="total-row">
              <td colspan="3">Total Amount</td>
              <td>${billDetails.total_amount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        <button class="new-bill" on:click={() => {
          billGenerated = false
          billDetails = null
          selectedItems = []
          customerInfo = { name: '', phone: '' }
        }}>Create New Bill</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  .error-message {
    background: #fff5f5;
    border-left: 4px solid #f56565;
    padding: 1rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .billing-form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .customer-info, .item-selection {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .form-grid {
    display: grid;
    grid-template-columns: 2fr 1fr auto;
    gap: 1rem;
    align-items: start;
  }

  input, select {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  button.add-button {
    padding: 0.75rem 1.5rem;
    background: #48bb78;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button.add-button:hover {
    background: #38a169;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  .total-row {
    font-weight: bold;
  }

  .generate-bill, .new-bill {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
  }

  .generate-bill:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }

  .bill-preview {
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.25rem;
  }

  .nav-button {
    padding: 0.75rem 1.5rem;
    background: #4299e1;
    color: white;
    text-decoration: none;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
    margin-right: 0.5rem;
  }

  .nav-button:hover {
    background: #3182ce;
  }

  input[disabled], select[disabled] {
    background-color: #f7fafc;
    cursor: not-allowed;
  }
</style>
