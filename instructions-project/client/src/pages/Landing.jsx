import React from 'react'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { ArrowRightOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import LiquidEther from '../components/LiquidEther'

export default function Landing() {
  const sectionRef = React.useRef(null)
  const word1Ref = React.useRef(null)
  const word2Ref = React.useRef(null)
  const rafRef = React.useRef(null)

  const onMouseMove = (e) => {
    const x = e.clientX
    const y = e.clientY
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const moveX = x / -100
      const moveY = y / -120
      if (word1Ref.current) {
        word1Ref.current.style.transform = `translate3d(${moveX / 2}px, ${moveY}px, 0)`
      }
      if (word2Ref.current) {
        word2Ref.current.style.transform = `translate3d(${moveX / 2}px, ${moveY}px, 0)`
      }
      if (sectionRef.current) {
        sectionRef.current.style.textShadow = `${moveX}px ${-moveY}px rgba(0,0,0,0.1)`
      }
    })
  }

  React.useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  return (
    <main className="flex flex-1 items-center justify-center p-0">
      <div className="relative w-full h-full p-0">
        <LiquidEther
          colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
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
        <section ref={sectionRef} onMouseMove={onMouseMove} className="select-none text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to <span ref={word1Ref} className="text-primary">Instructions</span>.
            <br />
            Let’s <span ref={word2Ref} className="text-primary">create</span> something great.
          </h1>
          <p className="mt-3 text-default-500 text-base md:text-lg">Sign in to access your dashboard.</p>
        </section>

        <div className="auth-cta">
          <ul>
            <SignInButton mode="modal" redirectUrl="/">
              <li style={{"--i":"#36d1dc","--j":"#5b86e5"}}>
                <ArrowRightOnRectangleIcon className="auth-icon w-7 h-7" />
                <span className="title">Sign in</span>
              </li>
            </SignInButton>

            <SignUpButton mode="modal" redirectUrl="/">
              <li style={{"--i":"#f7971e","--j":"#ffd200"}}>
                <UserPlusIcon className="auth-icon w-7 h-7" />
                <span className="title">Sign up</span>
              </li>
            </SignUpButton>
          </ul>
        </div>
      </div>
      </div>
    </main>
  )
}


