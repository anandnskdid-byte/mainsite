// Run this script to create initial categories
import { database } from '../lib/firebase.js'
import { ref, set } from 'firebase/database'

async function createCategories() {
  try {
    const categories = {
      cement: {
        name: 'Cement',
        description: 'All types of cement for construction'
      },
      plaster: {
        name: 'Wall Plaster',
        description: 'Wall plaster and finishing materials'
      },
      tiles: {
        name: 'Tiles',
        description: 'Floor and wall tiles'
      },
      paint: {
        name: 'Paint',
        description: 'Interior and exterior paints'
      },
      hardware: {
        name: 'Hardware',
        description: 'Construction hardware and tools'
      }
    }
    
    await set(ref(database, 'categories'), categories)
    console.log('Categories created successfully!')
    
  } catch (error) {
    console.error('Error creating categories:', error)
  }
}

createCategories()
