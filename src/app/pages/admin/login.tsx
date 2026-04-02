import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Moon, Sun } from 'lucide-react'
import { LoginForm } from '@/components/login-form'
import { Button } from '@/app/components/ui/button'
import { cn } from '@/app/components/ui/utils'
import { getToken, isTokenExpired } from '@/app/lib/api'

export function AdminLogin() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => localStorage.getItem('admin_dark') === 'true')

  // Sudah login → langsung ke dashboard
  useEffect(() => {
    const token = getToken()
    if (token && !isTokenExpired(token)) {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  function toggleDark() {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem('admin_dark', String(next))
      return next
    })
  }

  return (
    <div className={cn('min-h-svh', isDark && 'dark')}>
      <div className='relative grid min-h-svh bg-white dark:bg-zinc-950 lg:grid-cols-2'>

        {/* Dark mode toggle — pojok kanan atas */}
        <div className='absolute top-4 right-4 z-10'>
          <Button
            variant='ghost'
            size='icon'
            onClick={toggleDark}
            className='h-9 w-9 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className='h-4 w-4' /> : <Moon className='h-4 w-4' />}
          </Button>
        </div>

        {/* ── Kiri: Branding panel ────────────────────────────────────────── */}
        <div className='relative hidden lg:flex flex-col bg-zinc-900 dark:bg-zinc-950 p-12 text-white overflow-hidden'>
          {/* Accent blob */}
          <div
            className='absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none'
            style={{ background: 'rgba(62, 207, 178, 0.4)' }}
          />
          <div
            className='absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none'
            style={{ background: 'rgba(62, 207, 178, 0.3)' }}
          />

          {/* Logo */}
          <div className='relative z-10 flex items-center gap-3'>
            <div className='w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center'>
              <span className='text-[#3ECFB2] font-bold text-sm font-mono'>TK</span>
            </div>
            <span className='font-semibold text-white/90 tracking-wide text-sm'>TKITI</span>
          </div>

          {/* Quote / tagline */}
          <div className='relative z-10 mt-auto'>
            <p className='text-2xl font-semibold leading-snug text-white/90'>
              Laboratorium Tata Kelola &amp; Infrastruktur
              <br />
              <span style={{ color: '#3ECFB2' }}>Teknologi Informasi</span>
            </p>
            <p className='mt-4 text-sm text-white/50 leading-relaxed'>
              Departemen Sistem Informasi · Fakultas Teknologi Informasi
              <br />
              Universitas Andalas
            </p>
          </div>
        </div>

        {/* ── Kanan: Form ─────────────────────────────────────────────────── */}
        <div className='flex flex-col items-center justify-center bg-white dark:bg-zinc-950 p-6 md:p-10'>
          {/* Logo mobile (hanya tampil di bawah lg) */}
          <div className='mb-8 flex items-center gap-2 lg:hidden'>
            <div className='w-8 h-8 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center'>
              <span className='text-[#3ECFB2] font-bold text-xs font-mono'>TK</span>
            </div>
            <span className='font-semibold text-gray-900 dark:text-gray-100 text-sm'>TKITI Admin</span>
          </div>

          <div className='w-full max-w-sm'>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
