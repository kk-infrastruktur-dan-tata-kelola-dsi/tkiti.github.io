import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router'
import { Toaster } from 'sonner'
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ImageIcon,
  Users,
  LogOut,
  Moon,
  Sun,
  Menu,
} from 'lucide-react'

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from '@/app/components/ui/sidebar'
import { Button } from '@/app/components/ui/button'
import { Separator } from '@/app/components/ui/separator'
import { cn } from '@/app/components/ui/utils'
import { getToken, isTokenExpired, clearToken, getUsername } from '@/app/lib/api'

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Konten',    icon: FileText,        href: '/admin/content' },
  { label: 'Artikel',   icon: BookOpen,        href: '/admin/articles' },
  { label: 'Gallery',   icon: ImageIcon,       href: '/admin/gallery' },
  { label: 'Struktur',  icon: Users,           href: '/admin/struktur' },
]

// ─── Sidebar nav ──────────────────────────────────────────────────────────────
function AdminSidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation()
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 dark:border-zinc-800">
      {/* Logo */}
      <SidebarHeader className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-zinc-800">
        <Link to="/admin" className="flex items-center gap-2.5 min-w-0">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
            <span className="text-[#3ECFB2] text-xs font-bold font-mono">TK</span>
          </div>
          {!isCollapsed && (
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              TKITI Admin
            </span>
          )}
        </Link>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="py-3">
        <SidebarMenu>
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.href)

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    'mx-2 rounded-lg',
                    isActive
                      ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-800 dark:hover:text-gray-100',
                  )}
                >
                  <Link to={item.href}>
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer — logout */}
      <SidebarFooter className="border-t border-gray-200 dark:border-zinc-800 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              tooltip="Logout"
              className="mx-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function AdminHeader({
  isDark,
  onToggleDark,
  username,
}: {
  isDark: boolean
  onToggleDark: () => void
  username: string
}) {
  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
          <Menu className="h-4 w-4" />
        </SidebarTrigger>
        <Separator orientation="vertical" className="h-5 mx-1" />
        {/* Breadcrumb placeholder — akan diisi per halaman */}
        <span className="text-sm text-gray-500 dark:text-gray-400">Panel Admin</span>
      </div>

      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDark}
          className="h-8 w-8 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User badge */}
        {username && (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-zinc-700">
            <div className="w-7 h-7 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white dark:text-zinc-900 uppercase">
                {username.slice(0, 2)}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
              {username}
            </span>
          </div>
        )}
      </div>
    </header>
  )
}

// ─── AdminLayout ──────────────────────────────────────────────────────────────
export function AdminLayout() {
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(() => localStorage.getItem('admin_dark') === 'true')
  const [username, setUsername] = useState('')

  // Auth guard
  useEffect(() => {
    const token = getToken()
    if (!token || isTokenExpired(token)) {
      clearToken()
      navigate('/admin/login', { replace: true })
      return
    }
    setUsername(getUsername())
  }, [navigate])

  // Persist dark mode pref
  function toggleDark() {
    setIsDark((prev) => {
      const next = !prev
      localStorage.setItem('admin_dark', String(next))
      return next
    })
  }

  function handleLogout() {
    clearToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    // Wrapper ini berdiri sendiri dari landing page.
    // bg-white / dark:bg-zinc-950 override body dark (#070809).
    // `.dark` class di sini mengaktifkan dark: variant Tailwind v4
    // via @custom-variant dark (&:is(.dark *)).
    <div className={cn('min-h-screen bg-white text-gray-900', isDark && 'dark')}>
      <div className="bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100 min-h-screen">
        <SidebarProvider defaultOpen={true}>
          <AdminSidebar onLogout={handleLogout} />

          <SidebarInset className="flex flex-col min-h-screen bg-gray-50 dark:bg-zinc-900">
            <AdminHeader
              isDark={isDark}
              onToggleDark={toggleDark}
              username={username}
            />

            {/* Page content */}
            <main className="flex-1 p-6 overflow-auto">
              <Outlet />
            </main>
          </SidebarInset>
        </SidebarProvider>
      </div>

      {/* Toaster untuk Sonner — di luar SidebarProvider agar selalu visible */}
      <Toaster
        position="top-right"
        theme={isDark ? 'dark' : 'light'}
        richColors
      />
    </div>
  )
}
