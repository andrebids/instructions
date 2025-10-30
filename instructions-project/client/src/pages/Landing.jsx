import React from 'react'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { ArrowRightOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import LiquidEther from '../components/LiquidEther'
import GlassSurface from '../components/GlassSurface'
import ShinyText from '../components/ShinyText'
import TextType from '../components/TextType'

export default function Landing() {
  const sectionRef = React.useRef(null)

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
        <section ref={sectionRef} className="select-none text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <TextType
              as="span"
              text={["Welcome to "]}
              typingSpeed={80}
              loop={false}
              showCursor={false}
              startOnVisible
            />
            <TextType
              as="span"
              className="text-primary"
              text={["TheCore."]}
              typingSpeed={80}
              initialDelay={80 * 11 + 150}
              loop={false}
              showCursor={false}
              startOnVisible
            />
            <br />
            <TextType
              as="span"
              text={["Let’s "]}
              typingSpeed={80}
              initialDelay={80 * (11 + 8) + 350}
              loop={false}
              showCursor={false}
              startOnVisible
            />
            <TextType
              as="span"
              className="text-primary"
              text={["create"]}
              typingSpeed={80}
              initialDelay={80 * (11 + 8 + 6) + 450}
              loop={false}
              showCursor={false}
              startOnVisible
            />
            <TextType
              as="span"
              text={[" something great."]}
              typingSpeed={80}
              initialDelay={80 * (11 + 8 + 6 + 6) + 550}
              loop={false}
              showCursor={false}
              startOnVisible
            />
          </h1>
          <p className="mt-3 text-base md:text-lg text-black dark:text-white">Sign in to access your dashboard.</p>
        </section>

        <div className="auth-cta">
          <ul>
            <SignInButton mode="modal" redirectUrl="/">
              <li style={{"--i":"#36d1dc","--j":"#5b86e5", background:"transparent"}}>
                <GlassSurface width={"100%"} height={"100%"} borderRadius={9999} className="!p-0">
                  <ArrowRightOnRectangleIcon className="auth-icon w-7 h-7" />
                </GlassSurface>
                <span className="title">Sign in</span>
              </li>
            </SignInButton>

            <SignUpButton mode="modal" redirectUrl="/">
              <li style={{"--i":"#f7971e","--j":"#ffd200", background:"transparent"}}>
                <GlassSurface width={"100%"} height={"100%"} borderRadius={9999} className="!p-0">
                  <UserPlusIcon className="auth-icon w-7 h-7" />
                </GlassSurface>
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


