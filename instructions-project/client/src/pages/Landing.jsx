import React from 'react'
import { SignInButton, SignUpButton } from '@clerk/clerk-react'
import { ArrowRightOnRectangleIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import LiquidEther from '../components/LiquidEther'
import GlassSurface from '../components/GlassSurface'
import ShinyText from '../components/ShinyText'
import TextType from '../components/TextType'
import SplitText from '../components/SplitText'
import FadeContent from '../components/FadeContent'

export default function Landing() {
  const sectionRef = React.useRef(null)
  const [showSubtitle, setShowSubtitle] = React.useState(false)
  const etherColors = React.useMemo(() => ['#5227FF', '#FF9FFC', '#B19EEF'], [])

  React.useEffect(() => {
    // Reveal subtitle after headline typing completes (computed below via delays)
    const t = setTimeout(() => setShowSubtitle(true), totalRevealMs)
    return () => clearTimeout(t)
  }, [])

  // Typing configuration (requested: 45ms per char)
  const speed = 45; // ms per char
  const l1a = "Welcome to ";
  const l1b = "TheCore.";
  const l2a = "Let’s ";
  const l2b = "create";
  const l2c = " something great.";
  const subtitleText = "Sign in to access your dashboard.";

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
          {showSubtitle ? (
            <FadeContent
              blur
              duration={700}
              easing="ease-out"
              initialOpacity={0}
              // start halfway through subtitle animation: chars*delay + duration
              delay={(subtitleText.length * 60 + 500) / 2}
              className="w-full"
            >
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
            </FadeContent>
          ) : null}
        </div>
      </div>
      </div>
    </main>
  )
}


