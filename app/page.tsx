const ShadowFill = ({ character }: { character: string }) => {
  return (
    <>
      {Array(24)
        .fill('')
        .map((_, i) => (
          <span key={`row-${character}-${i}`}>{character.repeat(60)}</span>
        ))}
    </>
  )
}

const ASCIIShadows = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="font-shadow absolute left-5 top-5 -z-10 hidden h-full w-full flex-col overflow-hidden bg-gray-800 leading-[26px] tracking-[0.5px] text-gray-300 sm:flex"
      >
        <ShadowFill character="▒" />
      </div>
      <div
        aria-hidden="true"
        className="font-shadow absolute left-5 top-5 -z-20 flex h-full w-full flex-col overflow-hidden bg-gray-800 leading-[26px] tracking-[0.5px] text-gray-300 sm:left-10 sm:top-10 sm:text-gray-400"
      >
        <ShadowFill character="░" />
      </div>
    </>
  )
}

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-900 p-8 font-mono">
      <section className="relative z-10 mb-5 mr-5 flex max-w-[550px] flex-col bg-black sm:mb-10 sm:mr-10 lg:mr-0">
        <div className="flex items-center justify-center gap-2 border-4 border-white bg-black p-2 text-black">
          <div className="flex-1 gap-2 bg-white">
            <h1 className="px-2 py-1 text-lg font-bold leading-5">
              aaron_ford
            </h1>
          </div>
          <div className="bg-white">
            <p className="px-2 py-1 text-lg font-bold leading-5">×</p>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 border-4 border-t-0 border-white bg-black px-4 py-8 text-sm">
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
          <div className="flex items-center gap-2">
            <a
              className="transition-transform-colors duration-300 hover:-rotate-3 hover:text-blue-400"
              href="https://www.linkedin.com/in/aaronford/"
            >
              LinkedIn
            </a>
            <p className="text-xs" aria-hidden="true">
              ░
            </p>
            <a
              href="https://github.com/fordooo"
              className="transition-transform-colors duration-300 hover:-rotate-3 hover:text-purple-400"
            >
              GitHub
            </a>
            <span className="text-xs" aria-hidden="true">
              ░
            </span>
            <a
              className="transition-transform-colors duration-300 hover:-rotate-3 hover:text-slate-400"
              href="#"
            >
              Email
            </a>
          </div>
        </div>
        <ASCIIShadows />
      </section>
    </main>
  )
}
