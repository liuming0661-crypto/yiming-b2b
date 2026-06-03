import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'

export const GET = withAuth(async (_req, ctx) => {
  return NextResponse.json({
    data: {
      userId: ctx.userId,
      email: ctx.email,
      status: ctx.status,
      isAdmin: ctx.isAdmin,
    },
  })
}, false)
