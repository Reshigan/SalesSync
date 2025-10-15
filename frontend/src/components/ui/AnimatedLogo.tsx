'use client'

import { useState, useEffect } from 'react'

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
  animate?: boolean
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
}

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-4xl'
}

export function AnimatedLogo({ 
  size = 'md', 
  showText = true, 
  className = '',
  animate = true 
}: AnimatedLogoProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={`${sizeClasses[size]} bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center ${className}`}>
        <div className="w-1/2 h-1/2 bg-white rounded opacity-80" />
      </div>
    )
  }

  return (
    <div 
      className={`flex items-center space-x-3 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated Logo SVG */}
      <div className={`${sizeClasses[size]} relative overflow-hidden`}>
        <svg
          viewBox="0 0 100 100"
          className={`w-full h-full transition-all duration-500 ${
            animate && isHovered ? 'scale-110 rotate-3' : ''
          }`}
        >
          {/* Background Circle with Gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            
            {/* Glow Filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Main Background */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#logoGradient)"
            className={`transition-all duration-700 ${
              animate && isHovered ? 'drop-shadow-lg' : ''
            }`}
            filter={animate && isHovered ? "url(#glow)" : "none"}
          />

          {/* Animated Sync Rings */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
            className={animate ? 'animate-pulse' : ''}
          />
          <circle
            cx="50"
            cy="50"
            r="25"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
            className={animate ? 'animate-pulse' : ''}
            style={{ animationDelay: '0.5s' }}
          />

          {/* Central S Symbol */}
          <g transform="translate(50,50)">
            {/* S Shape with modern styling */}
            <path
              d="M-12,-15 Q-12,-20 -7,-20 L7,-20 Q12,-20 12,-15 Q12,-10 7,-10 L-7,-10 Q-12,-10 -12,-5 Q-12,0 -7,0 L7,0 Q12,0 12,5 Q12,10 7,10 L-7,10 Q-12,10 -12,15 Q-12,20 -7,20 L7,20"
              fill="white"
              className={`transition-all duration-500 ${
                animate && isHovered ? 'scale-110' : ''
              }`}
            />
            
            {/* Accent Dot */}
            <circle
              cx="15"
              cy="-15"
              r="3"
              fill="url(#accentGradient)"
              className={animate ? 'animate-bounce' : ''}
              style={{ animationDelay: '1s' }}
            />
          </g>

          {/* Floating Particles */}
          {animate && (
            <>
              <circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.6)" className="animate-ping" style={{ animationDelay: '2s' }} />
              <circle cx="80" cy="30" r="1" fill="rgba(255,255,255,0.4)" className="animate-ping" style={{ animationDelay: '3s' }} />
              <circle cx="25" cy="75" r="1" fill="rgba(255,255,255,0.5)" className="animate-ping" style={{ animationDelay: '4s' }} />
              <circle cx="75" cy="80" r="1" fill="rgba(255,255,255,0.3)" className="animate-ping" style={{ animationDelay: '5s' }} />
            </>
          )}
        </svg>

        {/* Rotating Border Effect */}
        {animate && isHovered && (
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 animate-spin" style={{ animationDuration: '3s' }}>
            <div className={`${sizeClasses[size]} bg-white rounded-2xl m-0.5`} />
          </div>
        )}
      </div>

      {/* Animated Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent transition-all duration-500 ${
            animate && isHovered ? 'scale-105' : ''
          }`}>
            SalesSync
          </h1>
          {size === 'lg' || size === 'xl' ? (
            <p className={`text-xs ${size === 'xl' ? 'text-sm' : ''} text-slate-600 font-medium tracking-wide transition-all duration-500 ${
              animate && isHovered ? 'text-blue-600' : ''
            }`}>
              Enterprise Platform
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Compact version for sidebar
export function CompactAnimatedLogo({ className = '', animate = true }: { className?: string, animate?: boolean }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className={`w-10 h-10 relative cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <svg
        viewBox="0 0 100 100"
        className={`w-full h-full transition-all duration-300 ${
          animate && isHovered ? 'scale-110 rotate-6' : ''
        }`}
      >
        <defs>
          <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
        </defs>

        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#compactGradient)"
          className="drop-shadow-md"
        />

        <g transform="translate(50,50)">
          <path
            d="M-10,-12 Q-10,-16 -6,-16 L6,-16 Q10,-16 10,-12 Q10,-8 6,-8 L-6,-8 Q-10,-8 -10,-4 Q-10,0 -6,0 L6,0 Q10,0 10,4 Q10,8 6,8 L-6,8 Q-10,8 -10,12 Q-10,16 -6,16 L6,16"
            fill="white"
            className={`transition-transform duration-300 ${
              animate && isHovered ? 'scale-110' : ''
            }`}
          />
          <circle
            cx="12"
            cy="-12"
            r="2"
            fill="#10B981"
            className={animate ? 'animate-pulse' : ''}
          />
        </g>
      </svg>
    </div>
  )
}