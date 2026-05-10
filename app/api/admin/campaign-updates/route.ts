import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const campaignId = url.searchParams.get('campaignId')
  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId required' }, { status: 400 })
  }

  const updates = await prisma.campaignUpdate.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(updates)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { campaignId, title, content, imageUrl } = body ?? {}

  if (!campaignId || !title?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'campaignId, title, and content required' }, { status: 400 })
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, select: { id: true } })
  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  const update = await prisma.campaignUpdate.create({
    data: {
      campaignId,
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl?.trim() || null,
    },
  })

  return NextResponse.json(update, { status: 201 })
}
