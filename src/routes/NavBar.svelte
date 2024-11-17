<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';

  let connectionStatus = 'Checking connection...';

  async function checkConnection() {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .limit(1);
      
      if (error) throw error;
      connectionStatus = 'Connected successfully!';
    } catch (error) {
      connectionStatus = 'Connection failed';
    }
  }

  onMount(() => {
    checkConnection();
  });
</script>

<nav>
  <div class="nav-container">
    <a 
      href="/" 
      class="nav-link" 
      class:active={$page.url.pathname === '/'}
    >
      <i class="fas fa-home"></i>
      Inventory Management
    </a>
    
    <a 
      href="/billing" 
      class="nav-link"
      class:active={$page.url.pathname === '/billing'}
    >
      <i class="fas fa-credit-card"></i>
      Billing
    </a>
    
    <a 
      href="/bills" 
      class="nav-link"
      class:active={$page.url.pathname === '/bills'}
    >
      <i class="fas fa-history"></i>
      History
    </a>

    <div class="connection-status" class:connected={connectionStatus.includes('successfully')}>
      {connectionStatus}
    </div>
  </div>
</nav>

<style>
  nav {
    background: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1rem 0;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .nav-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: center;
    gap: 2rem;
  }

  .nav-link {
    text-decoration: none;
    color: #666;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nav-link:hover {
    color: #333;
    background: rgba(0, 0, 0, 0.05);
  }

  .nav-link.active {
    color: #2563eb;
    background: rgba(37, 99, 235, 0.1);
  }

  i {
    font-size: 1.1rem;
  }

  @media (max-width: 600px) {
    .nav-container {
      gap: 1rem;
    }
    
    .nav-link {
      padding: 0.5rem;
      font-size: 0.9rem;
    }
  }

  .connection-status {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    background: #fef2f2;
    color: #dc2626;
  }

  .connection-status.connected {
    background: #f0fdf4;
    color: #16a34a;
  }
</style>
