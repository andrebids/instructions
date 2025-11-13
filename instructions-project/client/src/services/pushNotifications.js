/**
 * Serviço para gerir Push Notifications
 * Requer configuração no servidor para enviar notificações
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

/**
 * Converte a VAPID public key para formato Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Verifica se o browser suporta Push Notifications
 */
export function isPushNotificationSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

/**
 * Verifica se já tem permissão para notificações
 */
export function getNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }
  return Notification.permission
}

/**
 * Pede permissão para notificações
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    throw new Error('Este browser não suporta notificações')
  }

  const permission = await Notification.requestPermission()
  return permission
}

/**
 * Subscribir ao service worker para receber push notifications
 */
export async function subscribeToPushNotifications() {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications não são suportadas neste browser')
  }

  const registration = await navigator.serviceWorker.ready

  if (!VAPID_PUBLIC_KEY) {
    console.warn('VITE_VAPID_PUBLIC_KEY não está configurada')
    return null
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    return subscription
  } catch (error) {
    console.error('Erro ao subscrever push notifications:', error)
    throw error
  }
}

/**
 * Enviar subscription para o servidor
 */
export async function sendSubscriptionToServer(subscription) {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription)
    })

    if (!response.ok) {
      throw new Error('Erro ao enviar subscription para o servidor')
    }

    return await response.json()
  } catch (error) {
    console.error('Erro ao enviar subscription:', error)
    throw error
  }
}

/**
 * Cancelar subscription de push notifications
 */
export async function unsubscribeFromPushNotifications() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (subscription) {
    await subscription.unsubscribe()
    
    // Notificar servidor
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      })
    } catch (error) {
      console.error('Erro ao notificar servidor sobre unsubscribe:', error)
    }

    return true
  }

  return false
}

/**
 * Verificar se já está subscrito
 */
export async function isSubscribed() {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return subscription !== null
}

/**
 * Inicializar push notifications (pedir permissão e subscrever)
 */
export async function initializePushNotifications() {
  try {
    // Verificar suporte
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications não são suportadas')
    }

    // Verificar permissão
    let permission = getNotificationPermission()
    
    if (permission === 'default') {
      permission = await requestNotificationPermission()
    }

    if (permission !== 'granted') {
      throw new Error('Permissão de notificações negada')
    }

    // Verificar se já está subscrito
    if (await isSubscribed()) {
      console.log('Já está subscrito a push notifications')
      return true
    }

    // Subscrever
    const subscription = await subscribeToPushNotifications()
    
    if (subscription) {
      // Enviar para o servidor
      await sendSubscriptionToServer(subscription)
      console.log('Subscrito a push notifications com sucesso')
      return true
    }

    return false
  } catch (error) {
    console.error('Erro ao inicializar push notifications:', error)
    throw error
  }
}

/**
 * Configurar listener para receber notificações quando a app está em foreground
 */
export function setupNotificationClickListener() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        // Mostrar notificação mesmo quando a app está aberta
        if (Notification.permission === 'granted') {
          new Notification(event.data.title || 'TheCore', {
            body: event.data.body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: event.data.tag || 'thecore-notification'
          })
        }
      }
    })
  }
}

