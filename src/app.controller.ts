import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html')
  @ApiOperation({ summary: 'Backend Interactive Dashboard' })
  getDashboard(): string {
    const frontendUrl = process.env.FRONTEND_URL || 'https://family-together-eta.vercel.app';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FamilyRoots API Sanctuary Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      width: 100%;
      background: linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.85)),
                  url('https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1920&q=80') center/cover no-repeat fixed;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      padding: 30px 20px;
      color: #ffffff;
      overflow-x: hidden;
    }
    /* Top Header Bar */
    .header-bar {
      width: 100%;
      max-width: 1200px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      color: #ffffff;
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.4);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .frontend-btn {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
      padding: 10px 22px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
      border: 1px solid rgba(255, 255, 255, 0.25);
      backdrop-filter: blur(10px);
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .frontend-btn:hover {
      background: rgba(255, 255, 255, 0.22);
      transform: translateY(-2px);
    }
    .login-btn {
      background: #6366f1;
      color: #ffffff;
      padding: 10px 24px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .login-btn:hover {
      transform: translateY(-2px);
      background: #4f46e5;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6);
    }

    /* Hero Section */
    .hero-container {
      width: 100%;
      max-width: 1100px;
      text-align: center;
      margin: 30px 0;
    }
    .main-title {
      font-size: clamp(2.5rem, 5.5vw, 4.2rem);
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -1px;
      text-shadow: 0 4px 25px rgba(0, 0, 0, 0.5);
      margin-bottom: 10px;
    }
    .main-subtitle {
      font-size: 1.1rem;
      color: #cbd5e1;
      font-weight: 600;
      margin-bottom: 35px;
    }

    /* Roles Bar */
    .roles-section-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #818cf8;
      font-weight: 800;
      margin-bottom: 16px;
    }
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto 30px auto;
    }
    .role-pill {
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      color: #ffffff;
      padding: 14px 20px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 800;
      font-size: 0.95rem;
      letter-spacing: 0.5px;
      text-align: center;
      box-shadow: 0 6px 18px rgba(79, 70, 229, 0.35);
      transition: all 0.25s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .role-pill:hover {
      transform: translateY(-3px) scale(1.02);
      background: linear-gradient(135deg, #4338ca, #4f46e5);
      box-shadow: 0 10px 22px rgba(79, 70, 229, 0.5);
    }

    /* System Modules Grid */
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
    }
    .module-pill {
      background: #ec4899;
      color: #ffffff;
      padding: 15px 22px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 800;
      font-style: italic;
      font-size: 0.95rem;
      letter-spacing: 0.5px;
      text-align: center;
      box-shadow: 0 6px 20px rgba(236, 72, 153, 0.35);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .module-pill:hover {
      transform: translateY(-4px) scale(1.03);
      background: #db2777;
      box-shadow: 0 10px 25px rgba(236, 72, 153, 0.55);
    }
    .module-pill.wide {
      grid-column: span 2;
    }
    .module-pill.cyan {
      background: #06b6d4;
      box-shadow: 0 6px 20px rgba(6, 182, 212, 0.35);
    }
    .module-pill.cyan:hover {
      background: #0891b2;
      box-shadow: 0 10px 25px rgba(6, 182, 212, 0.55);
    }
    .module-pill.emerald {
      background: #10b981;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
    }
    .module-pill.emerald:hover {
      background: #059669;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.55);
    }

    /* Frontend Portal Section */
    .frontend-section {
      margin-top: 40px;
      padding: 22px 28px;
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      max-width: 1000px;
      margin-left: auto;
      margin-right: auto;
      backdrop-filter: blur(12px);
    }
    .frontend-section-title {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #38bdf8;
      font-weight: 800;
      margin-bottom: 6px;
    }
    .frontend-desc {
      font-size: 0.9rem;
      color: #cbd5e1;
      margin-bottom: 16px;
    }
    .frontend-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }
    .frontend-pill {
      background: rgba(255, 255, 255, 0.08);
      color: #f1f5f9;
      padding: 11px 16px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 700;
      font-size: 0.85rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s ease;
    }
    .frontend-pill:hover {
      background: rgba(255, 255, 255, 0.18);
      color: #38bdf8;
      transform: translateY(-2px);
      border-color: #38bdf8;
    }
    .frontend-pill .material-symbols-outlined {
      font-size: 16px;
    }

    /* Footer Section */
    .footer-container {
      text-align: center;
      margin-top: 35px;
    }
    .footer-text {
      font-size: 1rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
      margin-bottom: 6px;
    }
    .footer-text span {
      text-decoration: underline;
      font-weight: 800;
      font-style: italic;
    }
    .subtitle-text {
      font-size: 0.95rem;
      color: #38bdf8;
      font-weight: 700;
      font-style: italic;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    @media (max-width: 900px) {
      .roles-grid, .modules-grid, .frontend-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .module-pill.wide {
        grid-column: span 1;
      }
    }
    @media (max-width: 500px) {
      .roles-grid, .modules-grid, .frontend-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <!-- Header Bar -->
  <header class="header-bar">
    <a href="/" class="brand">
      <span class="material-symbols-outlined">account_tree</span>
      <span>FamilyRoots Backend API</span>
    </a>
    <div class="header-actions">
      <a href="${frontendUrl}" target="_blank" rel="noopener noreferrer" class="frontend-btn">
        <span class="material-symbols-outlined" style="font-size: 18px;">open_in_new</span>
        Frontend Web App
      </a>
      <a href="/api/docs#/Auth" class="login-btn">
        <span class="material-symbols-outlined" style="font-size: 18px;">key</span>
        API Auth / Sign In
      </a>
    </div>
  </header>

  <!-- Hero Container -->
  <main class="hero-container">
    <h1 class="main-title">FamilyRoots API Sanctuary</h1>
    <p class="main-subtitle">Privacy-First Lineage Engine • NestJS REST APIs & PostgreSQL Vault</p>

    <!-- Role Based Backend API Endpoints -->
    <div class="roles-section-title">Backend API Role Endpoints (Swagger Docs)</div>
    <div class="roles-grid">
      <a href="/api/docs#/Users" class="role-pill">SUPER ADMIN API</a>
      <a href="/api/docs#/Users" class="role-pill">ADMIN API</a>
      <a href="/api/docs#/Family%20Sanctuary" class="role-pill">OWNER SANCTUARY API</a>
      <a href="/api/docs#/Family%20Sanctuary" class="role-pill">MEMBER API</a>
    </div>

    <!-- Active System Sanctuary Modules -->
    <div class="roles-section-title">Active Sanctuary REST API Modules</div>
    <div class="modules-grid">
      <a href="/api/docs#/Family%20Sanctuary" class="module-pill">FAMILY SANCTUARY API</a>
      <a href="/api/docs#/Family%20Sanctuary" class="module-pill">MEMBERS & DEDUPLICATION</a>
      <a href="/api/docs#/Family%20Sanctuary" class="module-pill">RELATIONSHIPS API</a>
      <a href="/api/docs#/Family%20Sanctuary" class="module-pill">MEMORIES VAULT API</a>

      <a href="/api/docs#/Family%20Sanctuary" class="module-pill">EVENTS CALENDAR API</a>
      <a href="/api/docs#/Family%20Sanctuary" class="module-pill">DOCUMENTS ARCHIVE API</a>
      <a href="/api/docs#/Family%20Sanctuary" class="module-pill">INVITATIONS API</a>
      <a href="/api/docs#/Auth" class="module-pill">AUTH & SECURITY API</a>

      <a href="/api/docs" class="module-pill wide cyan">SWAGGER OPENAPI DOCS</a>
      <a href="/health" class="module-pill wide emerald">SYSTEM HEALTH STATUS</a>
    </div>

    <!-- Frontend Web Application Portal Links -->
    <div class="frontend-section">
      <div class="frontend-section-title">Client-Side Web Application (UI)</div>
      <p class="frontend-desc">Looking for the visual React/Next.js interface? Access role dashboards in the web client (requires authentication):</p>
      <div class="frontend-grid">
        <a href="${frontendUrl}/admin-dashboard/super" target="_blank" rel="noopener noreferrer" class="frontend-pill">
          Super Admin UI <span class="material-symbols-outlined">open_in_new</span>
        </a>
        <a href="${frontendUrl}/admin-dashboard" target="_blank" rel="noopener noreferrer" class="frontend-pill">
          Admin UI <span class="material-symbols-outlined">open_in_new</span>
        </a>
        <a href="${frontendUrl}/owner-dashboard" target="_blank" rel="noopener noreferrer" class="frontend-pill">
          Owner Sanctuary UI <span class="material-symbols-outlined">open_in_new</span>
        </a>
        <a href="${frontendUrl}/user-dashboard" target="_blank" rel="noopener noreferrer" class="frontend-pill">
          Member UI <span class="material-symbols-outlined">open_in_new</span>
        </a>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer-container">
    <p class="footer-text">Developed by : <span>FamilyRoots SaaS Engine</span></p>
    <p class="subtitle-text">NestJS v11 & PostgreSQL Prisma ORM 7</p>
  </footer>
</body>
</html>`;
  }

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  @ApiResponse({ status: 200, description: 'Returns system operational status' })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'family-together-backend',
    };
  }
}
