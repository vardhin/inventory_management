<script>
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabase'  // Import shared client
  import NavBar from './NavBar.svelte'

  let inventoryItems = []
  let newItem = {
    name: '',
    quantity: 1,
    category: '',
    description: '',
    unit_price: 0
  }
  let isLoading = false
  let errorMessage = ''
  let categories = ['Electronics', 'Office Supplies', 'Furniture', 'Other']
  let filterCategory = 'all'
  let searchQuery = ''

  async function fetchInventory() {
    isLoading = true
    errorMessage = ''
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name')
      
      if (error) throw error
      inventoryItems = data
    } catch (error) {
      errorMessage = `Error: ${error.message}`
    } finally {
      isLoading = false
    }
  }

  async function addInventoryItem() {
    if (!newItem.name.trim() || newItem.quantity < 0 || newItem.unit_price < 0) {
      errorMessage = 'Please fill all required fields correctly'
      return
    }

    isLoading = true
    errorMessage = ''
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert([{
          name: newItem.name,
          quantity: newItem.quantity,
          category: newItem.category || 'Other',
          description: newItem.description,
          unit_price: newItem.unit_price
        }])
        .select()
      
      if (error) throw error
      inventoryItems = [...inventoryItems, ...data].sort((a, b) => a.name.localeCompare(b.name))
      // Reset form
      newItem = {
        name: '',
        quantity: 1,
        category: '',
        description: '',
        unit_price: 0
      }
      errorMessage = ''
    } catch (error) {
      errorMessage = `Failed to add item: ${error.message}`
    } finally {
      isLoading = false
    }
  }

  async function updateQuantity(id, newQuantity) {
    if (newQuantity < 0) return
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', id)
      
      if (error) throw error
      inventoryItems = inventoryItems.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    } catch (error) {
      errorMessage = `Failed to update quantity: ${error.message}`
    }
  }

  $: filteredItems = inventoryItems
    .filter(item => filterCategory === 'all' || item.category === filterCategory)
    .filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

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

  <div class="add-item-form">
    <h2>Add New Item</h2>
    <div class="form-grid">
      <input 
        type="text" 
        bind:value={newItem.name} 
        placeholder="Item Name *"
        disabled={isLoading}
      />
      <input 
        type="number" 
        bind:value={newItem.quantity} 
        min="0"
        placeholder="Quantity *"
        disabled={isLoading}
      />
      <select bind:value={newItem.category} disabled={isLoading}>
        <option value="">Select Category</option>
        {#each categories as category}
          <option value={category}>{category}</option>
        {/each}
      </select>
      <input 
        type="number" 
        bind:value={newItem.unit_price} 
        min="0"
        step="0.01"
        placeholder="Unit Price *"
        disabled={isLoading}
      />
      <textarea 
        bind:value={newItem.description} 
        placeholder="Description"
        disabled={isLoading}
      />
      <button 
        on:click={addInventoryItem} 
        disabled={isLoading}
        class="primary-button"
      >
        {isLoading ? 'Adding...' : 'Add Item'}
      </button>
    </div>
  </div>

  <div class="inventory-controls">
    <input 
      type="text" 
      bind:value={searchQuery} 
      placeholder="Search items..."
      class="search-input"
    />
    <select bind:value={filterCategory}>
      <option value="all">All Categories</option>
      {#each categories as category}
        <option value={category}>{category}</option>
      {/each}
    </select>
  </div>

  <div class="inventory-container">
    {#if isLoading && inventoryItems.length === 0}
      <div class="loading">Loading inventory...</div>
    {:else if filteredItems.length === 0}
      <div class="empty-state">No items found.</div>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total Value</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredItems as item}
            <tr class="inventory-item">
              <td>
                <strong>{item.name}</strong>
                {#if item.description}
                  <small class="description">{item.description}</small>
                {/if}
              </td>
              <td>{item.category}</td>
              <td class="quantity-cell">
                <button 
                  class="quantity-btn"
                  on:click={() => updateQuantity(item.id, item.quantity - 1)}
                >-</button>
                <span>{item.quantity}</span>
                <button 
                  class="quantity-btn"
                  on:click={() => updateQuantity(item.id, item.quantity + 1)}
                >+</button>
              </td>
              <td>${item.unit_price.toFixed(2)}</td>
              <td>${(item.quantity * item.unit_price).toFixed(2)}</td>
              <td>
                <button class="icon-button">📝</button>
                <button class="icon-button">🗑️</button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </div>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    margin-bottom: 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h1 {
    color: #2d3748;
    margin: 0;
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

  .close-button {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #4a5568;
  }

  .add-item-form {
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    margin-bottom: 2rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .inventory-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .search-input {
    flex: 1;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 0.5rem;
    overflow: hidden;
  }

  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }

  th {
    background: #f7fafc;
    font-weight: 600;
  }

  .quantity-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .quantity-btn {
    padding: 0.25rem 0.5rem;
    border: 1px solid #e2e8f0;
    background: white;
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .description {
    display: block;
    color: #718096;
    font-size: 0.875rem;
  }

  .icon-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    font-size: 1.25rem;
  }

  input, select, textarea {
    padding: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 1rem;
    width: 100%;
    box-sizing: border-box;
  }

  textarea {
    grid-column: 1 / -1;
    resize: vertical;
    min-height: 100px;
  }

  .primary-button {
    grid-column: 1 / -1;
  }

  .loading, .empty-state {
    padding: 2rem;
    text-align: center;
    color: #718096;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .nav-button {
    padding: 0.75rem 1.5rem;
    background: #4299e1;
    color: white;
    text-decoration: none;
    border-radius: 0.375rem;
    transition: background-color 0.2s;
  }

  .nav-button:hover {
    background: #3182ce;
  }
</style>

