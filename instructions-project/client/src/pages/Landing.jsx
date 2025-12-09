import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { useTranslation } from 'react-i18next'
import LiquidEther from '../components/ui/LiquidEther'
import GlassSurface from '../components/ui/GlassSurface'
import ShinyText from '../components/ui/ShinyText'
import TextType from '../components/ui/TextType'
import SplitText from '../components/ui/SplitText'
import FadeContent from '../components/ui/FadeContent'

export default function Landing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const useAuthJs = import.meta.env.VITE_USE_AUTH_JS === 'true'
  // Sempre chamar o hook, mas apenas usar quando Auth.js estiver ativo
  const authJsHook = useAuth()
  const signIn = useAuthJs ? authJsHook.signIn : null
  const sectionRef = React.useRef(null)
  const [showSubtitle, setShowSubtitle] = React.useState(false)
  const [showButton, setShowButton] = React.useState(false)
  const etherColors = React.useMemo(() => ['#5227FF', '#FF9FFC', '#B19EEF'], [])

  const handleAuthJsSignIn = async (e) => {
    e.preventDefault()
    // Redirecionar para página de sign-in (email/password)
    navigate('/sign-in')
  }

  // Typing configuration (requested: 45ms per char)
  const speed = 45; // ms per char
  const l1a = t('pages.landing.welcomeTo')
  const l1b = t('pages.landing.theCore')
  const l2a = t('pages.landing.lets')
  const l2b = t('pages.landing.create')
  const l2c = t('pages.landing.somethingGreat')
  const subtitleText = t('pages.landing.signInSubtitle')

  // Buffers between segments to taste
  const buf1 = 150; // after l1a
  const buf2 = 200; // after l1b before break/next line
  const buf3 = 150; // after l2a
  const buf4 = 150; // after l2b
  const buf5 = 150; // after l2c before subtitle

  const d1a = 0;
  const d1b = d1a + l1a.length * speed + buf1;
  const d2a = d1b + l1b.length * speed + buf2;
  const d2b = d2a + l2a.length * speed + buf3;
  const d2c = d2b + l2b.length * speed + buf4;
  const totalRevealMs = d2c + l2c.length * speed + buf5;

  React.useEffect(() => {
    // Mostrar botão imediatamente junto com o texto
    const buttonDelay = 0; // Aparece imediatamente
    const buttonTimeout = setTimeout(() => setShowButton(true), buttonDelay)
    
    // Reveal subtitle after headline typing completes (computed below via delays)
    const subtitleTimeout = setTimeout(() => setShowSubtitle(true), totalRevealMs)
    
    return () => {
      clearTimeout(buttonTimeout)
      clearTimeout(subtitleTimeout)
    }
  }, [totalRevealMs])

  return (
    <main className="flex flex-1 items-center justify-center p-0">
      <div className="relative w-full h-full p-0">
        <LiquidEther
          colors={etherColors}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 px-8">
        <section ref={sectionRef} className="select-none text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <TextType as="span" text={[l1a]} typingSpeed={speed} loop={false} showCursor={false} startOnVisible />
            <TextType
              as="span"
              className="text-primary"
              text={[l1b]}
              typingSpeed={speed}
              initialDelay={d1b}
              loop={false}
              showCursor={false}
              startOnVisible
            />
            <br />
            <TextType as="span" text={[l2a]} typingSpeed={speed} initialDelay={d2a} loop={false} showCursor={false} startOnVisible />
            <TextType
              as="span"
              className="text-primary"
              text={[l2b]}
              typingSpeed={speed}
              initialDelay={d2b}
              loop={false}
              showCursor={false}
              startOnVisible
            />
            <TextType
              as="span"
              text={[l2c]}
              typingSpeed={speed}
              initialDelay={d2c}
              loop={false}
              showCursor={false}
              startOnVisible
            />
          </h1>
          <div className="mt-3 relative">
            <p className="text-base md:text-lg text-transparent select-none">{subtitleText}</p>
            {showSubtitle ? (
              <div className="absolute inset-0">
                <SplitText
                  text={subtitleText}
                  className="text-base md:text-lg text-black dark:text-white"
                  delay={60}
                  duration={0.5}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 10 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                  textAlign="center"
                  tag="p"
                />
              </div>
            ) : null}
          </div>
        </section>

        <div className="auth-cta">
          {showButton ? (
            <FadeContent
              blur
              duration={700}
              easing="ease-out"
              initialOpacity={0}
              delay={0}
              className="w-full"
            >
              <ul>
                <button onClick={useAuthJs ? handleAuthJsSignIn : () => navigate('/sign-in')} type="button">
                  <li style={{"--i":"#36d1dc","--j":"#5b86e5", background:"transparent"}}>
                    <GlassSurface width={"100%"} height={"100%"} borderRadius={9999} className="!p-0">
                      <ArrowRightOnRectangleIcon className="auth-icon w-7 h-7" />
                    </GlassSurface>
                    <span className="title">{t('pages.landing.signIn')}</span>
                  </li>
                </button>
              </ul>
            </FadeContent>
          ) : null}
        </div>
      </div>
      </div>
    </main>
  )
}


