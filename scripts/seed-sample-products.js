// Run this script to create sample products
import { database } from '../lib/firebase.js'
import { ref, push, set } from 'firebase/database'

async function createSampleProducts() {
  try {
    const sampleProducts = [
      {
        name: 'Premium Cement 50kg',
        description: 'High quality OPC cement suitable for all construction needs',
        price: 450,
        stock: 100,
        category: 'cement',
        sellerId: 'sample-seller-1',
        images: ['/cement-bag.png'],
        createdAt: Date.now()
      },
      {
        name: 'Wall Plaster Ready Mix',
        description: 'Ready to use wall plaster for smooth finishing',
        price: 280,
        stock: 50,
        category: 'plaster',
        sellerId: 'sample-seller-1',
        images: ['/wall-plaster.png'],
        createdAt: Date.now()
      },
      {
        name: 'Ceramic Floor Tiles',
        description: 'Premium ceramic tiles for flooring - 2x2 feet',
        price: 85,
        stock: 200,
        category: 'tiles',
        sellerId: 'sample-seller-2',
        images: ['/ceramic-tiles-collection.png'],
        createdAt: Date.now()
      },
      {
        name: 'Exterior Paint 20L',
        description: 'Weather resistant exterior paint for long lasting finish',
        price: 1200,
        stock: 25,
        category: 'paint',
        sellerId: 'sample-seller-2',
        images: ['/paint-bucket.png'],
        createdAt: Date.now()
      }
    ]
    
    const productsRef = ref(database, 'products')
    
    for (const product of sampleProducts) {
      const newProductRef = push(productsRef)
      await set(newProductRef, product)
    }
    
    console.log('Sample products created successfully!')
    
  } catch (error) {
    console.error('Error creating sample products:', error)
  }
}

createSampleProducts()
