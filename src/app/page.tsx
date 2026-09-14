'use client'

import Link from 'next/link'
import { ArrowDown, ArrowRight, ArrowUpRight, AudioLines, Braces, Command, Gamepad2 } from 'lucide-react'
import { ParticleField } from '@/components/home/ParticleField'
import './home.css'

export default function Home() {
  return (
    <div className="lab-home">
      <ParticleField />
      <div className="field-vignette" aria-hidden="true" />
      <section className="lab-hero" aria-labelledby="hero-title">
        <div className="particle-arena" aria-hidden="true" />
        <div className="hero-grid" aria-hidden="true" />
        <div className="lab-topline"><span><i /> PERSONAL DIGITAL SPACE</span><span>DESIGNED TO EXPLORE · EST. 2026</span></div>
        <div className="hero-copy">
          <div className="lab-eyebrow"><span className="tiny-cross">+</span> HELLO WORLD, I’M YANG WEI</div>
          <h1 id="hero-title">用代码，<br />让想象<span className="outlined-word">发生</span><span className="mint-period">.</span></h1>
          <p className="hero-english">THINK. BUILD. <em>BEYOND.</em></p>
          <p className="hero-description">我是杨伟，一名 Agent 全栈工程师。<br />在逻辑与灵感之间，探索 AI、创造体验、记录每一次突破。</p>
          <div className="hero-actions">
            <Link href="/blog" className="lab-button">进入我的世界 <ArrowUpRight size={19} /></Link>
            <Link href="/resume" className="lab-text-link">认识一下 <ArrowRight size={17} /></Link>
          </div>
          <div className="hero-stack"><span>POWERED BY CURIOSITY</span><span>代码 / 智能 / 创造</span></div>
        </div>
        <div className="hero-art">
          <div className="orb-halo" aria-hidden="true" />
          <div className="orb-orbit orbit-one" aria-hidden="true" />
          <div className="orb-orbit orbit-two" aria-hidden="true" />
          <div className="art-coordinate coordinate-top"><span className="tiny-cross">+</span> GENERATIVE OBJECT — 001</div>
          <div className="art-coordinate coordinate-left">探索无界<br /><span>INFINITE POSSIBILITIES</span></div>
          <div className="art-coordinate coordinate-right"><span className="tiny-cross">+</span><br />X / Y / Z</div>
          <div className="object-caption"><span className="live-dot" /> LIVE GENERATIVE ART<span>WEBGL</span></div>
        </div>
      </section>

      <section id="explore" className="lab-explore" aria-labelledby="explore-title">
        <div className="section-heading"><div><p className="lab-eyebrow">01 / EXPLORE MY UNIVERSE</p><h2 id="explore-title">不止于代码<span>，</span></h2><p className="section-subtitle">一些思考，一些创造，以及无限的好奇心。</p></div><span className="section-aside">THREE PORTALS.<br />ENDLESS POSSIBILITIES. <ArrowDown size={18} /></span></div>
        <div className="portal-grid">
          <Link href="/blog" className="portal-card portal-blog">
            <div className="portal-top"><span>01 / KNOWLEDGE</span><ArrowUpRight /></div>
            <div className="portal-visual code-visual" aria-hidden="true"><div className="code-window"><div className="window-dots"><i /><i /><i /><span>thoughts.ts</span></div><pre><span>const</span> curiosity = <b>Infinity</b>;{'\n\n'}<span>while</span> (curiosity) {'{'}{'\n'}  <b>explore</b>();{'\n'}  <b>build</b>();{'\n'}  <b>share</b>();{'\n'}{'}'}<i className="code-cursor" /></pre></div><Braces className="floating-code" /></div>
            <div className="portal-content"><span className="portal-tag">IDEAS WORTH SHARING</span><h3>思考，持续生长 <ArrowRight size={22} /></h3><p>全栈开发、实时通信与 AI Agent 的实践手记。<br />把走过的路，变成下一次出发的地图。</p><span className="portal-link">阅读博客 <ArrowUpRight size={15} /></span></div>
          </Link>
          <Link href="/games" className="portal-card portal-games">
            <div className="portal-top"><span>02 / PLAYGROUND</span><ArrowUpRight /></div>
            <div className="portal-visual game-visual" aria-hidden="true"><div className="game-grid" /><div className="game-ring" /><Gamepad2 className="game-controller" strokeWidth={1} /><span className="game-plus plus-one">+</span><span className="game-plus plus-two">+</span><span className="game-label">PRESS START</span></div>
            <div className="portal-content"><span className="portal-tag">A LITTLE PLAY. A LOT OF JOY.</span><h3>认真，玩点不一样 <ArrowRight size={22} /></h3><p>给大脑放个假，让手指开始冒险。<br />即点即玩的浏览器游戏，快乐无需安装。</p><span className="portal-link">开启游戏 <ArrowUpRight size={15} /></span></div>
          </Link>
          <Link href="/resume" className="portal-card portal-about">
            <div className="portal-top"><span>03 / ABOUT ME</span><ArrowUpRight /></div>
            <div className="portal-visual profile-visual" aria-hidden="true"><div className="profile-orbit" /><span className="profile-monogram">YW<svg className="profile-asterisk" viewBox="0 0 40 40" fill="none"><path d="M20 3V37M3 20H37M8 8L32 32M32 8L8 32" /></svg></span><span className="profile-label"><i /> ALWAYS BUILDING</span></div>
            <div className="portal-content"><span className="portal-tag">THE HUMAN BEHIND THE CODE</span><h3>技术有边界，好奇没有 <ArrowRight size={22} /></h3><p>从后端架构到 AI 应用，从想法到真实交付。<br />认识代码背后的我，以及我的下一站。</p><span className="portal-link">查看简历 <ArrowUpRight size={15} /></span></div>
          </Link>
        </div>
      </section>

      <section className="lab-manifesto"><div className="manifesto-symbol" aria-hidden="true"><Command size={38} /></div><p>STAY CURIOUS. KEEP CREATING.</p><h2>下一次突破，<span>从好奇开始。</span></h2><Link href="/resume">一起探索更多可能 <ArrowUpRight size={18} /></Link><div className="manifesto-bottom"><span>YANG WEI / DIGITAL LAB</span><AudioLines size={22} /><span>CRAFTED WITH CODE & CURIOSITY</span></div></section>
    </div>
  )
}
