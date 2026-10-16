/**
 * Shogun Projects 2.0 - .pen Design Generator
 * Generates production-ready, fully customizable .pen design files
 * adhering strictly to the pen.dev 2.17 schema specification.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../designs');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Global Design Token Variables (Binds via $variableName)
const DEFAULT_VARIABLES = {
  'bg-main': { type: 'color', value: '#0B0F19' },
  'bg-sidebar': { type: 'color', value: '#0D1322' },
  'bg-card': { type: 'color', value: '#131B2E' },
  'bg-card-subtle': { type: 'color', value: '#1E293B' },
  'bg-input': { type: 'color', value: '#080D1A' },
  'border-color': { type: 'color', value: '#22304A' },
  'border-subtle': { type: 'color', value: '#1A2438' },
  'border-focus': { type: 'color', value: '#6366F1' },
  'text-main': { type: 'color', value: '#F8FAFC' },
  'text-sub': { type: 'color', value: '#94A3B8' },
  'text-muted': { type: 'color', value: '#64748B' },
  'accent-primary': { type: 'color', value: '#6366F1' },
  'accent-hover': { type: 'color', value: '#4F46E5' },
  'accent-gradient-start': { type: 'color', value: '#4F46E5' },
  'accent-gradient-end': { type: 'color', value: '#7C3AED' },
  'status-success': { type: 'color', value: '#10B981' },
  'status-warning': { type: 'color', value: '#F59E0B' },
  'status-danger': { type: 'color', value: '#EF4444' },
  'status-info': { type: 'color', value: '#06B6D4' },
  'font-sans': { type: 'string', value: 'Inter' },
  'font-mono': { type: 'string', value: 'JetBrains Mono' },
  'radius-sm': { type: 'number', value: 6 },
  'radius-md': { type: 'number', value: 8 },
  'radius-lg': { type: 'number', value: 12 },
  'radius-xl': { type: 'number', value: 16 }
};

const THEMES = {
  theme: ['dark', 'light']
};

let idCounter = 1;
function genId(prefix = 'node') {
  return `${prefix}-${idCounter++}`;
}

// Schema Helper Builders
function frame(options) {
  const node = {
    id: options.id || genId('frame'),
    type: 'frame',
    name: options.name || 'Frame',
    ...options
  };
  return node;
}

function text(content, options = {}) {
  return {
    id: options.id || genId('txt'),
    type: 'text',
    name: options.name || 'Text',
    content: String(content),
    fontFamily: options.fontFamily || '$font-sans',
    fontSize: options.fontSize || 14,
    fontWeight: options.fontWeight || 'normal',
    lineHeight: options.lineHeight || 1.4,
    fill: options.fill || '$text-main',
    textAlign: options.textAlign || 'left',
    textGrowth: options.textGrowth || 'auto',
    ...options
  };
}

function icon(iconName, options = {}) {
  return {
    id: options.id || genId('icon'),
    type: 'icon',
    name: options.name || `Icon / ${iconName}`,
    library: options.library || 'lucide',
    icon: iconName,
    width: options.width || 18,
    height: options.height || 18,
    fill: options.fill || '$text-sub',
    ...options
  };
}

function badge(textLabel, options = {}) {
  const bg = options.bg || '#1E293B';
  const color = options.color || '#94A3B8';
  const border = options.border || '#334155';

  return frame({
    id: options.id || genId('badge'),
    name: `Badge / ${textLabel}`,
    layout: 'horizontal',
    padding: [3, 8],
    cornerRadius: '$radius-sm',
    fill: bg,
    stroke: border,
    strokeWidth: 1,
    alignItems: 'center',
    children: [
      text(textLabel, {
        fontSize: 11,
        fontWeight: 'bold',
        fill: color,
        fontFamily: options.fontFamily || '$font-mono'
      })
    ]
  });
}

function button(label, options = {}) {
  const isPrimary = options.variant === 'primary';
  const isSecondary = options.variant === 'secondary';
  const isGhost = options.variant === 'ghost';
  const isDanger = options.variant === 'danger';

  let fill = '$accent-primary';
  let textColor = '#FFFFFF';
  let stroke = undefined;

  if (isSecondary) {
    fill = '$bg-card-subtle';
    textColor = '$text-main';
    stroke = '$border-color';
  } else if (isGhost) {
    fill = '#00000000';
    textColor = '$text-sub';
  } else if (isDanger) {
    fill = '#EF444420';
    textColor = '#EF4444';
    stroke = '#EF444440';
  }

  const children = [];
  if (options.icon) {
    children.push(icon(options.icon, { width: 14, height: 14, fill: textColor }));
  }
  children.push(text(label, {
    fontSize: 13,
    fontWeight: '600',
    fill: textColor
  }));

  return frame({
    id: options.id || genId('btn'),
    name: `Button / ${label}`,
    layout: 'horizontal',
    gap: 6,
    padding: [8, 14],
    cornerRadius: '$radius-md',
    fill: fill,
    stroke: stroke,
    strokeWidth: stroke ? 1 : undefined,
    alignItems: 'center',
    justifyContent: 'center',
    children
  });
}

function statCard(label, value, changeText, iconName, iconBg, iconColor) {
  return frame({
    id: genId('metric-card'),
    name: `Metric Card / ${label}`,
    width: 'fill_container',
    layout: 'vertical',
    padding: 18,
    gap: 12,
    cornerRadius: '$radius-lg',
    fill: '$bg-card',
    stroke: '$border-color',
    strokeWidth: 1,
    children: [
      frame({
        name: 'Top Row',
        width: 'fill_container',
        layout: 'horizontal',
        justifyContent: 'space_between',
        alignItems: 'center',
        children: [
          text(label.toUpperCase(), {
            fontSize: 11,
            fontWeight: '600',
            fill: '$text-muted',
            letterSpacing: 0.5
          }),
          frame({
            name: 'Icon Box',
            width: 32,
            height: 32,
            cornerRadius: '$radius-md',
            fill: iconBg,
            stroke: iconColor + '40',
            strokeWidth: 1,
            alignItems: 'center',
            justifyContent: 'center',
            children: [
              icon(iconName, { width: 16, height: 16, fill: iconColor })
            ]
          })
        ]
      }),
      frame({
        name: 'Bottom Row',
        layout: 'vertical',
        gap: 4,
        children: [
          text(value, {
            fontSize: 22,
            fontWeight: 'bold',
            fill: '$text-main'
          }),
          frame({
            name: 'Trend Indicator',
            layout: 'horizontal',
            gap: 4,
            alignItems: 'center',
            children: [
              badge(changeText, { bg: '#10B98115', color: '#10B981', border: '#10B98130' })
            ]
          })
        ]
      })
    ]
  });
}

// Build Sidebar Component
function buildSidebar(activeNav = 'Overview') {
  const navSections = [
    {
      title: 'WORKSPACE',
      items: [
        { label: 'Overview', icon: 'layout-dashboard', route: '/' },
        { label: 'Task Hub', icon: 'layers', route: '/board' },
        { label: 'Spaces & Projects', icon: 'folder-kanban', route: '/projects' }
      ]
    },
    {
      title: 'ENTERPRISE PPM',
      items: [
        { label: 'Executive Portfolios', icon: 'briefcase', route: '/ppm/portfolio' },
        { label: 'Financial Overview', icon: 'bar-chart-3', route: '/ppm/financials' },
        { label: 'Budget Controls', icon: 'calculator', route: '/ppm/financials/budget' },
        { label: 'Risk Matrix & Register', icon: 'shield-alert', route: '/ppm/risks' }
      ]
    },
    {
      title: 'CRM MODULE',
      items: [
        { label: 'Leads & Prospects', icon: 'target', route: '/crm/leads' },
        { label: 'Client Accounts', icon: 'building-2', route: '/crm/accounts' }
      ]
    },
    {
      title: 'SYSTEM & MCP',
      items: [
        { label: 'MCP & Agents', icon: 'cpu', route: '/mcp' },
        { label: 'Settings', icon: 'settings', route: '/settings' }
      ]
    }
  ];

  return frame({
    id: genId('sidebar'),
    name: 'Sidebar / Main Navigation',
    width: 250,
    height: 'fill_container',
    layout: 'vertical',
    fill: '$bg-sidebar',
    stroke: '$border-color',
    strokeWidth: { right: 1 },
    children: [
      // Brand Logo Header
      frame({
        name: 'Brand Header',
        width: 'fill_container',
        height: 64,
        layout: 'horizontal',
        alignItems: 'center',
        padding: [0, 16],
        gap: 12,
        stroke: '$border-color',
        strokeWidth: { bottom: 1 },
        children: [
          frame({
            name: 'Logo Icon Box',
            width: 34,
            height: 34,
            cornerRadius: '$radius-md',
            fill: '$accent-primary',
            alignItems: 'center',
            justifyContent: 'center',
            children: [
              icon('layers', { width: 18, height: 18, fill: '#FFFFFF' })
            ]
          }),
          frame({
            name: 'Brand Text Box',
            layout: 'vertical',
            gap: 2,
            children: [
              frame({
                layout: 'horizontal',
                gap: 6,
                alignItems: 'center',
                children: [
                  text('Shogun Projects', { fontSize: 14, fontWeight: 'bold', fill: '$text-main' }),
                  badge('2.0', { bg: '#6366F120', color: '#818CF8', border: '#6366F140' })
                ]
              }),
              text('Antigravity Multi-Agent Hub', { fontSize: 10, fill: '$text-muted' })
            ]
          })
        ]
      }),

      // Nav Links Section
      frame({
        name: 'Nav Scroll Container',
        width: 'fill_container',
        height: 'fill_container',
        layout: 'vertical',
        padding: [16, 12],
        gap: 20,
        children: navSections.map(sec => frame({
          name: `Section / ${sec.title}`,
          width: 'fill_container',
          layout: 'vertical',
          gap: 4,
          children: [
            text(sec.title, {
              fontSize: 10,
              fontWeight: 'bold',
              fill: '$text-muted',
              fontFamily: '$font-mono',
              padding: [4, 8]
            }),
            ...sec.items.map(item => {
              const isActive = item.label === activeNav;
              return frame({
                id: genId('nav-item'),
                name: `Nav Item / ${item.label}`,
                width: 'fill_container',
                layout: 'horizontal',
                alignItems: 'center',
                gap: 10,
                padding: [8, 10],
                cornerRadius: '$radius-md',
                fill: isActive ? '#6366F118' : '#00000000',
                stroke: isActive ? '#6366F130' : undefined,
                strokeWidth: isActive ? 1 : undefined,
                children: [
                  icon(item.icon, {
                    width: 16,
                    height: 16,
                    fill: isActive ? '$accent-primary' : '$text-sub'
                  }),
                  text(item.label, {
                    fontSize: 13,
                    fontWeight: isActive ? '600' : 'normal',
                    fill: isActive ? '$text-main' : '$text-sub'
                  })
                ]
              });
            })
          ]
        }))
      }),

      // User Profile Footer
      frame({
        name: 'Sidebar Footer / User Profile',
        width: 'fill_container',
        height: 60,
        layout: 'horizontal',
        alignItems: 'center',
        padding: [0, 16],
        gap: 10,
        stroke: '$border-color',
        strokeWidth: { top: 1 },
        children: [
          frame({
            name: 'Avatar',
            width: 32,
            height: 32,
            cornerRadius: 16,
            fill: '#4F46E5',
            alignItems: 'center',
            justifyContent: 'center',
            children: [
              text('AD', { fontSize: 11, fontWeight: 'bold', fill: '#FFFFFF' })
            ]
          }),
          frame({
            name: 'User Details',
            layout: 'vertical',
            width: 'fill_container',
            gap: 2,
            children: [
              text('Tokugawa Admin', { fontSize: 12, fontWeight: '600', fill: '$text-main' }),
              text('TokogawaSA (Enterprise)', { fontSize: 10, fill: '$text-muted' })
            ]
          }),
          icon('log-out', { width: 14, height: 14, fill: '$text-muted' })
        ]
      })
    ]
  });
}

// Build Header Component
function buildHeader(title, subtitle) {
  return frame({
    id: genId('header'),
    name: 'Top Header Bar',
    width: 'fill_container',
    height: 64,
    layout: 'horizontal',
    alignItems: 'center',
    justifyContent: 'space_between',
    padding: [0, 24],
    fill: '$bg-main',
    stroke: '$border-color',
    strokeWidth: { bottom: 1 },
    children: [
      frame({
        name: 'Title & Subtitle',
        layout: 'vertical',
        gap: 2,
        children: [
          text(title, { fontSize: 18, fontWeight: 'bold', fill: '$text-main' }),
          text(subtitle, { fontSize: 11, fill: '$text-muted' })
        ]
      }),
      frame({
        name: 'Header Actions & Controls',
        layout: 'horizontal',
        gap: 12,
        alignItems: 'center',
        children: [
          frame({
            name: 'Search Bar',
            width: 240,
            layout: 'horizontal',
            alignItems: 'center',
            gap: 8,
            padding: [7, 12],
            cornerRadius: '$radius-md',
            fill: '$bg-input',
            stroke: '$border-color',
            strokeWidth: 1,
            children: [
              icon('search', { width: 14, height: 14, fill: '$text-muted' }),
              text('Search resources, tools...', { fontSize: 12, fill: '$text-muted' })
            ]
          }),
          button('New Action', { variant: 'secondary', icon: 'plus' }),
          button('Agent Swarm', { variant: 'primary', icon: 'bot' })
        ]
      })
    ]
  });
}

console.log('Design generator framework loaded successfully.');
module.exports = {
  DEFAULT_VARIABLES,
  THEMES,
  OUTPUT_DIR,
  frame,
  text,
  icon,
  badge,
  button,
  statCard,
  buildSidebar,
  buildHeader,
  genId
};
