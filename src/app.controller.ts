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
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FamilyRoots API Dashboard</title>
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
      background: linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.25)),
                  url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80') center/cover no-repeat fixed;
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
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      text-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .login-btn {
      background: #e76f80;
      color: #ffffff;
      padding: 12px 34px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 1rem;
      box-shadow: 0 4px 15px rgba(231, 111, 128, 0.4);
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .login-btn:hover {
      transform: translateY(-2px);
      background: #d85c6f;
      box-shadow: 0 6px 20px rgba(231, 111, 128, 0.6);
    }

    /* Hero Section */
    .hero-container {
      width: 100%;
      max-width: 1100px;
      text-align: center;
      margin: 40px 0;
    }
    .main-title {
      font-size: clamp(2.8rem, 6vw, 4.5rem);
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -1px;
      text-shadow: 0 4px 25px rgba(0, 0, 0, 0.4);
      margin-bottom: 35px;
    }

    /* Modules Grid */
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 18px;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
    }
    .module-pill {
      background: #ff7597;
      color: #ffffff;
      padding: 16px 24px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 800;
      font-style: italic;
      font-size: 1.1rem;
      letter-spacing: 0.5px;
      text-align: center;
      box-shadow: 0 6px 20px rgba(255, 117, 151, 0.4);
      transition: all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: 1px solid rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .module-pill:hover {
      transform: translateY(-4px) scale(1.03);
      background: #ff5c84;
      box-shadow: 0 10px 25px rgba(255, 117, 151, 0.6);
    }
    .module-pill.wide {
      grid-column: span 2;
    }

    /* Footer Section */
    .footer-container {
      text-align: center;
      margin-top: 40px;
    }
    .footer-text {
      font-size: 1.1rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
      margin-bottom: 8px;
    }
    .footer-text span {
      text-decoration: underline;
      font-weight: 800;
      font-style: italic;
    }
    .subtitle-text {
      font-size: 1rem;
      color: #26e4f3;
      font-weight: 700;
      font-style: italic;
      text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    }

    @media (max-width: 900px) {
      .modules-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .module-pill.wide {
        grid-column: span 1;
      }
    }
    @media (max-width: 500px) {
      .modules-grid {
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
      <span>FamilyRoots</span>
    </a>
    <a href="/api/docs#/Auth" class="login-btn">Log In</a>
  </header>

  <!-- Hero Container -->
  <main class="hero-container">
    <h1 class="main-title">FamilyRoots API Dashboard</h1>

    <!-- Buttons Grid -->
    <div class="modules-grid">
      <a href="/api/docs#/Users" class="module-pill">USER</a>
      <a href="/api/docs#/Users" class="module-pill">REELS</a>
      <a href="/api/docs#/Users" class="module-pill">ADMIN</a>
      <a href="/api/docs" class="module-pill">PUBLIC</a>

      <a href="/health" class="module-pill">META</a>
      <a href="/api/docs" class="module-pill">SITE</a>
      <a href="/api/docs" class="module-pill">CREATOR</a>
      <a href="/api/docs#/Auth" class="module-pill">AUTH</a>

      <a href="/api/docs" class="module-pill wide">SUMMARY</a>
      <a href="/api/docs" class="module-pill wide">NOTIFICATIONS</a>

      <a href="/api/docs" class="module-pill wide">SWAGGER OPENAPI DOCS</a>
      <a href="/health" class="module-pill wide">SYSTEM HEALTH STATUS</a>
    </div>
  </main>

  <!-- Footer -->
  <footer class="footer-container">
    <p class="footer-text">Developed by : <span>FamilyRoots SaaS Engine</span></p>
    <p class="subtitle-text">NestJS & PostgreSQL Architecture</p>
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

