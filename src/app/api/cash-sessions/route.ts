import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const sessions = [
    { id: 'session-001', cashier_name: 'Carlos Gómez', status: 'open', initial_balance: 100000 },
  ]

  const filtered = status ? sessions.filter(session => session.status === status) : sessions

  return NextResponse.json({
    success: true,
    data: filtered.length > 0 ? filtered[0] : null,
  })
}