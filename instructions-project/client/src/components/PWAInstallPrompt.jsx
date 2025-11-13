import React, { useState, useEffect, useRef } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'
import { Icon } from '@iconify/react'

// Funções globais para controlo manual (disponíveis imediatamente)
if (typeof window !== 'undefined') {
  window.showPWAInstall = () => {
    console.log('[PWA Install] Manual trigger via window.showPWAInstall()')
    localStorage.removeItem('pwa-install-dismissed')
    // Disparar evento customizado para o componente ouvir
    window.dispatchEvent(new CustomEvent('pwa-install-show'))
  }
  window.clearPWAInstallDismiss = () => {
    console.log('[PWA Install] Clearing dismissed preference')
    localStorage.removeItem('pwa-install-dismissed')
    console.log('[PWA Install] Cleared! Reload the page to see the prompt again.')
  }
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showManualInstructions, setShowManualInstructions] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [safariType, setSafariType] = useState(null) // 'ios' | 'macos' | null

  useEffect(() => {
    // Debug logging
    console.log('[PWA Install] Component mounted')
    
    // Detetar se é mobile
    const checkMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.matchMedia && window.matchMedia('(max-width: 768px)').matches)
    }
    const mobile = checkMobile()
    setIsMobile(mobile)
    console.log('[PWA Install] Is mobile:', mobile)

    // Função melhorada para verificar se já está instalado
    const checkIfInstalled = async () => {
      // Método 1: Verificar display-mode standalone (funciona quando app está rodando em modo standalone)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      
      // Método 2: iOS Safari standalone
      const isIOSStandalone = window.navigator && window.navigator.standalone === true
      
      // Método 3: Verificar se está em modo fullscreen (outro indicador de PWA instalado)
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches
      
      // Método 4: Verificar se o PWA está instalado usando getInstalledRelatedApps (Android)
      let isInstalledViaAPI = false
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await navigator.getInstalledRelatedApps()
          console.log('[PWA Install] Installed related apps:', relatedApps)
          // Se encontrar apps relacionados, provavelmente está instalado
          isInstalledViaAPI = relatedApps && relatedApps.length > 0
        } catch (error) {
          console.log('[PWA Install] Error checking installed apps:', error)
        }
      }
      
      // Método 5: Verificar se o evento beforeinstallprompt não aparece (indica que já foi instalado)
      // Isso será verificado mais tarde no código
      
      // Método 6: Verificar localStorage para flag de instalação (se o usuário já instalou antes)
      const wasInstalledBefore = localStorage.getItem('pwa-installed') === 'true'
      
      const installed = isStandalone || isIOSStandalone || isFullscreen || isInstalledViaAPI || wasInstalledBefore
      
      console.log('[PWA Install] Installation check:', {
        isStandalone,
        isIOSStandalone,
        isFullscreen,
        isInstalledViaAPI,
        wasInstalledBefore,
        finalInstalled: installed
      })
      
      return installed
    }

    // Verificar se já está instalado
    let wasInstalledInitially = false
    checkIfInstalled().then(installed => {
      wasInstalledInitially = installed
      if (installed) {
        console.log('[PWA Install] PWA already installed - hiding prompt')
        setIsInstalled(true)
        return
      }
    })

    // Verificar se foi dispensado recentemente
    const dismissedTime = localStorage.getItem('pwa-install-dismissed')
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      console.log('[PWA Install] Was dismissed recently, not showing')
      return
    }

    let promptEvent = null
    let promptEventTimeout = null

    // Detetar evento beforeinstallprompt (principalmente mobile/Android e Chrome desktop)
    const handleBeforeInstallPrompt = (e) => {
      console.log('[PWA Install] beforeinstallprompt event received')
      e.preventDefault()
      promptEvent = e
      setDeferredPrompt(e)
      
      // Se o evento apareceu, significa que ainda não está instalado
      // Limpar qualquer flag de instalação anterior (pode ter sido removido)
      localStorage.removeItem('pwa-installed')
      
      setIsOpen(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // No Android, se o evento beforeinstallprompt não aparecer após alguns segundos,
    // pode indicar que o PWA já está instalado (o evento não dispara se já estiver instalado)
    // Mas isso não é 100% confiável, então vamos usar como indicador adicional
    promptEventTimeout = setTimeout(() => {
      if (!promptEvent && !wasInstalledInitially) {
        // Verificar novamente se está instalado (pode ter mudado)
        checkIfInstalled().then(installed => {
          if (installed) {
            console.log('[PWA Install] Detected as installed after timeout check')
            setIsInstalled(true)
          }
        })
      }
    }, 5000) // Aguardar 5 segundos para dar tempo ao evento aparecer

    // Detetar browser
    const userAgent = navigator.userAgent
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor) && !/Edg/.test(userAgent)
    const isEdge = /Edg/.test(userAgent)
    const isOpera = /OPR/.test(userAgent)
    const isFirefox = /Firefox/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
    
    // Detetar tipo de Safari (iOS ou macOS)
    let safariTypeDetected = null
    if (isSafari) {
      const isIOS = /iPhone|iPad|iPod/.test(userAgent) && navigator.standalone !== undefined
      const isMacOS = /Macintosh|Mac OS X/.test(userAgent) && !isIOS
      if (isIOS) {
        safariTypeDetected = 'ios'
      } else if (isMacOS) {
        safariTypeDetected = 'macos'
      }
      setSafariType(safariTypeDetected)
    }
    
    console.log('[PWA Install] Browser detection:', { isChrome, isEdge, isOpera, isFirefox, isSafari, safariType: safariTypeDetected, userAgent })
    
    // Verificar HTTPS (apenas para debug/aviso)
    const isHTTPS = window.location.protocol === 'https:' || window.location.hostname === 'localhost'
    if (isSafari && !isHTTPS && window.location.hostname !== 'localhost') {
      console.warn('[PWA Install] Safari requires HTTPS for PWA installation. Current protocol:', window.location.protocol)
    }

    // Listener para quando o PWA é instalado (dispara após instalação bem-sucedida)
    const handleAppInstalled = () => {
      console.log('[PWA Install] PWA was installed successfully!')
      localStorage.setItem('pwa-installed', 'true')
      setIsInstalled(true)
      setIsOpen(false)
      setDeferredPrompt(null)
    }
    
    window.addEventListener('appinstalled', handleAppInstalled)
    
    // Listener para mudanças no display-mode (útil quando o usuário abre o PWA instalado)
    const handleDisplayModeChange = (e) => {
      console.log('[PWA Install] Display mode changed:', e.matches)
      if (e.matches) {
        // Modo standalone detectado - PWA está instalado e rodando
        localStorage.setItem('pwa-installed', 'true')
        setIsInstalled(true)
        setIsOpen(false)
      }
    }
    
    const displayModeQuery = window.matchMedia('(display-mode: standalone)')
    if (displayModeQuery.addEventListener) {
      displayModeQuery.addEventListener('change', handleDisplayModeChange)
    } else {
      // Fallback para browsers mais antigos
      displayModeQuery.addListener(handleDisplayModeChange)
    }
    
    // Verificar imediatamente se está em modo standalone
    if (displayModeQuery.matches) {
      localStorage.setItem('pwa-installed', 'true')
      setIsInstalled(true)
    }

    // Se após 3 segundos não apareceu o evento, mostrar instruções manuais
    const timer = setTimeout(() => {
      console.log('[PWA Install] Timer fired, promptEvent:', !!promptEvent)
      if (!promptEvent && !wasInstalledInitially) {
        // Verificar novamente se está instalado antes de mostrar instruções
        checkIfInstalled().then(installed => {
          if (installed) {
            console.log('[PWA Install] Detected as installed - not showing manual instructions')
            setIsInstalled(true)
            return
          }
          
          // Verificar se o browser suporta instalação manual
          if (isChrome || isEdge || isOpera || isFirefox || isSafari) {
            console.log('[PWA Install] Showing manual instructions for:', { isChrome, isEdge, isOpera, isFirefox, isSafari, safariType: safariTypeDetected })
            setShowManualInstructions(true)
            setIsOpen(true)
          } else {
            console.log('[PWA Install] Browser not supported for PWA installation')
          }
        })
      }
    }, 3000)

    // Ouvir evento customizado para mostrar manualmente
    const handleShowEvent = () => {
      console.log('[PWA Install] Received show event - opening modal')
      setShowManualInstructions(true)
      setIsOpen(true)
      console.log('[PWA Install] State updated, isOpen should be true')
    }
    
    window.addEventListener('pwa-install-show', handleShowEvent)
    console.log('[PWA Install] Event listener registered for pwa-install-show')

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('pwa-install-show', handleShowEvent)
      
      // Remover listener do display-mode
      const displayModeQuery = window.matchMedia('(display-mode: standalone)')
      if (displayModeQuery.removeEventListener) {
        displayModeQuery.removeEventListener('change', handleDisplayModeChange)
      } else {
        displayModeQuery.removeListener(handleDisplayModeChange)
      }
      
      clearTimeout(timer)
      if (promptEventTimeout) {
        clearTimeout(promptEventTimeout)
      }
    }
  }, []) // Sem dependências para evitar loops

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('[PWA Install] User accepted the install prompt')
      // Marcar como instalado no localStorage
      // O evento 'appinstalled' também será disparado, mas marcamos aqui também para garantir
      localStorage.setItem('pwa-installed', 'true')
      setIsInstalled(true)
    } else {
      console.log('[PWA Install] User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setIsOpen(false)
  }

  const handleDismiss = () => {
    setIsOpen(false)
    // Guardar preferência para não mostrar novamente por algum tempo (7 dias)
    const dismissedTime = Date.now().toString()
    localStorage.setItem('pwa-install-dismissed', dismissedTime)
    console.log('[PWA Install] Preference saved - will not show again for 7 days')
    console.log('[PWA Install] To clear: window.clearPWAInstallDismiss()')
  }

  // Debug: verificar estado antes de renderizar
  console.log('[PWA Install] Render check:', { isInstalled, isOpen, showManualInstructions })

  // Não mostrar se já estiver instalado
  if (isInstalled) {
    console.log('[PWA Install] Not rendering - already installed')
    return null
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={setIsOpen}
      size="sm" 
      placement="center"
      hideCloseButton
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Icon icon="mdi:download" className="text-2xl text-primary" />
                <span>Install TheCore</span>
              </div>
            </ModalHeader>
            <ModalBody>
              {showManualInstructions ? (
                <div className="space-y-3">
                  {safariType === 'ios' ? (
                    <>
                      <p className="text-default-600">
                        To install TheCore on your iPhone/iPad:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-default-600 text-sm">
                        <li>Tap the Share button (↗) at the bottom of Safari</li>
                        <li>Scroll down and tap "Add to Home Screen"</li>
                        <li>Tap "Add" to confirm</li>
                      </ol>
                      <p className="text-xs text-default-500 mt-3">
                        💡 Once installed, TheCore will work offline and launch like a native app.
                      </p>
                    </>
                  ) : safariType === 'macos' ? (
                    <>
                      <p className="text-default-600">
                        To install TheCore on your Mac:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-default-600 text-sm">
                        <li>Click the Share button (↗) in the Safari toolbar</li>
                        <li>Select "Add to Dock"</li>
                      </ol>
                      <p className="text-xs text-default-400 mt-2">
                        Or alternatively: Go to File → Add to Dock
                      </p>
                      <p className="text-xs text-default-500 mt-3">
                        💡 Once installed, TheCore will work offline and launch like a native app.
                      </p>
                    </>
                  ) : /Firefox/.test(navigator.userAgent) ? (
                    <>
                      <p className="text-default-600">
                        To install TheCore on your computer:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-default-600 text-sm">
                        <li>Click the <strong>+</strong> icon (add to toolbar) in the address bar</li>
                        <li>Or open the Firefox menu (☰) → "More tools" → "Add to toolbar"</li>
                        <li>Or use the shortcut: <kbd className="px-2 py-1 bg-default-100 rounded text-xs">Ctrl+Shift+A</kbd> to open the extensions menu</li>
                        <li className="text-xs text-default-500 mt-2">
                          ⚠️ Note: Firefox has limited PWA support. For the best experience, we recommend Chrome or Edge.
                        </li>
                      </ol>
                      <p className="text-xs text-default-500 mt-3">
                        💡 Installing gives you offline access and a faster experience.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-default-600">
                        To install TheCore on your computer:
                      </p>
                      <ol className="list-decimal list-inside space-y-2 text-default-600 text-sm">
                        <li>Look for the install icon <Icon icon="mdi:download" className="inline text-primary" /> in your browser's address bar (next to the URL)</li>
                        <li>Or open the browser menu (⋮) and select "Install TheCore" or "Install app"</li>
                        <li>Or use the shortcut: <kbd className="px-2 py-1 bg-default-100 rounded text-xs">Ctrl+Shift+I</kbd> (Chrome DevTools) and look for the install option</li>
                      </ol>
                      <p className="text-xs text-default-500 mt-3">
                        💡 Installing gives you offline access and a faster experience.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-default-600">
                  Install TheCore on your device for a faster experience and offline access.
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <div className="w-full flex justify-end gap-2">
                <Button 
                  variant="flat" 
                  aria-label="Dismiss app installation prompt"
                  onPress={() => {
                    handleDismiss()
                    onClose()
                  }}
                >
                  Not now
                </Button>
                {deferredPrompt ? (
                  <Button 
                    color="primary" 
                    aria-label="Install TheCore app"
                    onPress={() => {
                      handleInstall()
                      onClose()
                    }}
                  >
                    Install
                  </Button>
                ) : showManualInstructions ? (
                  <Button 
                    color="primary" 
                    aria-label="Close installation instructions"
                    onPress={() => {
                      handleDismiss()
                      onClose()
                    }}
                  >
                    Got it
                  </Button>
                ) : (
                  <Button 
                    color="primary" 
                    aria-label="Install TheCore app"
                    onPress={() => {
                      handleInstall()
                      onClose()
                    }}
                  >
                    Install
                  </Button>
                )}
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

