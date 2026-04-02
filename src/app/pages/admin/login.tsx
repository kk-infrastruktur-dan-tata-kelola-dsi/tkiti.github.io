import { Helmet } from 'react-helmet-async'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { LoginForm } from '@/components/login-form'
import { getToken, isTokenExpired } from '@/app/lib/api'

export function AdminLogin() {
  const navigate = useNavigate()

  // Sudah login → langsung ke dashboard
  useEffect(() => {
    const token = getToken()
    if (token && !isTokenExpired(token)) {
      navigate('/admin', { replace: true })
    }
  }, [navigate])

  return (
    <div className='min-h-svh'>
      <Helmet>
        <title>Login Admin | TKITI</title>
        <link rel="icon" type="image/png" href="/images/logo.png" />
      </Helmet>
      <div className='relative grid min-h-svh bg-white lg:grid-cols-2'>
        {/* ── Kiri: Branding panel ────────────────────────────────────────── */}
        <div className='relative hidden lg:flex flex-col bg-zinc-900 p-12 text-white overflow-hidden'>
          <img
            src='https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80'
            alt='Admin background'
            className='absolute inset-0 h-full w-full object-cover opacity-30'
          />
          <div className='absolute inset-0 bg-zinc-950/70' />
          {/* Accent blob */}
          <div
            className='absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-20 blur-[100px] pointer-events-none z-0'
            style={{ background: 'rgba(62, 207, 178, 0.4)' }}
          />
          <div
            className='absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full opacity-10 blur-[80px] pointer-events-none z-0'
            style={{ background: 'rgba(62, 207, 178, 0.3)' }}
          />

          {/* Logo */}
          <div className='relative z-10 flex items-center gap-3'>
            <img src='/images/logo.png' alt='TKITI' className='w-9 h-9 rounded-xl border border-zinc-700 object-cover' />
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
        <div className='flex flex-col items-center justify-center bg-white p-6 md:p-10'>
          {/* Logo mobile (hanya tampil di bawah lg) */}
          <div className='mb-8 flex items-center gap-2 lg:hidden'>
            <img src='/images/logo.png' alt='TKITI' className='w-8 h-8 rounded-lg object-cover' />
            <span className='font-semibold text-gray-900 text-sm'>TKITI Admin</span>
          </div>

          <div className='w-full max-w-sm'>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
