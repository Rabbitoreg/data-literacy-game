import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { teamId: string } }
) {
  try {
    const { name } = await request.json()
    const teamId = params.teamId

    if (!name || !teamId) {
      return NextResponse.json({ error: 'Name and team ID required' }, { status: 400 })
    }

    // Get current team
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Add member to team if not already present
    const currentMembers = team.members || []
    if (!currentMembers.includes(name)) {
      const updatedMembers = [...currentMembers, name]
      
      await prisma.team.update({
        where: { id: teamId },
        data: { 
          members: updatedMembers,
          // Initialize decider order if empty
          deciderOrder: team.deciderOrder?.length ? team.deciderOrder : updatedMembers
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adding team member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
