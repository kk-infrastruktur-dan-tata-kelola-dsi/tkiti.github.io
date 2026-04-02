import { useState } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/app/components/ui/utils'
import { Button } from '@/app/components/ui/button'
import { Input } from '@/app/components/ui/input'
import { Label } from '@/app/components/ui/label'
import { apiRequest, setToken } from '@/app/lib/api'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await apiRequest<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })

      if (!res.success || !res.data?.token) {
        setError(res.error ?? 'Username atau password salah')
        return
      }

      setToken(res.data.token)
      navigate('/admin', { replace: true })
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      {/* Header */}
      <div className='flex flex-col items-center gap-2 text-center'>
        <h1 className='text-2xl font-bold text-gray-900'>Masuk ke akun Anda</h1>
        <p className='text-gray-500 text-sm text-balance'>
          Masukkan username dan password untuk melanjutkan
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className='grid gap-4'>
        <div className='grid gap-1.5'>
          <Label htmlFor='username'>Username</Label>
          <Input
            id='username'
            type='text'
            autoComplete='username'
            autoFocus
            placeholder='admin'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className='bg-white text-gray-900 placeholder:text-gray-400'
            required
          />
        </div>

        <div className='grid gap-1.5'>
          <Label htmlFor='password'>Password</Label>
          <Input
            id='password'
            type='password'
            autoComplete='current-password'
            placeholder='••••••••'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className='bg-white text-gray-900 placeholder:text-gray-400'
            required
          />
        </div>

        {error && (
          <p className='text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2'>
            {error}
          </p>
        )}

        <Button type='submit' className='w-full' disabled={loading}>
          {loading ? 'Masuk...' : 'Masuk'}
        </Button>
      </form>
    </div>
  )
}
