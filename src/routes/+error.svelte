<script>
  import { page } from '$app/stores'
</script>

<div class="error-container">
  <h1>{$page.status}: {$page.error?.message}</h1>
  <p>Something went wrong. Please try again later.</p>
  <a href="/" class="nav-button">Return Home</a>
</div>

<style>
  .error-container {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    text-align: center;
  }

  .nav-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #4299e1;
    color: white;
    text-decoration: none;
    border-radius: 0.375rem;
    margin-top: 1rem;
  }
</style> 