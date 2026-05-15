import React, { useState } from 'react';

// Digital Matcha Design System
const designSystem = {
  colors: {
    primary: {
      50: '#F4F7F3',
      100: '#E8EDE6',
      200: '#D4DCD1',
      300: '#B8C7B3',
      400: '#A8B5A2', // Main primary
      500: '#8A9B84',
      600: '#6F8268',
      700: '#5C6B57', // Accent
      800: '#4A5745',
      900: '#3B4638',
      950: '#2D3A2D', // Text
    },
    secondary: {
      50: '#FDFCFA',
      100: '#F9F5F0',
      200: '#F2EBE1',
      300: '#E8DCD0', // Main secondary
      400: '#D9C9B8',
      500: '#C4B199',
      600: '#A8917A',
      700: '#8C7662',
      800: '#725F50',
      900: '#5C4D42',
    },
    neutral: {
      0: '#FFFFFF',
      50: '#F7F5F2', // Background
      100: '#EFEBE6',
      200: '#E2DDD6',
      300: '#D1CBC2',
      400: '#B5ADA3',
      500: '#968D82',
      600: '#756C62',
      700: '#5A534A',
      800: '#3D3832',
      900: '#252220',
    },
    semantic: {
      success: '#6B9B6B',
      warning: '#C9A86C',
      error: '#B57070',
      info: '#7A9BAB',
    }
  },
  typography: {
    fontFamily: {
      heading: "'DM Sans', sans-serif",
      body: "'Inter', sans-serif",
      mono: "'JetBrains Mono', monospace",
    }
  },
  spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96],
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  }
};

const ds = designSystem;

function ColorScale({ name, colors, isMain }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700 capitalize">{name}</h4>
      <div className="flex rounded-xl overflow-hidden shadow-sm">
        {Object.entries(colors).map(([shade, hex]) => (
          <div
            key={shade}
            className={`flex-1 h-16 flex flex-col items-center justify-end pb-1 transition-transform hover:scale-105 hover:z-10 cursor-pointer ${
              isMain === shade ? 'ring-2 ring-offset-2 ring-gray-900' : ''
            }`}
            style={{ backgroundColor: hex }}
            title={`${shade}: ${hex}`}
          >
            <span className={`text-[9px] font-mono ${parseInt(shade) > 400 ? 'text-white/70' : 'text-black/50'}`}>
              {shade}
            </span>
          </div>
        ))}
      </div>
      {isMain && (
        <p className="text-xs text-gray-500">Main shade: {isMain}</p>
      )}
    </div>
  );
}

function TokenCard({ label, value, preview }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-mono text-gray-700">{value}</span>
      </div>
      {preview}
    </div>
  );
}

function Button({ variant = 'primary', size = 'md', children, className = '' }) {
  const baseStyles = "font-medium transition-all active:scale-[0.98] inline-flex items-center justify-center gap-2";
  
  const variants = {
    primary: `bg-[${ds.colors.primary[400]}] text-white hover:bg-[${ds.colors.primary[500]}]`,
    secondary: `bg-[${ds.colors.secondary[300]}] text-[${ds.colors.primary[700]}] hover:bg-[${ds.colors.secondary[400]}]`,
    outline: `border-2 border-[${ds.colors.primary[400]}] text-[${ds.colors.primary[700]}] hover:bg-[${ds.colors.primary[50]}]`,
    ghost: `text-[${ds.colors.primary[600]}] hover:bg-[${ds.colors.primary[100]}]`,
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${className}`}
      style={{
        backgroundColor: variant === 'primary' ? ds.colors.primary[400] : 
                        variant === 'secondary' ? ds.colors.secondary[300] : 
                        variant === 'ghost' ? 'transparent' : 'transparent',
        color: variant === 'primary' ? '#FFFFFF' : 
               variant === 'outline' ? ds.colors.primary[700] : ds.colors.primary[700],
        border: variant === 'outline' ? `2px solid ${ds.colors.primary[400]}` : 'none',
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, className = '' }) {
  return (
    <div 
      className={`rounded-2xl p-5 shadow-sm border ${className}`}
      style={{ 
        backgroundColor: '#FFFFFF',
        borderColor: ds.colors.neutral[200]
      }}
    >
      {children}
    </div>
  );
}

function Input({ placeholder, icon }) {
  return (
    <div 
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all focus-within:ring-2"
      style={{ 
        backgroundColor: '#FFFFFF',
        borderColor: ds.colors.neutral[200],
        '--tw-ring-color': ds.colors.primary[300],
      }}
    >
      {icon && <span className="text-gray-400">{icon}</span>}
      <input 
        type="text" 
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: ds.colors.primary[950] }}
      />
    </div>
  );
}

function Badge({ children, variant = 'default' }) {
  const styles = {
    default: { bg: ds.colors.primary[100], color: ds.colors.primary[700] },
    success: { bg: '#E8F5E8', color: ds.colors.semantic.success },
    warning: { bg: '#FDF6E8', color: ds.colors.semantic.warning },
  };
  
  return (
    <span 
      className="px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: styles[variant].bg, color: styles[variant].color }}
    >
      {children}
    </span>
  );
}

function Avatar({ size = 'md', src, fallback }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-base' };
  
  return (
    <div 
      className={`${sizes[size]} rounded-full flex items-center justify-center font-medium`}
      style={{ backgroundColor: ds.colors.primary[200], color: ds.colors.primary[700] }}
    >
      {src ? <img src={src} className="w-full h-full rounded-full object-cover" /> : fallback}
    </div>
  );
}

function MobilePreview() {
  return (
    <div 
      className="w-[280px] rounded-[32px] overflow-hidden shadow-2xl border-8"
      style={{ borderColor: ds.colors.neutral[800], backgroundColor: ds.colors.neutral[50] }}
    >
      {/* Status bar */}
      <div className="px-6 py-2 flex justify-between items-center" style={{ backgroundColor: ds.colors.primary[400] }}>
        <span className="text-white text-xs font-medium">9:41</span>
        <div className="flex gap-1">
          <div className="w-4 h-2 rounded-sm bg-white/80"></div>
        </div>
      </div>
      
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: ds.colors.primary[400] }}>
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: ds.colors.secondary[300] }}
          >
            <span style={{ color: ds.colors.primary[700] }} className="text-sm font-bold">CC</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">CoWork Connect</h1>
            <p className="text-white/70 text-xs">Find your perfect spot</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <span className="text-white text-lg">+</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Search */}
        <div 
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: '#FFFFFF', border: `1px solid ${ds.colors.neutral[200]}` }}
        >
          <span style={{ color: ds.colors.neutral[400] }}>🔍</span>
          <span className="text-sm" style={{ color: ds.colors.neutral[400] }}>Search cafés, libraries...</span>
        </div>

        {/* Quick filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['☕ Cafés', '📚 Libraries', '🌿 Quiet', '⚡ Fast WiFi'].map((filter, i) => (
            <button
              key={filter}
              className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all"
              style={{ 
                backgroundColor: i === 0 ? ds.colors.primary[400] : ds.colors.neutral[100],
                color: i === 0 ? '#FFFFFF' : ds.colors.neutral[600]
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div className="space-y-3">
          {[
            { name: 'Matcha & Co', type: 'Café', rating: '4.8', distance: '0.3 mi', tags: ['Quiet', 'Outlets'] },
            { name: 'The Study', type: 'Library', rating: '4.6', distance: '0.5 mi', tags: ['Free', 'Silent'] },
          ].map((place, i) => (
            <div 
              key={place.name}
              className="rounded-2xl p-4 transition-all hover:shadow-md"
              style={{ backgroundColor: '#FFFFFF', border: `1px solid ${ds.colors.neutral[200]}` }}
            >
              <div className="flex gap-3">
                <div 
                  className="w-16 h-16 rounded-xl flex-shrink-0"
                  style={{ 
                    background: i === 0 
                      ? `linear-gradient(135deg, ${ds.colors.primary[300]}, ${ds.colors.primary[400]})`
                      : `linear-gradient(135deg, ${ds.colors.secondary[200]}, ${ds.colors.secondary[400]})`
                  }}
                ></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm" style={{ color: ds.colors.primary[950] }}>{place.name}</h3>
                    <span className="text-xs" style={{ color: ds.colors.neutral[500] }}>{place.distance}</span>
                  </div>
                  <p className="text-xs mb-2" style={{ color: ds.colors.neutral[500] }}>{place.type}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: ds.colors.semantic.success }}>★ {place.rating}</span>
                    <div className="flex gap-1">
                      {place.tags.map(tag => (
                        <span 
                          key={tag}
                          className="px-2 py-0.5 rounded-full text-[10px]"
                          style={{ backgroundColor: ds.colors.primary[100], color: ds.colors.primary[700] }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div 
        className="px-8 py-4 flex justify-between items-center border-t"
        style={{ backgroundColor: '#FFFFFF', borderColor: ds.colors.neutral[200] }}
      >
        {[
          { icon: '🏠', label: 'Home', active: true },
          { icon: '🗺️', label: 'Map', active: false },
          { icon: '💾', label: 'Saved', active: false },
          { icon: '👤', label: 'Profile', active: false },
        ].map(item => (
          <button key={item.label} className="flex flex-col items-center gap-1">
            <span className="text-lg">{item.icon}</span>
            <span 
              className="text-[10px] font-medium"
              style={{ color: item.active ? ds.colors.primary[600] : ds.colors.neutral[400] }}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DigitalMatchaDesignSystem() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen" style={{ backgroundColor: ds.colors.neutral[50] }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{ backgroundColor: ds.colors.neutral[50] + 'EE', borderColor: ds.colors.neutral[200] }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: ds.colors.primary[400] }}
              >
                <span className="text-white font-bold">CC</span>
              </div>
              <div>
                <h1 className="font-bold" style={{ color: ds.colors.primary[950] }}>CoWork Connect</h1>
                <p className="text-xs" style={{ color: ds.colors.neutral[500] }}>Digital Matcha Design System</p>
              </div>
            </div>
            <div className="flex gap-2">
              {['overview', 'colors', 'components'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
                  style={{ 
                    backgroundColor: activeTab === tab ? ds.colors.primary[400] : 'transparent',
                    color: activeTab === tab ? '#FFFFFF' : ds.colors.neutral[600]
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4" style={{ color: ds.colors.primary[950] }}>
                  Digital Matcha
                </h2>
                <p className="text-lg leading-relaxed" style={{ color: ds.colors.neutral[600] }}>
                  A calming, nature-inspired palette that combines soft sage greens with warm cream tones. 
                  Perfect for productivity apps targeting Gen Z who want aesthetic + functionality.
                </p>
              </div>

              {/* Core colors */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Primary', color: ds.colors.primary[400], hex: '#A8B5A2' },
                  { label: 'Secondary', color: ds.colors.secondary[300], hex: '#E8DCD0' },
                  { label: 'Accent', color: ds.colors.primary[700], hex: '#5C6B57' },
                ].map(c => (
                  <div key={c.label} className="text-center">
                    <div 
                      className="w-full aspect-square rounded-2xl shadow-lg mb-3"
                      style={{ backgroundColor: c.color }}
                    ></div>
                    <p className="font-medium text-sm" style={{ color: ds.colors.primary[950] }}>{c.label}</p>
                    <p className="text-xs font-mono" style={{ color: ds.colors.neutral[500] }}>{c.hex}</p>
                  </div>
                ))}
              </div>

              {/* Typography */}
              <div 
                className="rounded-2xl p-6 border"
                style={{ backgroundColor: '#FFFFFF', borderColor: ds.colors.neutral[200] }}
              >
                <h3 className="font-semibold mb-4" style={{ color: ds.colors.primary[950] }}>Typography</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs mb-1" style={{ color: ds.colors.neutral[500] }}>Headings — DM Sans</p>
                    <p className="text-2xl font-bold" style={{ color: ds.colors.primary[950], fontFamily: 'DM Sans, sans-serif' }}>
                      Find Your Perfect Workspace
                    </p>
                  </div>
                  <div>
                    <p className="text-xs mb-1" style={{ color: ds.colors.neutral[500] }}>Body — Inter</p>
                    <p style={{ color: ds.colors.neutral[700], fontFamily: 'Inter, sans-serif' }}>
                      Discover cozy cafés, quiet libraries, and productive spaces near you. 
                      Connect with fellow remote workers and build your community.
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage notes */}
              <div 
                className="rounded-2xl p-6"
                style={{ backgroundColor: ds.colors.primary[100] }}
              >
                <h3 className="font-semibold mb-3" style={{ color: ds.colors.primary[800] }}>💡 Usage Notes</h3>
                <ul className="space-y-2 text-sm" style={{ color: ds.colors.primary[700] }}>
                  <li>• Use primary green for CTAs and active states</li>
                  <li>• Secondary cream works great for cards and highlights</li>
                  <li>• Keep the warm background (#F7F5F2) for that cozy feel</li>
                  <li>• Accent (#5C6B57) is perfect for icons and secondary text</li>
                </ul>
              </div>
            </div>

            {/* Right: Phone preview */}
            <div className="flex justify-center lg:sticky lg:top-32">
              <MobilePreview />
            </div>
          </div>
        )}

        {activeTab === 'colors' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: ds.colors.primary[950] }}>Color Scales</h2>
              <p style={{ color: ds.colors.neutral[600] }}>Full color palette with all shades for different use cases.</p>
            </div>

            <div className="space-y-6">
              <ColorScale name="Primary (Sage Green)" colors={ds.colors.primary} isMain="400" />
              <ColorScale name="Secondary (Warm Cream)" colors={ds.colors.secondary} isMain="300" />
              <ColorScale name="Neutral (Warm Gray)" colors={ds.colors.neutral} isMain="50" />
            </div>

            {/* Semantic colors */}
            <div>
              <h3 className="font-semibold mb-4" style={{ color: ds.colors.primary[950] }}>Semantic Colors</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(ds.colors.semantic).map(([name, color]) => (
                  <div key={name} className="text-center">
                    <div 
                      className="w-full h-20 rounded-xl shadow-sm mb-2"
                      style={{ backgroundColor: color }}
                    ></div>
                    <p className="text-sm font-medium capitalize" style={{ color: ds.colors.primary[950] }}>{name}</p>
                    <p className="text-xs font-mono" style={{ color: ds.colors.neutral[500] }}>{color}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CSS Variables */}
            <div 
              className="rounded-2xl p-6 border"
              style={{ backgroundColor: '#FFFFFF', borderColor: ds.colors.neutral[200] }}
            >
              <h3 className="font-semibold mb-4" style={{ color: ds.colors.primary[950] }}>CSS Variables</h3>
              <pre 
                className="text-xs p-4 rounded-xl overflow-x-auto"
                style={{ backgroundColor: ds.colors.neutral[100], color: ds.colors.primary[800] }}
              >
{`:root {
  /* Primary - Sage Green */
  --color-primary-50: #F4F7F3;
  --color-primary-100: #E8EDE6;
  --color-primary-200: #D4DCD1;
  --color-primary-300: #B8C7B3;
  --color-primary-400: #A8B5A2; /* Main */
  --color-primary-500: #8A9B84;
  --color-primary-600: #6F8268;
  --color-primary-700: #5C6B57; /* Accent */
  --color-primary-800: #4A5745;
  --color-primary-900: #3B4638;
  --color-primary-950: #2D3A2D; /* Text */

  /* Secondary - Warm Cream */
  --color-secondary-300: #E8DCD0; /* Main */
  
  /* Background */
  --color-background: #F7F5F2;
  
  /* Semantic */
  --color-success: #6B9B6B;
  --color-warning: #C9A86C;
  --color-error: #B57070;
  --color-info: #7A9BAB;
}`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'components' && (
          <div className="space-y-10">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: ds.colors.primary[950] }}>Components</h2>
              <p style={{ color: ds.colors.neutral[600] }}>Ready-to-use UI components with the Digital Matcha theme.</p>
            </div>

            {/* Buttons */}
            <section>
              <h3 className="font-semibold mb-4" style={{ color: ds.colors.primary[950] }}>Buttons</h3>
              <div 
                className="rounded-2xl p-6 border"
                style={{ backgroundColor: '#FFFFFF', borderColor: ds.colors.neutral[200] }}
              >
                <div className="flex flex-wrap gap-4 items-center">
                  <Button variant="primary">Primary Button</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>
                <div className="flex flex-wrap gap-4 items-center mt-4 pt-4 border-t" style={{ borderColor: ds.colors.neutral[200] }}>
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>
            </section>

            {/* Inputs */}
            <section>
              <h3 className="font-semibold mb-4" style={{ color: ds.colors.primary[950] }}>Inputs</h3>
              <div 
                className="rounded-2xl p-6 border space-y-4"
                style={{ backgroundColor: '#FFFFFF', borderColor: ds.colors.neutral[200] }}
              >
                <Input placeholder="Search for spaces..." icon="🔍" />
                <Input placeholder="Enter your email" icon="✉️" />
              </div>
            </section>

            {/* Badges */}
            <section>
              <h3 className="font-semibold mb-4" style={{ color: ds.colors.primary[950] }}>Badges</h3>
              <div 
                className="rounded-2xl p-6 border"
                style={{ backgroundColor: '#FFFFFF', borderColor: ds.colors.neutral[200] }}
              >
                <div className="flex flex-wrap gap-3">
                  <Badge>Default</Badge>
                  <Badge variant="success">Available</Badge>
                  <Badge variant="warning">Busy</Badge>
                  <Badge>☕ Café</Badge>
                  <Badge>📚 Library</Badge>
                  <Badge>⚡ Fast WiFi</Badge>
                </div>
              </div>
            </section>

            {/* Avatars */}
            <section>
              <h3 className="font-semibold mb-4" style={{ color: ds.colors.primary[950] }}>Avatars</h3>
              <div 
                className="rounded-2xl p-6 border"
                style={{ backgroundColor: '#FFFFFF', borderColor: ds.colors.neutral[200] }}
              >
                <div className="flex items-center gap-4">
                  <Avatar size="sm" fallback="JD" />
                  <Avatar size="md" fallback="JD" />
                  <Avatar size="lg" fallback="JD" />
                  <div className="flex -space-x-3">
                    <Avatar size="md" fallback="A" />
                    <Avatar size="md" fallback="B" />
                    <Avatar size="md" fallback="C" />
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium border-2"
                      style={{ 
                        backgroundColor: ds.colors.neutral[100], 
                        color: ds.colors.neutral[600],
                        borderColor: '#FFFFFF'
                      }}
                    >
                      +5
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Cards */}
            <section>
              <h3 className="font-semibold mb-4" style={{ color: ds.colors.primary[950] }}>Cards</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <div className="flex gap-4">
                    <div 
                      className="w-20 h-20 rounded-xl flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${ds.colors.primary[300]}, ${ds.colors.primary[400]})` }}
                    ></div>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: ds.colors.primary[950] }}>Sage & Grind Café</h4>
                      <p className="text-sm mb-2" style={{ color: ds.colors.neutral[500] }}>0.3 miles away • Open now</p>
                      <div className="flex gap-2">
                        <Badge>☕ Coffee</Badge>
                        <Badge variant="success">Available</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="flex gap-4">
                    <div 
                      className="w-20 h-20 rounded-xl flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${ds.colors.secondary[200]}, ${ds.colors.secondary[400]})` }}
                    ></div>
                    <div>
                      <h4 className="font-semibold mb-1" style={{ color: ds.colors.primary[950] }}>Central Library</h4>
                      <p className="text-sm mb-2" style={{ color: ds.colors.neutral[500] }}>0.8 miles away • Open until 9pm</p>
                      <div className="flex gap-2">
                        <Badge>📚 Quiet</Badge>
                        <Badge variant="warning">Busy</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer 
        className="border-t mt-12 py-6"
        style={{ borderColor: ds.colors.neutral[200] }}
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-sm" style={{ color: ds.colors.neutral[500] }}>
            Digital Matcha Design System for CoWork Connect • Built with 🍵
          </p>
        </div>
      </footer>
    </div>
  );
}
