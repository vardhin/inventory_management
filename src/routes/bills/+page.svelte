<script>
  import { onMount } from 'svelte'
  import { supabase } from '$lib/supabase'
  import NavBar from '../NavBar.svelte'

  let bills = []
  let isLoading = true
  let errorMessage = ''
  let selectedBill = null
  let searchQuery = ''
  let startDate = ''
  let endDate = ''

  async function fetchBills() {
    isLoading = true
    errorMessage = ''
    try {
      let query = supabase
        .from('bills')
        .select('*')
        .order('created_at', { ascending: false })

      if (startDate && endDate) {
        query = query
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
      }

      const { data, error } = await query
      if (error) throw error
      bills = data
    } catch (error) {
      errorMessage = `Error fetching bills: ${error.message}`
    } finally {
      isLoading = false
    }
  }

  function viewBillDetails(bill) {
    selectedBill = bill
  }

  function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', 
                      hour: '2-digit', minute: '2-digit' }
    return new Date(dateString).toLocaleString(undefined, options)
  }

  function formatCurrency(amount) {
    return `$${Number(amount).toFixed(2)}`
  }

  $: filteredBills = bills.filter(bill => 
    bill.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bill.customer_phone.includes(searchQuery)
  )

  onMount(() => {
    fetchBills()
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

  <div class="filters">
    <input
      type="text"
      bind:value={searchQuery}
      placeholder="Search by customer name or phone..."
      class="search-input"
      disabled={isLoading}
    />
    <div class="date-filters">
      <input
        type="date"
        bind:value={startDate}
        class="date-input"
        disabled={isLoading}
      />
      <span>to</span>
      <input
        type="date"
        bind:value={endDate}
        class="date-input"
        disabled={isLoading}
      />
      <button on:click={fetchBills} class="filter-button" disabled={isLoading}>
        Apply Filter
      </button>
    </div>
  </div>

  {#if isLoading}
    <div class="loading">Loading bills...</div>
  {:else if filteredBills.length === 0}
    <div class="empty-state">No bills found.</div>
  {:else}
    <div class="bills-list">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer Name</th>
            <th>Phone</th>
            <th>Total Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each filteredBills as bill}
            <tr>
              <td>{formatDate(bill.created_at)}</td>
              <td>{bill.customer_name}</td>
              <td>{bill.customer_phone}</td>
              <td>{formatCurrency(bill.total_amount)}</td>
              <td>
                <button class="view-button" on:click={() => viewBillDetails(bill)}>
                  View Details
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if selectedBill}
    <div class="modal-backdrop" on:click={() => selectedBill = null}>
      <div class="modal-content" on:click|stopPropagation>
        <div class="modal-header">
          <h2>Bill Details</h2>
          <button class="close-button" on:click={() => selectedBill = null}>×</button>
        </div>
        
        <div class="bill-details">
          <div class="customer-info">
            <p><strong>Customer Name:</strong> {selectedBill.customer_name}</p>
            <p><strong>Phone Number:</strong> {selectedBill.customer_phone}</p>
            <p><strong>Date:</strong> {formatDate(selectedBill.created_at)}</p>
          </div>

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
              {#each selectedBill.items as item}
                <tr>
                  <td>{item.item_name}</td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td>{formatCurrency(item.total)}</td>
                </tr>
              {/each}
              <tr class="total-row">
                <td colspan="3">Total Amount</td>
                <td>{formatCurrency(selectedBill.total_amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .page-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 2rem;
    gap: 0.5rem;
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

  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .search-input {
    flex: 1;
    min-width: 250px;
  }

  .date-filters {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .date-input {
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 0.375rem;
    font-size: 1rem;
  }

  .filter-button {
    padding: 0.5rem 1rem;
    background: #48bb78;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .filter-button:hover {
    background: #38a169;
  }

  .filter-button:disabled {
    background: #a0aec0;
    cursor: not-allowed;
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

  .bills-list table {
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

  .view-button {
    padding: 0.5rem 1rem;
    background: #4299e1;
    color: white;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .view-button:hover {
    background: #3182ce;
  }

  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    max-width: 800px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .bill-details {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .customer-info {
    display: grid;
    gap: 0.5rem;
  }

  .bill-details table {
    width: 100%;
    border-collapse: collapse;
  }

  .total-row {
    font-weight: bold;
  }

  .loading, .empty-state {
    text-align: center;
    padding: 2rem;
    color: #718096;
  }

  @media (max-width: 600px) {
    .filters {
      flex-direction: column;
    }

    .date-filters {
      flex-direction: column;
      align-items: flex-start;
    }

    .date-filters span {
      display: none;
    }
  }
</style> 