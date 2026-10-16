/**
 * Script to generate all 10 complete .pen design files
 * for Shogun Projects 2.0 application pages.
 */

const fs = require('fs');
const path = require('path');
const {
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
} = require('./generate_pen_designs.cjs');

function createPenDoc(name, canvasChild) {
  return {
    version: '2.17',
    themes: THEMES,
    variables: DEFAULT_VARIABLES,
    children: [canvasChild]
  };
}

function writePenFile(fileName, doc) {
  const filePath = path.join(OUTPUT_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2), 'utf8');
  console.log(`[SUCCESS] Generated: ${fileName} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
}

// -----------------------------------------------------------------------------
// 1. Dashboard Page (dashboard.pen)
// -----------------------------------------------------------------------------
function buildDashboardPage() {
  return createPenDoc('Dashboard Page', frame({
    name: 'Dashboard Page Canvas',
    width: 1440,
    height: 960,
    layout: 'horizontal',
    fill: '$bg-main',
    children: [
      buildSidebar('Overview'),
      frame({
        name: 'Main Content Area',
        width: 'fill_container',
        height: 'fill_container',
        layout: 'vertical',
        children: [
          buildHeader('Executive Dashboard', 'Real-time multi-agent telemetry & orchestration matrix'),
          frame({
            name: 'Dashboard Scroll View',
            width: 'fill_container',
            height: 'fill_container',
            layout: 'vertical',
            padding: 24,
            gap: 20,
            children: [
              // Stat Cards Grid
              frame({
                name: 'KPI Metrics Grid',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  statCard('Active Agent Workers', '4 Sentinel / 2 Workers', '+2 online', 'bot', '#6366F120', '#6366F1'),
                  statCard('Database Entities', '14 Synced', 'REST Live', 'database', '#10B98120', '#10B981'),
                  statCard('MCP Pipelines', '5 Tools Exposed', 'MCP OK', 'workflow', '#F59E0B20', '#F59E0B'),
                  statCard('API Services', '12 Endpoints', 'Node 22 / Express', 'server', '#8B5CF620', '#8B5CF6')
                ]
              }),

              // Dual-Wield Architecture Banner
              frame({
                name: 'Dual Architecture Banner',
                width: 'fill_container',
                layout: 'vertical',
                padding: 24,
                gap: 12,
                cornerRadius: '$radius-xl',
                fill: '$bg-card',
                stroke: '$accent-primary',
                strokeWidth: 1,
                children: [
                  frame({
                    name: 'Banner Badge',
                    layout: 'horizontal',
                    gap: 8,
                    alignItems: 'center',
                    children: [
                      badge('ANTIGRAVITY 2.0 ARCHITECTURE', { bg: '#6366F120', color: '#818CF8', border: '#6366F140' }),
                      text('Parallel Multi-Agent Swarm', { fontSize: 11, fill: '$text-muted', fontFamily: '$font-mono' })
                    ]
                  }),
                  text('High-Velocity Dual-Wield Orchestration & Clean React 19 Frontend', {
                    fontSize: 18,
                    fontWeight: 'bold',
                    fill: '$text-main'
                  }),
                  text('Developers dual-wield the standalone Antigravity 2.0 Desktop app for background sweeps and automated tests while actively authoring in the Antigravity IDE. Real-time changes synchronize across REST and MCP endpoints.', {
                    fontSize: 13,
                    fill: '$text-sub',
                    lineHeight: 1.5
                  })
                ]
              }),

              // Activity Log & Subagent Matrix
              frame({
                name: 'Activity & Subagents Row',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  // Activity Log (60% width)
                  frame({
                    name: 'Activity Log Panel',
                    width: 'fill_container',
                    layout: 'vertical',
                    padding: 20,
                    gap: 14,
                    cornerRadius: '$radius-lg',
                    fill: '$bg-card',
                    stroke: '$border-color',
                    strokeWidth: 1,
                    children: [
                      frame({
                        name: 'Panel Header',
                        width: 'fill_container',
                        layout: 'horizontal',
                        justifyContent: 'space_between',
                        alignItems: 'center',
                        children: [
                          text('Agentic Orchestration Activity Log', { fontSize: 14, fontWeight: 'bold', fill: '$text-main' }),
                          badge('LIVE TELEMETRY', { bg: '#10B98115', color: '#10B981', border: '#10B98130' })
                        ]
                      }),
                      ...[
                        { title: 'REST API Client Connected', agent: 'Sentinel Subagent', time: '2m ago' },
                        { title: 'Antigravity MCP Server Initialized', agent: 'Antigravity IDE', time: '8m ago' },
                        { title: 'React 19 + Vite Multi-Page Scaffold Built', agent: 'Worker Subagent', time: '14m ago' },
                        { title: 'Global Rule Verification & Security Audit Pass', agent: 'Auditor Subagent', time: '22m ago' }
                      ].map((item, i) => frame({
                        name: `Log Item / ${item.title}`,
                        width: 'fill_container',
                        layout: 'horizontal',
                        justifyContent: 'space_between',
                        alignItems: 'center',
                        padding: [10, 12],
                        cornerRadius: '$radius-md',
                        fill: '$bg-card-subtle',
                        stroke: '$border-subtle',
                        strokeWidth: 1,
                        children: [
                          frame({
                            layout: 'horizontal',
                            gap: 10,
                            alignItems: 'center',
                            children: [
                              icon('check-circle-2', { width: 16, height: 16, fill: '#10B981' }),
                              frame({
                                layout: 'vertical',
                                gap: 2,
                                children: [
                                  text(item.title, { fontSize: 13, fontWeight: '600', fill: '$text-main' }),
                                  text(`Triggered by ${item.agent}`, { fontSize: 11, fill: '$text-muted' })
                                ]
                              })
                            ]
                          }),
                          text(item.time, { fontSize: 11, fill: '$text-muted', fontFamily: '$font-mono' })
                        ]
                      }))
                    ]
                  }),

                  // Subagents Matrix (40% width)
                  frame({
                    name: 'Subagent Matrix Panel',
                    width: 380,
                    layout: 'vertical',
                    padding: 20,
                    gap: 14,
                    cornerRadius: '$radius-lg',
                    fill: '$bg-card',
                    stroke: '$border-color',
                    strokeWidth: 1,
                    children: [
                      frame({
                        name: 'Matrix Header',
                        width: 'fill_container',
                        layout: 'horizontal',
                        justifyContent: 'space_between',
                        alignItems: 'center',
                        children: [
                          text('Subagent Matrix', { fontSize: 14, fontWeight: 'bold', fill: '$text-main' }),
                          badge('3 RUNNING', { bg: '#6366F120', color: '#818CF8', border: '#6366F140' })
                        ]
                      }),
                      ...[
                        { name: 'Sentinel Subagent', desc: 'Evaluates form structures, logic flows & DB schemas', status: 'ACTIVE' },
                        { name: 'Worker Subagent', desc: 'Generates PHP/TS code, REST paths & React sidebars', status: 'ACTIVE' },
                        { name: 'Auditor Subagent', desc: 'Inspects security layers, nonces & policy gates', status: 'ACTIVE' }
                      ].map(sub => frame({
                        name: `Subagent / ${sub.name}`,
                        width: 'fill_container',
                        layout: 'vertical',
                        padding: 12,
                        gap: 6,
                        cornerRadius: '$radius-md',
                        fill: '$bg-card-subtle',
                        stroke: '$border-subtle',
                        strokeWidth: 1,
                        children: [
                          frame({
                            width: 'fill_container',
                            layout: 'horizontal',
                            justifyContent: 'space_between',
                            children: [
                              text(sub.name, { fontSize: 13, fontWeight: '600', fill: '$accent-primary' }),
                              badge(sub.status, { bg: '#10B98115', color: '#10B981', border: '#10B98130' })
                            ]
                          }),
                          text(sub.desc, { fontSize: 11, fill: '$text-sub' })
                        ]
                      }))
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  }));
}

// -----------------------------------------------------------------------------
// 2. Projects Page (projects.pen)
// -----------------------------------------------------------------------------
function buildProjectsPage() {
  const projects = [
    {
      title: 'Antigravity 2.0 Core Platform',
      tag: 'ARCHITECTURE',
      status: 'In Progress',
      statusColor: '#6366F1',
      progress: 78,
      budget: '$45,000',
      team: '4 Agents',
      dueDate: 'Nov 15, 2026'
    },
    {
      title: 'WooCommerce Auto-Sync Plugin',
      tag: 'INTEGRATION',
      status: 'In Progress',
      statusColor: '#6366F1',
      progress: 92,
      budget: '$18,500',
      team: '2 Agents',
      dueDate: 'Oct 30, 2026'
    },
    {
      title: 'VTiger CRM Migration Suite',
      tag: 'ENTERPRISE',
      status: 'At Risk',
      statusColor: '#EF4444',
      progress: 45,
      budget: '$32,000',
      team: '3 Agents',
      dueDate: 'Dec 01, 2026'
    },
    {
      title: 'Action Scheduler Async Queue',
      tag: 'BACKEND',
      status: 'Completed',
      statusColor: '#10B981',
      progress: 100,
      budget: '$12,000',
      team: '2 Agents',
      dueDate: 'Oct 10, 2026'
    }
  ];

  return createPenDoc('Projects Overview', frame({
    name: 'Projects Page Canvas',
    width: 1440,
    height: 960,
    layout: 'horizontal',
    fill: '$bg-main',
    children: [
      buildSidebar('Spaces & Projects'),
      frame({
        name: 'Main Content Area',
        width: 'fill_container',
        height: 'fill_container',
        layout: 'vertical',
        children: [
          buildHeader('Spaces & Projects', 'Multi-agent project memberships & workspace registry'),
          frame({
            name: 'Projects Content Container',
            width: 'fill_container',
            height: 'fill_container',
            layout: 'vertical',
            padding: 24,
            gap: 20,
            children: [
              // Filters and Action Bar
              frame({
                name: 'Filter & Search Bar',
                width: 'fill_container',
                layout: 'horizontal',
                justifyContent: 'space_between',
                alignItems: 'center',
                children: [
                  frame({
                    name: 'Search & Status Filters',
                    layout: 'horizontal',
                    gap: 12,
                    alignItems: 'center',
                    children: [
                      frame({
                        name: 'Project Search Input',
                        width: 260,
                        layout: 'horizontal',
                        alignItems: 'center',
                        gap: 8,
                        padding: [8, 12],
                        cornerRadius: '$radius-md',
                        fill: '$bg-card',
                        stroke: '$border-color',
                        strokeWidth: 1,
                        children: [
                          icon('search', { width: 14, height: 14, fill: '$text-muted' }),
                          text('Filter projects by name...', { fontSize: 12, fill: '$text-muted' })
                        ]
                      }),
                      badge('All Spaces (12)', { bg: '#6366F120', color: '#818CF8', border: '#6366F140' }),
                      badge('Active (9)', { bg: '$bg-card', color: '$text-sub', border: '$border-color' }),
                      badge('At Risk (2)', { bg: '$bg-card', color: '#EF4444', border: '$border-color' })
                    ]
                  }),
                  frame({
                    name: 'Action Buttons',
                    layout: 'horizontal',
                    gap: 10,
                    children: [
                      button('Filter Matrix', { variant: 'secondary', icon: 'filter' }),
                      button('New Project Space', { variant: 'primary', icon: 'plus' })
                    ]
                  })
                ]
              }),

              // Projects Cards Grid (2 columns)
              frame({
                name: 'Project Cards Grid',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  // Left Column
                  frame({
                    name: 'Project Cards Column 1',
                    width: 'fill_container',
                    layout: 'vertical',
                    gap: 16,
                    children: projects.slice(0, 2).map(p => buildProjectCard(p))
                  }),
                  // Right Column
                  frame({
                    name: 'Project Cards Column 2',
                    width: 'fill_container',
                    layout: 'vertical',
                    gap: 16,
                    children: projects.slice(2, 4).map(p => buildProjectCard(p))
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  }));
}

function buildProjectCard(p) {
  return frame({
    name: `Card / ${p.title}`,
    width: 'fill_container',
    layout: 'vertical',
    padding: 20,
    gap: 16,
    cornerRadius: '$radius-lg',
    fill: '$bg-card',
    stroke: '$border-color',
    strokeWidth: 1,
    children: [
      frame({
        name: 'Card Header',
        width: 'fill_container',
        layout: 'horizontal',
        justifyContent: 'space_between',
        alignItems: 'center',
        children: [
          badge(p.tag, { bg: '#1E293B', color: '$text-sub', border: '$border-color' }),
          badge(p.status, { bg: p.statusColor + '20', color: p.statusColor, border: p.statusColor + '40' })
        ]
      }),
      frame({
        name: 'Project Info',
        layout: 'vertical',
        gap: 6,
        children: [
          text(p.title, { fontSize: 16, fontWeight: 'bold', fill: '$text-main' }),
          text('Integrated multi-agent pipeline with automated Git checkpoints and MCP bridge.', {
            fontSize: 12,
            fill: '$text-sub'
          })
        ]
      }),
      // Progress Bar
      frame({
        name: 'Progress Section',
        width: 'fill_container',
        layout: 'vertical',
        gap: 6,
        children: [
          frame({
            name: 'Progress Labels',
            width: 'fill_container',
            layout: 'horizontal',
            justifyContent: 'space_between',
            children: [
              text('Completion Progress', { fontSize: 11, fill: '$text-muted' }),
              text(`${p.progress}%`, { fontSize: 11, fontWeight: 'bold', fill: '$text-main' })
            ]
          }),
          frame({
            name: 'Progress Track',
            width: 'fill_container',
            height: 6,
            cornerRadius: 3,
            fill: '#1E293B',
            children: [
              frame({
                name: 'Progress Fill',
                width: `${p.progress}%`,
                height: 6,
                cornerRadius: 3,
                fill: p.statusColor
              })
            ]
          })
        ]
      }),
      // Footer Metadata
      frame({
        name: 'Card Footer',
        width: 'fill_container',
        layout: 'horizontal',
        justifyContent: 'space_between',
        alignItems: 'center',
        stroke: '$border-subtle',
        strokeWidth: { top: 1 },
        padding: [12, 0, 0, 0],
        children: [
          frame({
            layout: 'horizontal',
            gap: 16,
            children: [
              frame({
                layout: 'horizontal',
                gap: 4,
                alignItems: 'center',
                children: [
                  icon('dollar-sign', { width: 14, height: 14, fill: '$text-muted' }),
                  text(p.budget, { fontSize: 12, fontWeight: '600', fill: '$text-main' })
                ]
              }),
              frame({
                layout: 'horizontal',
                gap: 4,
                alignItems: 'center',
                children: [
                  icon('users', { width: 14, height: 14, fill: '$text-muted' }),
                  text(p.team, { fontSize: 12, fill: '$text-sub' })
                ]
              })
            ]
          }),
          frame({
            layout: 'horizontal',
            gap: 4,
            alignItems: 'center',
            children: [
              icon('calendar-range', { width: 14, height: 14, fill: '$text-muted' }),
              text(p.dueDate, { fontSize: 11, fill: '$text-muted', fontFamily: '$font-mono' })
            ]
          })
        ]
      })
    ]
  });
}

// -----------------------------------------------------------------------------
// 3. Task Board Page (taskboard.pen)
// -----------------------------------------------------------------------------
function buildTaskBoardPage() {
  const columns = [
    {
      title: 'Backlog',
      count: '3',
      color: '#64748B',
      tasks: [
        { id: 'TSK-101', title: 'Setup Composer PSR-4 Autoloading', priority: 'Medium', pColor: '#F59E0B', subtasks: '3/3' },
        { id: 'TSK-102', title: 'Action Scheduler Google Sheets Sync', priority: 'Low', pColor: '#10B981', subtasks: '1/4' }
      ]
    },
    {
      title: 'To Do',
      count: '4',
      color: '#0EA5E9',
      tasks: [
        { id: 'TSK-103', title: 'Custom MySQL Table Schema Setup', priority: 'High', pColor: '#EF4444', subtasks: '2/5' },
        { id: 'TSK-104', title: 'Build Dynamic Mapping Engine for Products', priority: 'High', pColor: '#EF4444', subtasks: '0/3' }
      ]
    },
    {
      title: 'In Progress',
      count: '2',
      color: '#6366F1',
      tasks: [
        { id: 'TSK-105', title: 'WP REST API Controller with Nonces', priority: 'Urgent', pColor: '#EF4444', subtasks: '4/6' },
        { id: 'TSK-106', title: 'Gutenberg PluginSidebar React Interface', priority: 'Medium', pColor: '#F59E0B', subtasks: '3/4' }
      ]
    },
    {
      title: 'Review & QA',
      count: '2',
      color: '#F59E0B',
      tasks: [
        { id: 'TSK-107', title: 'Security Audit & Nonce Verification', priority: 'High', pColor: '#EF4444', subtasks: '5/5' }
      ]
    },
    {
      title: 'Done',
      count: '5',
      color: '#10B981',
      tasks: [
        { id: 'TSK-108', title: 'Git Initial Checkpoint & Repo Structure', priority: 'Medium', pColor: '#10B981', subtasks: '2/2' }
      ]
    }
  ];

  return createPenDoc('Kanban Task Board', frame({
    name: 'Task Board Canvas',
    width: 1440,
    height: 960,
    layout: 'horizontal',
    fill: '$bg-main',
    children: [
      buildSidebar('Task Hub'),
      frame({
        name: 'Main Content Area',
        width: 'fill_container',
        height: 'fill_container',
        layout: 'vertical',
        children: [
          buildHeader('Kanban Task Board', 'Real-time collaborative task execution & Subtask checklist'),
          // View Switcher Bar
          frame({
            name: 'View Switcher Bar',
            width: 'fill_container',
            layout: 'horizontal',
            justifyContent: 'space_between',
            alignItems: 'center',
            padding: [10, 24],
            fill: '$bg-sidebar',
            stroke: '$border-color',
            strokeWidth: { bottom: 1 },
            children: [
              frame({
                name: 'View Tabs',
                layout: 'horizontal',
                gap: 8,
                children: [
                  button('Kanban Board', { variant: 'primary', icon: 'layers' }),
                  button('List View', { variant: 'ghost', icon: 'file-text' }),
                  button('Timeline / Gantt', { variant: 'ghost', icon: 'calendar-range' }),
                  button('Workload Matrix', { variant: 'ghost', icon: 'gauge' })
                ]
              }),
              frame({
                name: 'View Filters',
                layout: 'horizontal',
                gap: 8,
                alignItems: 'center',
                children: [
                  badge('Group: Status', { bg: '$bg-card', color: '$text-sub', border: '$border-color' }),
                  badge('Priority: All', { bg: '$bg-card', color: '$text-sub', border: '$border-color' }),
                  button('New Task', { variant: 'primary', icon: 'plus' })
                ]
              })
            ]
          }),

          // Kanban Columns Horizontal Scroll
          frame({
            name: 'Kanban Columns Container',
            width: 'fill_container',
            height: 'fill_container',
            layout: 'horizontal',
            padding: 20,
            gap: 16,
            children: columns.map(col => frame({
              name: `Column / ${col.title}`,
              width: 250,
              height: 'fill_container',
              layout: 'vertical',
              padding: 12,
              gap: 12,
              cornerRadius: '$radius-lg',
              fill: '$bg-sidebar',
              stroke: '$border-color',
              strokeWidth: 1,
              children: [
                // Column Header
                frame({
                  name: 'Column Header',
                  width: 'fill_container',
                  layout: 'horizontal',
                  justifyContent: 'space_between',
                  alignItems: 'center',
                  padding: [4, 6],
                  children: [
                    frame({
                      layout: 'horizontal',
                      gap: 8,
                      alignItems: 'center',
                      children: [
                        frame({ width: 8, height: 8, cornerRadius: 4, fill: col.color }),
                        text(col.title, { fontSize: 13, fontWeight: 'bold', fill: '$text-main' })
                      ]
                    }),
                    badge(col.count, { bg: '$bg-card', color: '$text-muted', border: '$border-color' })
                  ]
                }),

                // Tasks in Column
                ...col.tasks.map(t => frame({
                  name: `Task / ${t.id}`,
                  width: 'fill_container',
                  layout: 'vertical',
                  padding: 14,
                  gap: 10,
                  cornerRadius: '$radius-md',
                  fill: '$bg-card',
                  stroke: '$border-color',
                  strokeWidth: 1,
                  children: [
                    frame({
                      width: 'fill_container',
                      layout: 'horizontal',
                      justifyContent: 'space_between',
                      children: [
                        text(t.id, { fontSize: 10, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                        badge(t.priority, { bg: t.pColor + '20', color: t.pColor, border: t.pColor + '40' })
                      ]
                    }),
                    text(t.title, { fontSize: 13, fontWeight: '600', fill: '$text-main', lineHeight: 1.3 }),
                    frame({
                      width: 'fill_container',
                      layout: 'horizontal',
                      justifyContent: 'space_between',
                      alignItems: 'center',
                      stroke: '$border-subtle',
                      strokeWidth: { top: 1 },
                      padding: [8, 0, 0, 0],
                      children: [
                        frame({
                          layout: 'horizontal',
                          gap: 4,
                          alignItems: 'center',
                          children: [
                            icon('check-circle-2', { width: 12, height: 12, fill: '$text-muted' }),
                            text(t.subtasks, { fontSize: 11, fill: '$text-muted', fontFamily: '$font-mono' })
                          ]
                        }),
                        frame({
                          width: 20,
                          height: 20,
                          cornerRadius: 10,
                          fill: '$accent-primary',
                          alignItems: 'center',
                          justifyContent: 'center',
                          children: [
                            text('AI', { fontSize: 9, fontWeight: 'bold', fill: '#FFFFFF' })
                          ]
                        })
                      ]
                    })
                  ]
                }))
              ]
            }))
          })
        ]
      })
    ]
  }));
}

// -----------------------------------------------------------------------------
// 4. CRM Leads Page (crm-leads.pen)
// -----------------------------------------------------------------------------
function buildCrmLeadsPage() {
  const leads = [
    { name: 'Marcus Sterling', company: 'Apex BioTech Corp', email: 'm.sterling@apexbio.io', stage: 'Qualified', score: '94', rep: 'Tokugawa Admin' },
    { name: 'Elena Rostova', company: 'Hyperion Aerospace', email: 'elena@hyperion.tech', stage: 'Contacted', score: '82', rep: 'Sentinel Agent' },
    { name: 'Kenji Takahashi', company: 'Kyoto Robotics Inc', email: 'takahashi@kyoto-robotics.jp', stage: 'Negotiation', score: '98', rep: 'Worker Agent' },
    { name: 'Sarah Jenkins', company: 'Nova Financial Systems', email: 'sarah.j@novafin.com', stage: 'Proposal Sent', score: '76', rep: 'Tokugawa Admin' }
  ];

  return createPenDoc('CRM Leads Management', frame({
    name: 'CRM Leads Canvas',
    width: 1440,
    height: 960,
    layout: 'horizontal',
    fill: '$bg-main',
    children: [
      buildSidebar('Leads & Prospects'),
      frame({
        name: 'Main Content Area',
        width: 'fill_container',
        height: 'fill_container',
        layout: 'vertical',
        children: [
          buildHeader('Leads & Prospects', 'VTiger prospect qualification, lead conversion & activity stream'),
          frame({
            name: 'CRM Content',
            width: 'fill_container',
            height: 'fill_container',
            layout: 'vertical',
            padding: 24,
            gap: 20,
            children: [
              // Lead Pipeline Metrics
              frame({
                name: 'Pipeline Metrics',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  statCard('Total Active Leads', '142', '+18 this month', 'target', '#6366F120', '#6366F1'),
                  statCard('Conversion Rate', '34.2%', '+4.5% vs Q2', 'bar-chart-3', '#10B98120', '#10B981'),
                  statCard('Pipeline Value', '$840,000', 'Weighted Forecast', 'dollar-sign', '#F59E0B20', '#F59E0B'),
                  statCard('Avg Deal Cycle', '18 Days', '-3 days faster', 'clock', '#8B5CF620', '#8B5CF6')
                ]
              }),

              // Data Table Container
              frame({
                name: 'Leads Table Panel',
                width: 'fill_container',
                layout: 'vertical',
                cornerRadius: '$radius-lg',
                fill: '$bg-card',
                stroke: '$border-color',
                strokeWidth: 1,
                children: [
                  // Table Controls
                  frame({
                    name: 'Table Action Bar',
                    width: 'fill_container',
                    layout: 'horizontal',
                    justifyContent: 'space_between',
                    alignItems: 'center',
                    padding: [16, 20],
                    stroke: '$border-color',
                    strokeWidth: { bottom: 1 },
                    children: [
                      frame({
                        layout: 'horizontal',
                        gap: 12,
                        children: [
                          text('Lead Records', { fontSize: 15, fontWeight: 'bold', fill: '$text-main' }),
                          badge('4 Selected', { bg: '#6366F120', color: '#818CF8', border: '#6366F140' })
                        ]
                      }),
                      frame({
                        layout: 'horizontal',
                        gap: 10,
                        children: [
                          button('Mass Update', { variant: 'secondary', icon: 'edit' }),
                          button('Convert to Project', { variant: 'secondary', icon: 'folder-plus' }),
                          button('New Lead', { variant: 'primary', icon: 'plus' })
                        ]
                      })
                    ]
                  }),

                  // Table Header Row
                  frame({
                    name: 'Table Header Row',
                    width: 'fill_container',
                    layout: 'horizontal',
                    padding: [12, 20],
                    fill: '$bg-card-subtle',
                    stroke: '$border-subtle',
                    strokeWidth: { bottom: 1 },
                    children: [
                      text('LEAD NAME', { width: 220, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                      text('COMPANY / ACCOUNT', { width: 220, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                      text('EMAIL ADDRESS', { width: 220, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                      text('LIFECYCLE STAGE', { width: 160, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                      text('FIT SCORE', { width: 100, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                      text('OWNER REP', { width: 140, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' })
                    ]
                  }),

                  // Table Rows
                  ...leads.map(lead => frame({
                    name: `Row / ${lead.name}`,
                    width: 'fill_container',
                    layout: 'horizontal',
                    alignItems: 'center',
                    padding: [14, 20],
                    stroke: '$border-subtle',
                    strokeWidth: { bottom: 1 },
                    children: [
                      text(lead.name, { width: 220, fontSize: 13, fontWeight: '600', fill: '$text-main' }),
                      text(lead.company, { width: 220, fontSize: 13, fill: '$text-sub' }),
                      text(lead.email, { width: 220, fontSize: 12, fill: '$text-muted', fontFamily: '$font-mono' }),
                      frame({
                        width: 160,
                        children: [
                          badge(lead.stage, { bg: '#6366F120', color: '#818CF8', border: '#6366F140' })
                        ]
                      }),
                      frame({
                        width: 100,
                        children: [
                          badge(`${lead.score}%`, { bg: '#10B98120', color: '#10B981', border: '#10B98140' })
                        ]
                      }),
                      text(lead.rep, { width: 140, fontSize: 12, fill: '$text-sub' })
                    ]
                  }))
                ]
              })
            ]
          })
        ]
      })
    ]
  }));
}

// -----------------------------------------------------------------------------
// 5. PPM Portfolio Page (ppm-portfolio.pen)
// -----------------------------------------------------------------------------
function buildPpmPortfolioPage() {
  return createPenDoc('Executive Portfolios', frame({
    name: 'PPM Portfolio Canvas',
    width: 1440,
    height: 960,
    layout: 'horizontal',
    fill: '$bg-main',
    children: [
      buildSidebar('Executive Portfolios'),
      frame({
        name: 'Main Content Area',
        width: 'fill_container',
        height: 'fill_container',
        layout: 'vertical',
        children: [
          buildHeader('Executive Portfolios', 'Portfolio aggregation, strategic alignment & enterprise compliance'),
          frame({
            name: 'PPM Content',
            width: 'fill_container',
            height: 'fill_container',
            layout: 'vertical',
            padding: 24,
            gap: 20,
            children: [
              // Portfolio Metrics
              frame({
                name: 'Portfolio KPIs',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  statCard('Total Portfolio CapEx', '$1,850,000', '14 Active Programs', 'briefcase', '#6366F120', '#6366F1'),
                  statCard('Strategic Alignment', '94.2%', 'High Priority Focus', 'target', '#10B98120', '#10B981'),
                  statCard('Blended Project ROI', '3.8x', 'Calculated IRR 24%', 'bar-chart-3', '#F59E0B20', '#F59E0B'),
                  statCard('Governance Compliance', '99.1%', 'SOC2 / ISO Audited', 'shield-check', '#8B5CF620', '#8B5CF6')
                ]
              }),

              // Program Health Cards Grid
              frame({
                name: 'Programs Grid',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  buildProgramCard('Digital Core Modernization', 'Engineering', '$620K', '88% Health', '#10B981', '7 Active Spaces'),
                  buildProgramCard('Global CRM Re-architecture', 'Commercial', '$480K', '92% Health', '#10B981', '4 Active Spaces'),
                  buildProgramCard('Autonomous Agent Swarm', 'R&D Lab', '$750K', '74% Health', '#F59E0B', '5 Active Spaces')
                ]
              }),

              // Audit Trail Summary Box
              frame({
                name: 'Audit Trail Panel',
                width: 'fill_container',
                layout: 'vertical',
                padding: 20,
                gap: 12,
                cornerRadius: '$radius-lg',
                fill: '$bg-card',
                stroke: '$border-color',
                strokeWidth: 1,
                children: [
                  frame({
                    name: 'Audit Header',
                    width: 'fill_container',
                    layout: 'horizontal',
                    justifyContent: 'space_between',
                    children: [
                      text('Immutable Enterprise Audit Log', { fontSize: 14, fontWeight: 'bold', fill: '$text-main' }),
                      badge('SHA-256 VERIFIED', { bg: '#10B98115', color: '#10B981', border: '#10B98130' })
                    ]
                  }),
                  ...[
                    { event: 'Portfolio budget ceiling reallocated from OpEx to CapEx ($120K)', user: 'Executive Officer', time: '1 hour ago' },
                    { event: 'Risk mitigation checkpoint registered for Database Sharding milestone', user: 'Sentinel Agent', time: '3 hours ago' }
                  ].map(item => frame({
                    name: 'Audit Row',
                    width: 'fill_container',
                    layout: 'horizontal',
                    justifyContent: 'space_between',
                    padding: [10, 12],
                    cornerRadius: '$radius-md',
                    fill: '$bg-card-subtle',
                    children: [
                      frame({
                        layout: 'horizontal',
                        gap: 10,
                        alignItems: 'center',
                        children: [
                          icon('file-text', { width: 14, height: 14, fill: '$accent-primary' }),
                          text(item.event, { fontSize: 12, fill: '$text-main' })
                        ]
                      }),
                      text(item.time, { fontSize: 11, fill: '$text-muted', fontFamily: '$font-mono' })
                    ]
                  }))
                ]
              })
            ]
          })
        ]
      })
    ]
  }));
}

function buildProgramCard(title, dept, budget, health, healthColor, spaces) {
  return frame({
    name: `Program / ${title}`,
    width: 'fill_container',
    layout: 'vertical',
    padding: 18,
    gap: 14,
    cornerRadius: '$radius-lg',
    fill: '$bg-card',
    stroke: '$border-color',
    strokeWidth: 1,
    children: [
      frame({
        name: 'Header',
        width: 'fill_container',
        layout: 'horizontal',
        justifyContent: 'space_between',
        children: [
          badge(dept, { bg: '$bg-card-subtle', color: '$text-sub', border: '$border-color' }),
          badge(health, { bg: healthColor + '20', color: healthColor, border: healthColor + '40' })
        ]
      }),
      text(title, { fontSize: 15, fontWeight: 'bold', fill: '$text-main' }),
      frame({
        name: 'Stats',
        width: 'fill_container',
        layout: 'horizontal',
        justifyContent: 'space_between',
        stroke: '$border-subtle',
        strokeWidth: { top: 1 },
        padding: [10, 0, 0, 0],
        children: [
          frame({
            layout: 'vertical',
            gap: 2,
            children: [
              text('BUDGET', { fontSize: 10, fill: '$text-muted', fontFamily: '$font-mono' }),
              text(budget, { fontSize: 13, fontWeight: '600', fill: '$text-main' })
            ]
          }),
          frame({
            layout: 'vertical',
            gap: 2,
            alignItems: 'end',
            children: [
              text('SCOPE', { fontSize: 10, fill: '$text-muted', fontFamily: '$font-mono' }),
              text(spaces, { fontSize: 13, fill: '$text-sub' })
            ]
          })
        ]
      })
    ]
  });
}

// -----------------------------------------------------------------------------
// 6. PPM Financials Page (ppm-financials.pen)
// -----------------------------------------------------------------------------
function buildPpmFinancialsPage() {
  const budgetTiers = [
    { category: 'Capital Expenditure (CapEx)', allocated: '$450,000', spent: '$320,000', variance: '+$130,000', status: 'Healthy', color: '#10B981' },
    { category: 'Operational Expenditure (OpEx)', allocated: '$280,000', spent: '$265,000', variance: '+$15,000', status: 'Warning', color: '#F59E0B' },
    { category: 'Dedicated Engineering Labor', allocated: '$520,000', spent: '$410,000', variance: '+$110,000', status: 'Healthy', color: '#10B981' },
    { category: 'External Subcontractors & Audits', allocated: '$95,000', spent: '$92,000', variance: '+$3,000', status: 'Review Needed', color: '#EF4444' }
  ];

  return createPenDoc('PPM Financial Overview', frame({
    name: 'PPM Financials Canvas',
    width: 1440,
    height: 960,
    layout: 'horizontal',
    fill: '$bg-main',
    children: [
      buildSidebar('Financial Overview'),
      frame({
        name: 'Main Content Area',
        width: 'fill_container',
        height: 'fill_container',
        layout: 'vertical',
        children: [
          buildHeader('Portfolio Financial Intelligence', 'CapEx, OpEx & multi-tier cost variance monitoring and ceiling controls'),
          frame({
            name: 'Financial Content',
            width: 'fill_container',
            height: 'fill_container',
            layout: 'vertical',
            padding: 24,
            gap: 20,
            children: [
              // Financial Stats
              frame({
                name: 'Financial Stats Grid',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  statCard('Total Budget Pool', '$1,345,000', 'Approved FY26', 'calculator', '#6366F120', '#6366F1'),
                  statCard('Cumulative Burn', '$1,087,000', '80.8% of Ceiling', 'bar-chart-3', '#10B98120', '#10B981'),
                  statCard('Positive Variance', '$258,000', '+19.2% Under Budget', 'dollar-sign', '#10B98120', '#10B981'),
                  statCard('Monthly Run-Rate', '$94,500', 'Stable Run-Rate', 'receipt', '#8B5CF620', '#8B5CF6')
                ]
              }),

              // Multi-Tier Budget Table
              frame({
                name: 'Budget Table Panel',
                width: 'fill_container',
                layout: 'vertical',
                cornerRadius: '$radius-lg',
                fill: '$bg-card',
                stroke: '$border-color',
                strokeWidth: 1,
                children: [
                  frame({
                    name: 'Table Header Bar',
                    width: 'fill_container',
                    layout: 'horizontal',
                    justifyContent: 'space_between',
                    alignItems: 'center',
                    padding: [16, 20],
                    stroke: '$border-color',
                    strokeWidth: { bottom: 1 },
                    children: [
                      text('Multi-Tier Cost Breakdown & Allocation', { fontSize: 15, fontWeight: 'bold', fill: '$text-main' }),
                      button('Adjust Budget Ceiling', { variant: 'primary', icon: 'plus' })
                    ]
                  }),
                  // Table Column Titles
                  frame({
                    name: 'Columns Header',
                    width: 'fill_container',
                    layout: 'horizontal',
                    padding: [12, 20],
                    fill: '$bg-card-subtle',
                    children: [
                      text('TIER / COST CATEGORY', { width: 340, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                      text('ALLOCATED', { width: 180, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                      text('ACTUAL SPEND', { width: 180, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                      text('REMAINING VARIANCE', { width: 180, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' }),
                      text('CEILING STATUS', { width: 160, fontSize: 11, fontWeight: 'bold', fill: '$text-muted', fontFamily: '$font-mono' })
                    ]
                  }),
                  // Rows
                  ...budgetTiers.map(tier => frame({
                    name: `Row / ${tier.category}`,
                    width: 'fill_container',
                    layout: 'horizontal',
                    alignItems: 'center',
                    padding: [16, 20],
                    stroke: '$border-subtle',
                    strokeWidth: { bottom: 1 },
                    children: [
                      text(tier.category, { width: 340, fontSize: 13, fontWeight: '600', fill: '$text-main' }),
                      text(tier.allocated, { width: 180, fontSize: 13, fill: '$text-sub' }),
                      text(tier.spent, { width: 180, fontSize: 13, fill: '$text-sub' }),
                      text(tier.variance, { width: 180, fontSize: 13, fontWeight: 'bold', fill: tier.color }),
                      frame({
                        width: 160,
                        children: [
                          badge(tier.status, { bg: tier.color + '20', color: tier.color, border: tier.color + '40' })
                        ]
                      })
                    ]
                  }))
                ]
              })
            ]
          })
        ]
      })
    ]
  }));
}

// -----------------------------------------------------------------------------
// 7. PPM Risks Page (ppm-risks.pen)
// -----------------------------------------------------------------------------
function buildPpmRisksPage() {
  const riskMatrixRows = [
    { likelihood: 'Almost Certain', cols: ['#F59E0B', '#F59E0B', '#EF4444', '#EF4444', '#EF4444'] },
    { likelihood: 'Likely', cols: ['#10B981', '#F59E0B', '#F59E0B', '#EF4444', '#EF4444'] },
    { likelihood: 'Possible', cols: ['#10B981', '#10B981', '#F59E0B', '#F59E0B', '#EF4444'] },
    { likelihood: 'Unlikely', cols: ['#10B981', '#10B981', '#10B981', '#F59E0B', '#F59E0B'] },
    { likelihood: 'Rare', cols: ['#10B981', '#10B981', '#10B981', '#10B981', '#F59E0B'] }
  ];

  return createPenDoc('Risk Register & Matrix', frame({
    name: 'PPM Risks Canvas',
    width: 1440,
    height: 960,
    layout: 'horizontal',
    fill: '$bg-main',
    children: [
      buildSidebar('Risk Matrix & Register'),
      frame({
        name: 'Main Content Area',
        width: 'fill_container',
        height: 'fill_container',
        layout: 'vertical',
        children: [
          buildHeader('Enterprise Risk Management & 5x5 Matrix', 'Inter-team bottleneck analysis & critical-path risk propagation'),
          frame({
            name: 'Risks Content',
            width: 'fill_container',
            height: 'fill_container',
            layout: 'vertical',
            padding: 24,
            gap: 20,
            children: [
              // Risk Stats
              frame({
                name: 'Risk Stats Grid',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  statCard('Critical Tier Risks', '2 Open', 'Requires Mitigation', 'shield-alert', '#EF444420', '#EF4444'),
                  statCard('Moderate Exposure', '5 Monitored', 'Within Tolerance', 'shield', '#F59E0B20', '#F59E0B'),
                  statCard('Mitigation Plans', '8 Active', '100% Assigned', 'shield-check', '#10B98120', '#10B981'),
                  statCard('Dependency Bottlenecks', '3 Inter-Team', 'Tracked in Matrix', 'network', '#8B5CF620', '#8B5CF6')
                ]
              }),

              // 5x5 Matrix Panel and Risk List
              frame({
                name: 'Heatmap & Risk Register Row',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  // 5x5 Heatmap Box
                  frame({
                    name: '5x5 Heatmap Matrix',
                    width: 480,
                    layout: 'vertical',
                    padding: 20,
                    gap: 12,
                    cornerRadius: '$radius-lg',
                    fill: '$bg-card',
                    stroke: '$border-color',
                    strokeWidth: 1,
                    children: [
                      text('5x5 Probability vs Impact Heatmap', { fontSize: 14, fontWeight: 'bold', fill: '$text-main' }),
                      text('Y: Likelihood | X: Impact Severity', { fontSize: 11, fill: '$text-muted', fontFamily: '$font-mono' }),
                      frame({
                        name: 'Matrix Grid',
                        layout: 'vertical',
                        gap: 4,
                        children: riskMatrixRows.map(r => frame({
                          name: `Row / ${r.likelihood}`,
                          layout: 'horizontal',
                          gap: 4,
                          children: [
                            text(r.likelihood, { width: 90, fontSize: 10, fill: '$text-muted', fontFamily: '$font-mono' }),
                            ...r.cols.map((c, idx) => frame({
                              name: `Cell ${idx}`,
                              width: 60,
                              height: 38,
                              cornerRadius: '$radius-sm',
                              fill: c + '25',
                              stroke: c + '60',
                              strokeWidth: 1,
                              alignItems: 'center',
                              justifyContent: 'center',
                              children: [
                                (r.likelihood === 'Almost Certain' && idx === 3) ? badge('R-02', { bg: '#EF4444', color: '#FFF' }) :
                                (r.likelihood === 'Possible' && idx === 4) ? badge('R-01', { bg: '#EF4444', color: '#FFF' }) :
                                (r.likelihood === 'Likely' && idx === 1) ? badge('R-03', { bg: '#F59E0B', color: '#FFF' }) :
                                text('-', { fontSize: 11, fill: '$text-muted' })
                              ]
                            }))
                          ]
                        }))
                      })
                    ]
                  }),

                  // Active Risk Register List
                  frame({
                    name: 'Active Mitigations Panel',
                    width: 'fill_container',
                    layout: 'vertical',
                    padding: 20,
                    gap: 12,
                    cornerRadius: '$radius-lg',
                    fill: '$bg-card',
                    stroke: '$border-color',
                    strokeWidth: 1,
                    children: [
                      frame({
                        name: 'Header',
                        width: 'fill_container',
                        layout: 'horizontal',
                        justifyContent: 'space_between',
                        children: [
                          text('Critical Risk Mitigation Tracker', { fontSize: 14, fontWeight: 'bold', fill: '$text-main' }),
                          button('Register New Risk', { variant: 'primary', icon: 'plus' })
                        ]
                      }),
                      ...[
                        { id: 'RSK-01', title: 'WooCommerce Webhook Latency Spikes during Flash Sales', score: '20 (Critical)', owner: 'Worker Agent', plan: 'Action Scheduler Batch Offloading' },
                        { id: 'RSK-02', title: 'MySQL Deadlock on Concurrent Form Ingestion', score: '16 (High)', owner: 'Sentinel Agent', plan: 'Inject Non-blocking Row Locks & Read Replicas' },
                        { id: 'RSK-03', title: 'Google OAuth Token Expiration in CI Pipelines', score: '12 (Moderate)', owner: 'Auditor Agent', plan: 'Service Account ADC Token Rotation' }
                      ].map(r => frame({
                        name: `Risk / ${r.id}`,
                        width: 'fill_container',
                        layout: 'vertical',
                        padding: 14,
                        gap: 8,
                        cornerRadius: '$radius-md',
                        fill: '$bg-card-subtle',
                        stroke: '$border-subtle',
                        strokeWidth: 1,
                        children: [
                          frame({
                            width: 'fill_container',
                            layout: 'horizontal',
                            justifyContent: 'space_between',
                            children: [
                              frame({
                                layout: 'horizontal',
                                gap: 8,
                                children: [
                                  badge(r.id, { bg: '#EF444420', color: '#EF4444', border: '#EF444440' }),
                                  text(r.title, { fontSize: 13, fontWeight: '600', fill: '$text-main' })
                                ]
                              }),
                              badge(r.score, { bg: '#EF444420', color: '#EF4444', border: '#EF444440' })
                            ]
                          }),
                          frame({
                            width: 'fill_container',
                            layout: 'horizontal',
                            justifyContent: 'space_between',
                            children: [
                              text(`Mitigation: ${r.plan}`, { fontSize: 12, fill: '$text-sub' }),
                              text(`Assigned: ${r.owner}`, { fontSize: 11, fill: '$text-muted', fontFamily: '$font-mono' })
                            ]
                          })
                        ]
                      }))
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  }));
}

// -----------------------------------------------------------------------------
// 8. MCP Servers Page (mcp-servers.pen)
// -----------------------------------------------------------------------------
function buildMcpServersPage() {
  const mcpServers = [
    { name: 'StitchMCP (Google Cloud Remote)', transport: 'SSE / HTTP', status: 'Connected', latency: '42ms', tools: '6 Tools', desc: 'Remote enterprise stitch proxy for Google Cloud integrations.' },
    { name: 'Firebase MCP Server', transport: 'Local Stdio', status: 'Connected', latency: '8ms', tools: '14 Tools', desc: 'Firestore rules, auth state & cloud functions orchestrator.' },
    { name: 'GitHub MCP Server', transport: 'Docker Daemon', status: 'Connected', latency: '15ms', tools: '28 Tools', desc: 'Repository checkpoints, branch creation & PR reviews.' },
    { name: 'Pencil Design System MCP', transport: 'pen.dev CLI / Stdio', status: 'Connected', latency: '4ms', tools: '5 Tools', desc: 'Vector layout engine, auto-layout inspection & .pen file sync.' }
  ];

  return createPenDoc('MCP Servers Hub', frame({
    name: 'MCP Servers Canvas',
    width: 1440,
    height: 960,
    layout: 'horizontal',
    fill: '$bg-main',
    children: [
      buildSidebar('MCP & Agents'),
      frame({
        name: 'Main Content Area',
        width: 'fill_container',
        height: 'fill_container',
        layout: 'vertical',
        children: [
          buildHeader('Model Context Protocol Hub', 'Registered MCP servers, local transports, exposed tools & telemetry'),
          frame({
            name: 'MCP Content',
            width: 'fill_container',
            height: 'fill_container',
            layout: 'vertical',
            padding: 24,
            gap: 20,
            children: [
              // Summary Cards
              frame({
                name: 'MCP Stats Grid',
                width: 'fill_container',
                layout: 'horizontal',
                gap: 16,
                children: [
                  statCard('Connected MCP Servers', '4 Online', 'All healthy', 'cpu', '#6366F120', '#6366F1'),
                  statCard('Exposed Tool Functions', '53 Available', 'Ready for Subagents', 'workflow', '#10B98120', '#10B981'),
                  statCard('Avg Roundtrip Latency', '17.2ms', 'Real-time IPC', 'clock', '#F59E0B20', '#F59E0B'),
                  statCard('Token Auth Status', 'Valid', 'mcp_oauth_tokens.json', 'shield-check', '#8B5CF620', '#8B5CF6')
                ]
              }),

              // Server Cards Grid
              frame({
                name: 'Servers List',
                width: 'fill_container',
                layout: 'vertical',
                gap: 14,
                children: mcpServers.map(srv => frame({
                  name: `Server / ${srv.name}`,
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
                      width: 'fill_container',
                      layout: 'horizontal',
                      justifyContent: 'space_between',
                      alignItems: 'center',
                      children: [
                        frame({
                          layout: 'horizontal',
                          gap: 10,
                          alignItems: 'center',
                          children: [
                            frame({
                              width: 32,
                              height: 32,
                              cornerRadius: '$radius-md',
                              fill: '$bg-card-subtle',
                              alignItems: 'center',
                              justifyContent: 'center',
                              children: [
                                icon('cpu', { width: 16, height: 16, fill: '$accent-primary' })
                              ]
                            }),
                            frame({
                              layout: 'vertical',
                              gap: 2,
                              children: [
                                text(srv.name, { fontSize: 14, fontWeight: 'bold', fill: '$text-main' }),
                                text(srv.desc, { fontSize: 11, fill: '$text-muted' })
                              ]
                            })
                          ]
                        }),
                        frame({
                          layout: 'horizontal',
                          gap: 8,
                          children: [
                            badge(srv.transport, { bg: '$bg-card-subtle', color: '$text-sub', border: '$border-color' }),
                            badge(srv.tools, { bg: '#6366F120', color: '#818CF8', border: '#6366F140' }),
                            badge(srv.status, { bg: '#10B98120', color: '#10B981', border: '#10B98140' })
                          ]
                        })
                      ]
                    }),
                    frame({
                      width: 'fill_container',
                      layout: 'horizontal',
                      justifyContent: 'space_between',
                      alignItems: 'center',
                      stroke: '$border-subtle',
                      strokeWidth: { top: 1 },
                      padding: [10, 0, 0, 0],
                      children: [
                        text(`Roundtrip: ${srv.latency} | Auto-reconnect: Enabled`, { fontSize: 11, fill: '$text-muted', fontFamily: '$font-mono' }),
                        frame({
                          layout: 'horizontal',
                          gap: 8,
                          children: [
                            button('Inspect Tools', { variant: 'secondary', icon: 'search' }),
                            button('Test Ping', { variant: 'secondary', icon: 'zap' })
                          ]
                        })
                      ]
                    })
                  ]
                }))
              })
            ]
          })
        ]
      })
    ]
  }));
}

// -----------------------------------------------------------------------------
// 9. Login Page (login.pen)
// -----------------------------------------------------------------------------
function buildLoginPage() {
  return createPenDoc('Authentication Sign In', frame({
    name: 'Login Canvas',
    width: 1440,
    height: 900,
    layout: 'vertical',
    alignItems: 'center',
    justifyContent: 'center',
    fill: '$bg-main',
    children: [
      // Central Auth Card
      frame({
        name: 'Login Container Box',
        width: 440,
        layout: 'vertical',
        padding: 36,
        gap: 24,
        cornerRadius: '$radius-xl',
        fill: '$bg-card',
        stroke: '$border-color',
        strokeWidth: 1,
        children: [
          // Logo & Branding Header
          frame({
            name: 'Logo & Title',
            width: 'fill_container',
            layout: 'vertical',
            alignItems: 'center',
            gap: 12,
            children: [
              frame({
                width: 48,
                height: 48,
                cornerRadius: '$radius-lg',
                fill: '$accent-primary',
                alignItems: 'center',
                justifyContent: 'center',
                children: [
                  icon('shield-check', { width: 26, height: 26, fill: '#FFFFFF' })
                ]
              }),
              text('Shogun Projects 2.0', { fontSize: 20, fontWeight: 'bold', fill: '$text-main' }),
              text('Enterprise Multi-Agent Command Center', { fontSize: 12, fill: '$text-muted' })
            ]
          }),

          // Inputs Section
          frame({
            name: 'Form Fields',
            width: 'fill_container',
            layout: 'vertical',
            gap: 16,
            children: [
              // Email Field
              frame({
                name: 'Email Field Group',
                width: 'fill_container',
                layout: 'vertical',
                gap: 6,
                children: [
                  text('WORK EMAIL ADDRESS', { fontSize: 10, fontWeight: 'bold', fill: '$text-sub', fontFamily: '$font-mono' }),
                  frame({
                    name: 'Email Input',
                    width: 'fill_container',
                    layout: 'horizontal',
                    alignItems: 'center',
                    gap: 10,
                    padding: [10, 14],
                    cornerRadius: '$radius-md',
                    fill: '$bg-input',
                    stroke: '$border-color',
                    strokeWidth: 1,
                    children: [
                      icon('mail', { width: 14, height: 14, fill: '$text-muted' }),
                      text('admin@shogunate.solutions', { fontSize: 13, fill: '$text-main', fontFamily: '$font-mono' })
                    ]
                  })
                ]
              }),

              // Password Field
              frame({
                name: 'Password Field Group',
                width: 'fill_container',
                layout: 'vertical',
                gap: 6,
                children: [
                  frame({
                    width: 'fill_container',
                    layout: 'horizontal',
                    justifyContent: 'space_between',
                    children: [
                      text('PASSWORD', { fontSize: 10, fontWeight: 'bold', fill: '$text-sub', fontFamily: '$font-mono' }),
                      text('Forgot?', { fontSize: 11, fill: '$accent-primary' })
                    ]
                  }),
                  frame({
                    name: 'Password Input',
                    width: 'fill_container',
                    layout: 'horizontal',
                    alignItems: 'center',
                    justifyContent: 'space_between',
                    padding: [10, 14],
                    cornerRadius: '$radius-md',
                    fill: '$bg-input',
                    stroke: '$border-color',
                    strokeWidth: 1,
                    children: [
                      frame({
                        layout: 'horizontal',
                        gap: 10,
                        alignItems: 'center',
                        children: [
                          icon('lock', { width: 14, height: 14, fill: '$text-muted' }),
                          text('••••••••••••••••', { fontSize: 13, fill: '$text-main' })
                        ]
                      }),
                      icon('eye', { width: 14, height: 14, fill: '$text-muted' })
                    ]
                  })
                ]
              }),

              // Actions
              button('Sign In to Workspace', { variant: 'primary', icon: 'arrow-right' }),
              button('One-Click Demo Admin Login', { variant: 'secondary', icon: 'sparkles' })
            ]
          }),

          // Security Compliance Footer
          frame({
            name: 'Security Badge Footer',
            width: 'fill_container',
            layout: 'horizontal',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 6,
            children: [
              icon('shield-check', { width: 12, height: 12, fill: '#10B981' }),
              text('256-bit TLS / Multi-Tenant Isolation', { fontSize: 10, fill: '$text-muted', fontFamily: '$font-mono' })
            ]
          })
        ]
      })
    ]
  }));
}

// -----------------------------------------------------------------------------
// 10. Register Page (register.pen)
// -----------------------------------------------------------------------------
function buildRegisterPage() {
  return createPenDoc('Workspace Onboarding & Register', frame({
    name: 'Register Canvas',
    width: 1440,
    height: 900,
    layout: 'horizontal',
    alignItems: 'center',
    justifyContent: 'center',
    fill: '$bg-main',
    gap: 40,
    children: [
      // Left Hero Benefits Card
      frame({
        name: 'Benefits Feature Card',
        width: 440,
        layout: 'vertical',
        padding: 36,
        gap: 20,
        cornerRadius: '$radius-xl',
        fill: '$bg-card',
        stroke: '$border-color',
        strokeWidth: 1,
        children: [
          badge('ANTIGRAVITY 2.0 ECOSYSTEM', { bg: '#6366F120', color: '#818CF8', border: '#6366F140' }),
          text('Deploy Autonomous Multi-Agent Swarms with Total Architectural Governance', {
            fontSize: 22,
            fontWeight: 'bold',
            fill: '$text-main',
            lineHeight: 1.3
          }),
          ...[
            { title: 'Subagent Matrix (Sentinel, Worker, Auditor)', desc: 'Automated policy enforcement & AST code evaluation.' },
            { title: 'Full Enterprise PPM & VTiger CRM', desc: 'Multi-tier financials, 5x5 risk heatmaps & lead funnels.' },
            { title: 'Model Context Protocol Registry', desc: 'Secure MCP tools, local stdio and cloud remote SSE transports.' }
          ].map(f => frame({
            name: `Benefit / ${f.title}`,
            layout: 'vertical',
            gap: 4,
            children: [
              frame({
                layout: 'horizontal',
                gap: 8,
                alignItems: 'center',
                children: [
                  icon('check-circle-2', { width: 16, height: 16, fill: '#10B981' }),
                  text(f.title, { fontSize: 13, fontWeight: '600', fill: '$text-main' })
                ]
              }),
              text(f.desc, { fontSize: 11, fill: '$text-muted' })
            ]
          }))
        ]
      }),

      // Right Registration Form Card
      frame({
        name: 'Register Form Box',
        width: 460,
        layout: 'vertical',
        padding: 36,
        gap: 20,
        cornerRadius: '$radius-xl',
        fill: '$bg-card',
        stroke: '$border-color',
        strokeWidth: 1,
        children: [
          frame({
            name: 'Header',
            layout: 'vertical',
            gap: 4,
            children: [
              text('Create Tenant Workspace', { fontSize: 20, fontWeight: 'bold', fill: '$text-main' }),
              text('Get started with your dedicated enterprise sandbox.', { fontSize: 12, fill: '$text-muted' })
            ]
          }),
          // Inputs
          ...[
            { label: 'YOUR FULL NAME', placeholder: 'Lord Tokugawa', iconName: 'user' },
            { label: 'WORK EMAIL', placeholder: 'tokugawa@shogunate.solutions', iconName: 'mail' },
            { label: 'ORGANIZATION / TENANT SLUG', placeholder: 'TokogawaSA', iconName: 'building-2' },
            { label: 'MASTER PASSWORD', placeholder: '••••••••••••••••', iconName: 'lock' }
          ].map(inp => frame({
            name: `Input / ${inp.label}`,
            width: 'fill_container',
            layout: 'vertical',
            gap: 6,
            children: [
              text(inp.label, { fontSize: 10, fontWeight: 'bold', fill: '$text-sub', fontFamily: '$font-mono' }),
              frame({
                width: 'fill_container',
                layout: 'horizontal',
                alignItems: 'center',
                gap: 10,
                padding: [10, 14],
                cornerRadius: '$radius-md',
                fill: '$bg-input',
                stroke: '$border-color',
                strokeWidth: 1,
                children: [
                  icon(inp.iconName, { width: 14, height: 14, fill: '$text-muted' }),
                  text(inp.placeholder, { fontSize: 12, fill: '$text-sub' })
                ]
              })
            ]
          })),

          button('Initialize Organization Workspace', { variant: 'primary', icon: 'arrow-right' })
        ]
      })
    ]
  }));
}

// -----------------------------------------------------------------------------
// Main Execution
// -----------------------------------------------------------------------------
console.log('Generating all 10 page .pen design files...');

writePenFile('dashboard.pen', buildDashboardPage());
writePenFile('projects.pen', buildProjectsPage());
writePenFile('taskboard.pen', buildTaskBoardPage());
writePenFile('crm-leads.pen', buildCrmLeadsPage());
writePenFile('ppm-portfolio.pen', buildPpmPortfolioPage());
writePenFile('ppm-financials.pen', buildPpmFinancialsPage());
writePenFile('ppm-risks.pen', buildPpmRisksPage());
writePenFile('mcp-servers.pen', buildMcpServersPage());
writePenFile('login.pen', buildLoginPage());
writePenFile('register.pen', buildRegisterPage());

console.log('All 10 .pen design files created successfully in designs/ directory!');
