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

    // Verificar se já está instalado
    const installed = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator && window.navigator.standalone === true)
    console.log('[PWA Install] Is installed:', installed, {
      displayMode: window.matchMedia('(display-mode: standalone)').matches,
      navigatorStandalone: window.navigator?.standalone
    })
    if (installed) {
      setIsInstalled(true)
      return
    }

    // Verificar se foi dispensado recentemente
    const dismissedTime = localStorage.getItem('pwa-install-dismissed')
    if (dismissedTime && Date.now() - parseInt(dismissedTime) < 7 * 24 * 60 * 60 * 1000) {
      console.log('[PWA Install] Was dismissed recently, not showing')
      return
    }

    let promptEvent = null

    // Detetar evento beforeinstallprompt (principalmente mobile/Android e Chrome desktop)
    const handleBeforeInstallPrompt = (e) => {
      console.log('[PWA Install] beforeinstallprompt event received')
      e.preventDefault()
      promptEvent = e
      setDeferredPrompt(e)
      setIsOpen(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Detetar browser
    const userAgent = navigator.userAgent
    const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor) && !/Edg/.test(userAgent)
    const isEdge = /Edg/.test(userAgent)
    const isOpera = /OPR/.test(userAgent)
    const isFirefox = /Firefox/.test(userAgent)
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
    
    console.log('[PWA Install] Browser detection:', { isChrome, isEdge, isOpera, isFirefox, isSafari, userAgent })

    // Se após 3 segundos não apareceu o evento e não é mobile, mostrar instruções manuais
    const timer = setTimeout(() => {
      console.log('[PWA Install] Timer fired, promptEvent:', !!promptEvent)
      if (!promptEvent && !mobile && !installed) {
        // Verificar se o browser suporta instalação manual
        if (isChrome || isEdge || isOpera || isFirefox) {
          console.log('[PWA Install] Showing manual instructions for:', { isChrome, isEdge, isOpera, isFirefox })
          setShowManualInstructions(true)
          setIsOpen(true)
        } else {
          console.log('[PWA Install] Browser not supported for PWA installation')
        }
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
      window.removeEventListener('pwa-install-show', handleShowEvent)
      clearTimeout(timer)
    }
  }, []) // Sem dependências para evitar loops

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
      setIsInstalled(true)
    } else {
      console.log('User dismissed the install prompt')
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
                <span>Instalar TheCore</span>
              </div>
            </ModalHeader>
            <ModalBody>
              {showManualInstructions ? (
                <div className="space-y-3">
                  <p className="text-default-600">
                    Para instalar a aplicação TheCore no seu computador:
                  </p>
                  {/Firefox/.test(navigator.userAgent) ? (
                    <ol className="list-decimal list-inside space-y-2 text-default-600 text-sm">
                      <li>Clique no ícone <strong>+</strong> (adicionar à barra de ferramentas) na barra de endereços</li>
                      <li>Ou vá ao menu do Firefox (☰) → "Mais ferramentas" → "Adicionar à barra de ferramentas"</li>
                      <li>Ou use o atalho: <kbd className="px-2 py-1 bg-default-100 rounded text-xs">Ctrl+Shift+A</kbd> para abrir o menu de extensões</li>
                      <li className="text-xs text-default-500 mt-2">
                        ⚠️ Nota: Firefox tem suporte limitado a PWAs. Para melhor experiência, recomendamos Chrome ou Edge.
                      </li>
                    </ol>
                  ) : (
                    <ol className="list-decimal list-inside space-y-2 text-default-600 text-sm">
                      <li>Procure o ícone de instalação <Icon icon="mdi:download" className="inline text-primary" /> na barra de endereços do browser (ao lado do URL)</li>
                      <li>Ou clique no menu do browser (⋮) e selecione "Instalar TheCore" ou "Instalar aplicação"</li>
                      <li>Ou use o atalho: <kbd className="px-2 py-1 bg-default-100 rounded text-xs">Ctrl+Shift+I</kbd> (Chrome DevTools) e procure a opção de instalação</li>
                    </ol>
                  )}
                  <p className="text-xs text-default-500 mt-3">
                    💡 A instalação permite acesso offline e uma experiência mais rápida.
                  </p>
                </div>
              ) : (
                <p className="text-default-600">
                  Instale a aplicação TheCore no seu dispositivo para uma experiência mais rápida e acesso offline.
                </p>
              )}
            </ModalBody>
            <ModalFooter>
              <div className="w-full flex justify-end gap-2">
                <Button 
                  variant="flat" 
                  aria-label="Dispensar instalação da aplicação"
                  onPress={() => {
                    handleDismiss()
                    onClose()
                  }}
                >
                  Agora não
                </Button>
                {deferredPrompt ? (
                  <Button 
                    color="primary" 
                    aria-label="Instalar aplicação TheCore"
                    onPress={() => {
                      handleInstall()
                      onClose()
                    }}
                  >
                    Instalar
                  </Button>
                ) : showManualInstructions ? (
                  <Button 
                    color="primary" 
                    aria-label="Fechar instruções de instalação"
                    onPress={() => {
                      handleDismiss()
                      onClose()
                    }}
                  >
                    Entendi
                  </Button>
                ) : (
                  <Button 
                    color="primary" 
                    aria-label="Instalar aplicação TheCore"
                    onPress={() => {
                      handleInstall()
                      onClose()
                    }}
                  >
                    Instalar
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

