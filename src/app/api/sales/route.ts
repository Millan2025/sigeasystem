import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'

const createSaleSchema = z.object({
  sessionId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().positive()
  })).min(1),
  paymentMethod: z.enum(['Efectivo', 'Nequi', 'Daviplata', 'Tarjeta', 'Transferencia']),
  customerName: z.string().optional()
})

type ProductWithRecipes = {
  id: string
  name: string
  price: number
  stock: number
  isRecipe: boolean
  recipes: Array<{
    ingredientId: string
    quantityRequired: number
    ingredient: {
      id: string
      name: string
      stock: number
    }
  }>
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = createSaleSchema.safeParse(body)
    
    if (!parsed.success) {
      return Response.json({ success: false, error: 'Datos invalidos' }, { status: 400 })
    }

    const { sessionId, items, paymentMethod, customerName } = parsed.data

    const session = await prisma.cashSession.findFirst({ 
      where: { id: sessionId, status: 'open' } 
    })
    if (!session) {
      return Response.json({ success: false, error: 'Caja no abierta' }, { status: 400 })
    }

    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({ 
      where: { id: { in: productIds } }, 
      include: { recipes: { include: { ingredient: true } } } 
    }) as unknown as ProductWithRecipes[]

    let totalAmount = 0
    const saleItems: Array<{ productId: string; quantity: number; priceAtSale: number; subtotal: number }> = []

    for (const item of items) {
      const product = products.find((p: ProductWithRecipes) => p.id === item.productId)
      if (!product) {
        return Response.json({ success: false, error: 'Producto no encontrado' }, { status: 404 })
      }
      
      const subtotal = product.price * item.quantity
      saleItems.push({ 
        productId: product.id, 
        quantity: item.quantity, 
        priceAtSale: product.price, 
        subtotal 
      })
      totalAmount += subtotal

      if (product.isRecipe) {
        for (const recipe of product.recipes) {
          const required = recipe.quantityRequired * item.quantity
          if (recipe.ingredient.stock < required) {
            return Response.json({ success: false, error: 'Stock insuficiente de ' + recipe.ingredient.name }, { status: 409 })
          }
          await prisma.ingredient.update({ 
            where: { id: recipe.ingredientId }, 
            data: { stock: { decrement: required } } 
          })
        }
      } else {
        if (product.stock < item.quantity) {
          return Response.json({ success: false, error: 'Stock insuficiente' }, { status: 409 })
        }
        await prisma.product.update({ 
          where: { id: product.id }, 
          data: { stock: { decrement: item.quantity } } 
        })
      }
    }

    const sale = await prisma.sale.create({
      data: { 
        sessionId, 
        customerName: customerName || 'Cliente General', 
        totalAmount, 
        paymentMethod, 
        items: { create: saleItems } 
      },
      include: { items: true }
    })

    return Response.json({ success: true, data: sale }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error'
    return Response.json({ success: false, error: message }, { status: 500 })
  }
}
