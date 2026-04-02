import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html') and f != 'login.html']

dropdown_style = """  <style>
    /* Dropdown CSS for Desktop Nav */
    .nav-dropdown { position: relative; display: flex; align-items: center; height: 100%; }
    .nav-dropdown-content {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      background-color: var(--bg-card);
      min-width: 180px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      z-index: 100;
      flex-direction: column;
      padding: 8px 0;
      animation: fade-down 0.2s ease;
    }
    .nav-dropdown:hover .nav-dropdown-content { display: flex; }
    .nav-dropdown-item {
      color: var(--text-secondary);
      padding: 10px 16px;
      text-decoration: none;
      font-size: 0.95rem;
      font-weight: 500;
      transition: all 0.2s;
    }
    .nav-dropdown-item:hover {
      background-color: var(--bg-elevated);
      color: var(--clr-primary);
      padding-left: 20px;
    }
    @keyframes fade-down { from {opacity:0; transform:translateY(-10px);} to {opacity:1; transform:translateY(0);} }
  </style>"""

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip files that don't have a navbar
    if '<div class="nav-links">' not in content:
        continue

    basename = file.replace('.html', '')

    def get_active(name):
        return ' active' if basename == name else ''

    desktop_nav_flat = f"""    <div class="nav-links">
      <a href="index.html" class="nav-link{get_active('index')}">🏠 Home</a>
      <a href="dashboard.html" class="nav-link{get_active('dashboard')}">📊 Dashboard</a>
      <a href="quizzes.html" class="nav-link{get_active('quizzes')}">📝 Quizzes</a>
      <a href="missions.html" class="nav-link{get_active('missions')}">🌍 Missions</a>
      <a href="leaderboard.html" class="nav-link{get_active('leaderboard')}">🏆 Leaderboard</a>
      <a href="badges.html" class="nav-link{get_active('badges')}">🏅 Badges</a>
      <a href="recommendations.html" class="nav-link{get_active('recommendations')}">🤖 AI Tips</a>
      <a href="game.html" class="nav-link{get_active('game')}" style="color:var(--clr-gold);border:1px solid rgba(245,158,11,0.25);border-radius:var(--radius-full);padding:6px 14px">🎮 Game</a>
    </div>"""

    desktop_nav_dropdown = f"""    <div class="nav-links">
      <a href="index.html" class="nav-link{get_active('index')}"><span class="nav-icon">🏠</span> Home</a>
      <a href="dashboard.html" class="nav-link{get_active('dashboard')}"><span class="nav-icon">📊</span> Dashboard</a>
      
      <div class="nav-dropdown">
        <button class="nav-link" style="background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:inherit;display:flex;align-items:center;padding:12px;color:var(--text-primary)">
          <span class="nav-icon">🌟</span> Activities <span style="font-size:0.6em;margin-left:6px;opacity:0.7">▼</span>
        </button>
        <div class="nav-dropdown-content">
          <a href="quizzes.html" class="nav-dropdown-item">📝 Quizzes</a>
          <a href="missions.html" class="nav-dropdown-item">🌍 Missions</a>
          <a href="catalog.html" class="nav-dropdown-item">🛒 Rewards Catalog</a>
          <a href="leaderboard.html" class="nav-dropdown-item">🏆 Leaderboard</a>
          <a href="badges.html" class="nav-dropdown-item">🏅 Badges</a>
          <a href="recommendations.html" class="nav-dropdown-item">🤖 AI Tips</a>
        </div>
      </div>
      
      <a href="game.html" class="nav-link{get_active('game')}" style="color:var(--clr-gold);border:1px solid rgba(245,158,11,0.25);border-radius:var(--radius-full);padding:6px 14px"><span class="nav-icon">🎮</span> Game</a>
    </div>"""
    
    mobile_nav_flat = f"""  <div class="mobile-nav-links">
    <a href="index.html" class="mobile-nav-link{get_active('index')}">🏠 Home</a>
    <a href="dashboard.html" class="mobile-nav-link{get_active('dashboard')}">📊 Dashboard</a>
    <a href="quizzes.html" class="mobile-nav-link{get_active('quizzes')}">📝 Quizzes</a>
    <a href="missions.html" class="mobile-nav-link{get_active('missions')}">🌍 Missions</a>
    <a href="leaderboard.html" class="mobile-nav-link{get_active('leaderboard')}">🏆 Leaderboard</a>
    <a href="badges.html" class="mobile-nav-link{get_active('badges')}">🏅 Badges</a>
    <a href="recommendations.html" class="mobile-nav-link{get_active('recommendations')}">🤖 AI Tips</a>
    <a href="game.html" class="mobile-nav-link{get_active('game')}" style="color:var(--clr-gold)">🎮 Game</a>
  </div>"""

    mobile_nav_dropdown = f"""  <div class="mobile-nav-links">
    <a href="index.html" class="mobile-nav-link{get_active('index')}">🏠 Home</a>
    <a href="dashboard.html" class="mobile-nav-link{get_active('dashboard')}">📊 Dashboard</a>
    <a href="quizzes.html" class="mobile-nav-link{get_active('quizzes')}">📝 Quizzes</a>
    <a href="catalog.html" class="mobile-nav-link{get_active('catalog')}">🛒 Catalog</a>
    <a href="missions.html" class="mobile-nav-link{get_active('missions')}">🌍 Missions</a>
    <a href="leaderboard.html" class="mobile-nav-link{get_active('leaderboard')}">🏆 Leaderboard</a>
    <a href="badges.html" class="mobile-nav-link{get_active('badges')}">🏅 Badges</a>
    <a href="recommendations.html" class="mobile-nav-link{get_active('recommendations')}">🤖 AI Tips</a>
    <a href="game.html" class="mobile-nav-link{get_active('game')}" style="color:var(--clr-gold)">🎮 Game</a>
  </div>"""

    if file in ('index.html', 'dashboard.html'):
        # Inject inline style to <head> if not already there
        if '/* Dropdown CSS for Desktop Nav */' not in content:
            if '</head>' in content:
                content = content.replace('</head>', dropdown_style + '\n</head>')
        desktop_nav = desktop_nav_dropdown
        mobile_nav = mobile_nav_dropdown
    else:
        desktop_nav = desktop_nav_flat
        mobile_nav = mobile_nav_flat

    # Replace desktop nav
    content = re.sub(r'[ \t]*<div class="nav-links">.*?</div>\s*<div class="nav-right">', desktop_nav + '\n    <div class="nav-right">', content, flags=re.DOTALL)
    
    # Replace mobile nav
    content = re.sub(r'[ \t]*<div class="mobile-nav-links">.*?</div>\s*</div>(?=\s*<!--|\s*<div class="page-wrapper"|\s*<section)', mobile_nav + '\n</div>', content, flags=re.DOTALL)

    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print("Undo complete")
