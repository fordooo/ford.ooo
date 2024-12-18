import { Fragment } from 'react'

import BackgroundNoise from '@/components/background-noise'

const ShadowFill = ({ character }: { character: string }) => {
  return (
    <>
      {Array.from({ length: 20 }, (_, i) => (
        <span key={`row-${character}-${i}`}>{character.repeat(66)}</span>
      ))}
    </>
  )
}

const links = [
  {
    href: 'https://www.linkedin.com/in/aaronford/',
    label: 'LinkedIn',
    hoverClass: 'hover:text-blue-400',
  },
  {
    href: 'https://github.com/fordooo',
    label: 'GitHub',
    hoverClass: 'hover:text-purple-400',
  },
  {
    href: 'mailto:aaron@ford.ooo',
    label: 'Email',
    hoverClass: 'hover:text-slate-400',
  },
]

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-900 p-8 font-mono">
      <section className="relative z-10 mb-5 mr-5 flex max-w-[550px] flex-col bg-black sm:mb-10 sm:mr-10 lg:mr-0">
        <header className="flex items-center gap-2 border-4 border-white bg-black p-2 text-black">
          <div className="flex-1 gap-2 bg-white">
            <h1 className="px-2 py-1 text-lg font-bold leading-5">
              aaron_ford
            </h1>
          </div>
          <div className="bg-white">
            <p className="px-2 py-1 text-lg font-bold leading-5">×</p>
          </div>
        </header>
        <div className="flex flex-col gap-4 border-4 border-t-0 border-white bg-black px-4 py-8 text-sm">
          <p>
            Howdy! I&apos;m Aaron, a front-end developer and all-around web
            enthusiast living in the Pacific Northwest.
          </p>
          <p>
            I&apos;m currently working at Machobear Studios on exciting projects
            like liv.rent. I love building with HTML, CSS, JavaScript,
            TypeScript, React, and Next.js — but I&apos;m always eager to learn
            new things.
          </p>
          <p className="mt-4">Feel free to connect:</p>
          <nav className="flex items-center gap-2">
            {links.map(({ href, label, hoverClass }, i) => (
              <Fragment key={label}>
                <a
                  href={href}
                  className={`transition-transform-colors duration-300 hover:-rotate-3 ${hoverClass}`}
                >
                  {label}
                </a>
                {i < links.length - 1 && (
                  <span className="text-xs" aria-hidden>
                    ░
                  </span>
                )}
              </Fragment>
            ))}
          </nav>
        </div>
        <div
          aria-hidden
          className="absolute left-5 top-5 -z-10 hidden h-full w-full flex-col overflow-hidden bg-gray-800 font-shadow leading-[26px] tracking-[0.5px] text-gray-300 sm:flex"
        >
          <ShadowFill character="▒" />
        </div>
        <div
          aria-hidden
          className="absolute left-5 top-5 -z-20 flex h-full w-full flex-col overflow-hidden bg-transparent font-shadow leading-[26px] tracking-[0.5px] text-gray-300 sm:left-10 sm:top-10 sm:text-gray-400"
        >
          <ShadowFill character="░" />
        </div>
      </section>
      <BackgroundNoise />
    </main>
  )
}
