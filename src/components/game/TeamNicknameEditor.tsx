import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, Check, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface TeamNicknameEditorProps {
  teamId: string
  teamNumber: number
  currentNickname?: string
  onNicknameUpdate: (nickname: string) => void
}

export function TeamNicknameEditor({ 
  teamId, 
  teamNumber, 
  currentNickname, 
  onNicknameUpdate 
}: TeamNicknameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [nickname, setNickname] = useState(currentNickname || '')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast({
        title: "Error",
        description: "Nickname cannot be empty",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/nickname`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nickname.trim() })
      })

      if (response.ok) {
        onNicknameUpdate(nickname.trim())
        setIsEditing(false)
        toast({
          title: "Success",
          description: "Team nickname updated!"
        })
      } else {
        throw new Error('Failed to update nickname')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team nickname",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setNickname(currentNickname || '')
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">Team {teamNumber} -</span>
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter team nickname"
          className="text-2xl font-bold border-2 border-blue-300 focus:border-blue-500"
          maxLength={50}
          disabled={isLoading}
        />
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isLoading || !nickname.trim()}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-bold">
        Team {teamNumber}{currentNickname ? ` - ${currentNickname}` : ''}
      </h1>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="opacity-60 hover:opacity-100"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
