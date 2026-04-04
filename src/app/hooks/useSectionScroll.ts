import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router'

/**
 * Shared hook for scrolling to sections on the home page
 * Handles both same-page scrolling and cross-page navigation
 */
export function useSectionScroll(navOffset = 80) {
  const navigate = useNavigate()
  const location = useLocation()

  const scrollToSection = useCallback((sectionId: string) => {
    // If we're already on the home page, just scroll to the section
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId)
      if (element) {
        const offsetTop = element.offsetTop - navOffset
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        })
      }
    } else {
      // If we're on a different page, navigate to home first, then scroll
      navigate(`/${sectionId}`)
      // Scroll after navigation completes
      setTimeout(() => {
        const element = document.getElementById(sectionId)
        if (element) {
          const offsetTop = element.offsetTop - navOffset
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }, [location.pathname, navigate, navOffset])

  return { scrollToSection, location }
}
