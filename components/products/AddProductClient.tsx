'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth'
import { storage } from '@/lib/firebase/client'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/shared/Header'
import { BackButton } from '@/components/navigation/BackButton'
import { PRODUCT_CATEGORIES } from '@/lib/constants/categories'
import { AlertCircle, Upload } from 'lucide-react'
import { link } from 'fs'

export function AddProductClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [productUrl, setProductUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form on mount and pick up prefilled name from search params
  useEffect(() => {
    setName(searchParams.get('name') || '')
    setBrand('')
    setCategory('')
    setIngredients('')
    setProductUrl('')
    setImageFile(null)
    setImagePreview(null)
    setError('')
  }, [])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('You must be logged in to add a product')
      return
    }

    if (!name.trim()) {
      setError('Product name is required')
      return
    }

    if (!brand.trim()) {
      setError('Brand is required')
      return
    }

    if (!category) {
      setError('Category is required')
      return
    }

    if (!productUrl) {
      setError('Official product link is required')
      return
    }

    setLoading(true)

    try {
      const token = await user.getIdToken()

      // Generate the same ID the API will use so we can upload image first
      const productId = `${brand}_${name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')

      // Upload image first if provided
      let imageUrl: string | null = null
      if (imageFile) {
        const storageRef = ref(
          storage,
          `products/${productId}/${imageFile.name}`
        )
        await uploadBytes(storageRef, imageFile)
        imageUrl = await getDownloadURL(storageRef)
      }

      // Submit everything in one call
      const res = await fetch('/api/products/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          brand,
          category,
          ingredients,
          affiliate_url: productUrl,
          image_url: imageUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit product')
        return
      }

      if (data.duplicate) {
        router.push(`/products/${data.existingProductId}`)
        return
      }

      router.push(`/products/${data.productId}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="container mx-auto px-4 pt-4">
        <BackButton />
      </div>

      <div className="container mx-auto px-4 pt-4 text-center">
        <h1 className="mb-2 text-3xl font-bold">Add a Product</h1>
        <p className="text-muted-foreground">
          Can't find a product in our database? Add it and it will be available
          to you right away.
        </p>
      </div>

      <div className="container mx-auto max-w-xl px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Glossing Shampoo"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="brand">Brand *</Label>
            <Input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. 100 Pure"
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ingredients">
              Ingredients{' '}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="ingredients"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              placeholder="Water, Glycerin, Coconut Oil, ..."
              rows={4}
            />
            <p className="text-muted-foreground text-xs">
              Paste the ingredient list separated by commas. Adding ingredients
              improves your match score.
            </p>
          </div>

          <div className="space-y-1">
            <Label htmlFor="product_url">Official Product Link* </Label>
            <Input
              id="product_url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-1">
            <Label>
              Product Image{' '}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <label
              htmlFor="image_upload"
              className="border-input hover:bg-accent flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 transition-colors"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 object-contain"
                />
              ) : (
                <div className="text-muted-foreground flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">Click to upload an image</span>
                </div>
              )}
              <input
                id="image_upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
            </label>
          </div>

          {error && (
            <div className="text-destructive flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              !name.trim() ||
              !brand.trim() ||
              !category ||
              !productUrl.trim()
            }
          >
            {loading ? 'Submitting...' : 'Add Product'}
          </Button>
        </form>
      </div>
    </div>
  )
}
