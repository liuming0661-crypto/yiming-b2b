import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from './firebase-admin'
import { prisma } from './prisma'
import { UserStatus } from '@/lib/shared'

export interface AuthContext {
  firebaseUid: string
  userId: string
  email: string
  status: UserStatus
  isAdmin: boolean
}

const ADMIN_UIDS = (process.env.ADMIN_FIREBASE_UIDS ?? '').split(',').filter(Boolean)

type RouteHandler = (
  req: NextRequest,
  ctx: AuthContext,
) => Promise<NextResponse>

export function withAuth(handler: RouteHandler, requireActive = true) {
  return async (req: NextRequest, _routeCtx?: unknown): Promise<NextResponse> => {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let decoded: Awaited<ReturnType<typeof verifyIdToken>>
    try {
      decoded = await verifyIdToken(token)
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      select: { id: true, email: true, status: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (requireActive && user.status !== UserStatus.ACTIVE) {
      return NextResponse.json({ error: 'Account pending approval' }, { status: 403 })
    }

    const ctx: AuthContext = {
      firebaseUid: decoded.uid,
      userId: user.id,
      email: user.email,
      status: user.status as UserStatus,
      isAdmin: ADMIN_UIDS.includes(decoded.uid),
    }

    return handler(req, ctx)
  }
}

export function withAdmin(handler: RouteHandler) {
  return withAuth(async (req, ctx) => {
    if (!ctx.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return handler(req, ctx)
  }, false)
}
