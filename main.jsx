import { useState } from 'react'
import './index.css'

function App() {
  const [cart, setCart] = useState([])

  const products = [
    { id: 1, name: 'Premium Noise-Cancelling Headphones', price: 299, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80' },
    { id: 2, name: 'Mechanical Keyboard (Cherry MX Blue)', price: 129, image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80' },
    { id: 3, name: 'Ultra-Wide Curved Monitor', price: 549, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80' },
    { id: 4, name: 'Ergonomic Desk Chair', price: 189, image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&q=80' },
  ]

  const addToCart = (product) => {
    setCart([...cart, product])
  }

  return (
    <div className="container">
      <nav className="glass-nav">
        <h1>TechStore Elegance</h1>
        <div className="cart-indicator">
          <span>Cart ({cart.length})</span>
          <button className="checkout-btn">Checkout</button>
        </div>
      </nav>

      <main>
        <section className="hero">
          <h2>Welcome to the Future of Tech</h2>
          <p>Discover our premium selection of devices, curated for excellence.</p>
          <button className="primary-btn">Shop Now</button>
        </section>

        <section className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-card glass-card">
              <div className="img-container">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="card-content">
                <h3>{product.name}</h3>
                <p className="price">${product.price}</p>
                <button onClick={() => addToCart(product)} className="add-btn">Add to Cart</button>
              </div>
            </div>
          ))}
        </section>
      </main>
      
      <footer className="glass-footer">
        <p>&copy; 2026 TechStore Demo. Built for analytics demonstration.</p>
      </footer>
    </div>
  )
}

export default App
