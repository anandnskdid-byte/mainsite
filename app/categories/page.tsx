import { Suspense } from 'react'
import { CategoriesContent } from './categories-content'

export default function CategoriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading categories...</p>
      </div>
    }>
      <CategoriesContent />
    </Suspense>
  )
}
