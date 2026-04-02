/* ═══════════════════════════════════════════════════════════
   app.js – EcoQuest game-state engine & UI utilities
   ═══════════════════════════════════════════════════════════ */

const EQ = {

  // ── Level Definitions ──
  LEVELS: [
    { name: 'Seedling',  icon: '🌱', minXP: 0 },
    { name: 'Sprout',    icon: '🌿', minXP: 300 },
    { name: 'Sapling',   icon: '🌳', minXP: 800 },
    { name: 'Tree',      icon: '🌲', minXP: 1800 },
    { name: 'Guardian',  icon: '🦺', minXP: 3500 },
    { name: 'EcoHero',   icon: '⚡', minXP: 6000 },
  ],

  // ── Badge Definitions ──
  BADGES: [
    { id: 'first-quiz',      name: 'Quiz Starter',      icon: '📝', desc: 'Complete your first quiz',           condition: s => s.quizzesCompleted >= 1 },
    { id: 'quiz-5',          name: 'Quiz Enthusiast',    icon: '📚', desc: 'Complete 5 quizzes',                 condition: s => s.quizzesCompleted >= 5 },
    { id: 'quiz-master',     name: 'Quiz Master',        icon: '🎓', desc: 'Complete all quizzes',               condition: s => s.quizzesCompleted >= 25 },
    { id: 'perfect-score',   name: 'Perfect Score',      icon: '💯', desc: 'Score 100% on any quiz',             condition: s => s.perfectQuizzes >= 1 },
    { id: 'first-mission',   name: 'First Mission',      icon: '🌍', desc: 'Complete your first eco mission',    condition: s => s.missionsCompleted >= 1 },
    { id: 'eco-warrior',     name: 'Eco Warrior',        icon: '⚔️', desc: 'Complete 10 eco missions',           condition: s => s.missionsCompleted >= 10 },
    { id: 'tree-planter',    name: 'Tree Planter',       icon: '🌳', desc: 'Plant your first tree',              condition: s => s.treesPlanted >= 1 },
    { id: 'forest-maker',    name: 'Forest Maker',       icon: '🏕️', desc: 'Plant 10 trees',                     condition: s => s.treesPlanted >= 10 },
    { id: 'co2-saver',       name: 'CO₂ Saver',          icon: '💨', desc: 'Save 1 kg of CO₂',                   condition: s => s.co2Saved >= 1 },
    { id: 'co2-champion',    name: 'CO₂ Champion',       icon: '🏆', desc: 'Save 50 kg of CO₂',                  condition: s => s.co2Saved >= 50 },
    { id: 'streak-3',        name: '3-Day Streak',       icon: '🔥', desc: 'Login for 3 consecutive days',       condition: s => s.streak >= 3 },
    { id: 'streak-7',        name: 'Weekly Warrior',     icon: '📅', desc: 'Login for 7 consecutive days',       condition: s => s.streak >= 7 },
    { id: 'xp-500',          name: 'XP Hunter',          icon: '✨', desc: 'Earn 500 XP',                        condition: s => s.totalXP >= 500 },
    { id: 'xp-2000',         name: 'XP Legend',          icon: '⭐', desc: 'Earn 2000 XP',                       condition: s => s.totalXP >= 2000 },
    { id: 'eco-hero',        name: 'EcoHero',            icon: '⚡', desc: 'Reach EcoHero level (6000 XP)',      condition: s => s.totalXP >= 6000 },
    { id: 'recycle-10',      name: 'Sorter',             icon: '♻️', desc: 'Recycle 10 items',               condition: s => s.itemsRecycled >= 10, color: 'green' },
    { id: 'recycle-50',      name: 'Recycling Hero',     icon: '🗑️', desc: 'Recycle 50 items',               condition: s => s.itemsRecycled >= 50, color: 'silver' },
    { id: 'water-100',       name: 'Water Saver',        icon: '💧', desc: 'Save 100L of water',             condition: s => s.waterSaved >= 100, color: 'blue' },
    { id: 'energy-star',     name: 'Energy Star',        icon: '💡', desc: 'Save 50 kWh of energy',          condition: s => s.energySaved >= 50, color: 'gold' },
    { id: 'social-butterfly',name: 'Eco Influencer',     icon: '📱', desc: 'Share 5 achievements',           condition: s => s.shares >= 5, color: 'purple' },
  ],

  // ── Default State ──
  _defaultState: {
    totalXP: 720,
    quizzesCompleted: 3,
    perfectQuizzes: 0,
    missionsCompleted: 1,
    treesPlanted: 0,
    co2Saved: 4.2,
    streak: 1,
    itemsRecycled: 12,
    waterSaved: 45,
    energySaved: 15,
    shares: 2,
    weeklyXP: [80, 120, 60, 140, 95, 110, 115],
    unlockedBadges: ['first-quiz', 'first-mission'],
    purchasedItems: [],
  },

  /** Get persisted game state */
  getState() {
    const stored = localStorage.getItem('eq_state');
    if (stored) {
      try { return { ...EQ._defaultState, ...JSON.parse(stored) }; } catch (e) { /* ignore */ }
    }
    return { ...EQ._defaultState };
  },

  /** Merge partial update into game state */
  setState(patch) {
    const current = EQ.getState();
    const next = { ...current, ...patch };
    localStorage.setItem('eq_state', JSON.stringify(next));
    EQ._syncNavbar(next);
    return next;
  },

  /** Get level object for a given XP */
  getLevel(xp) {
    let level = EQ.LEVELS[0];
    let index = 0;
    for (let i = EQ.LEVELS.length - 1; i >= 0; i--) {
      if (xp >= EQ.LEVELS[i].minXP) { level = EQ.LEVELS[i]; index = i; break; }
    }
    return { ...level, index };
  },

  /** Get 0-100 progress towards next level */
  getLevelProgress(xp) {
    const level = EQ.getLevel(xp);
    const next = EQ.LEVELS[level.index + 1];
    if (!next) return 100;
    const range = next.minXP - level.minXP;
    const progress = xp - level.minXP;
    return Math.min(100, Math.round((progress / range) * 100));
  },

  /** Award XP with toast and navbar update */
  awardXP(amount, message) {
    const s = EQ.getState();
    const newXP = s.totalXP + amount;
    EQ.setState({ totalXP: newXP });
    EQ.showToast('success', `+${amount} XP`, message || 'Keep it up!');

    // Check for level-up
    const oldLevel = EQ.getLevel(s.totalXP);
    const newLevel = EQ.getLevel(newXP);
    if (newLevel.index > oldLevel.index) {
      setTimeout(() => {
        EQ.showToast('success', `🎉 Level Up!`, `You are now ${newLevel.icon} ${newLevel.name}!`);
        EQ.triggerConfetti(60);
      }, 800);
    }

    // Check for new badges
    const state = EQ.getState();
    EQ.BADGES.forEach(badge => {
      if (!state.unlockedBadges.includes(badge.id) && badge.condition(state)) {
        state.unlockedBadges.push(badge.id);
        EQ.setState({ unlockedBadges: state.unlockedBadges });
        setTimeout(() => {
          EQ.showToast('success', `${badge.icon} Badge Unlocked!`, badge.name);
        }, 1600);
      }
    });
  },

  /** Spend XP for catalog purchases. Returns true if successful, false otherwise. */
  spendXP(amount, itemTitle) {
    const s = EQ.getState();
    if (s.totalXP < amount) {
      EQ.showToast('error', 'Not Enough XP', `You need ${amount - s.totalXP} more XP to buy this.`);
      return false;
    }
    const newXP = s.totalXP - amount;
    
    const purchased = s.purchasedItems || [];
    if (itemTitle && !purchased.includes(itemTitle)) {
      purchased.push(itemTitle);
    }
    
    EQ.setState({ totalXP: newXP, purchasedItems: purchased });
    EQ.showToast('success', `Item Unlocked!`, `Successfully purchased: ${itemTitle}`);
    EQ.triggerConfetti(30);
    return true;
  },

  // ── Toast Notifications ──
  showToast(type, title, desc) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = { success: '✓', error: '✗', warning: '⚠', info: 'ℹ' };
    const colors = {
      success: 'rgba(0,200,150,0.15)',
      error: 'rgba(239,68,68,0.15)',
      warning: 'rgba(245,158,11,0.15)',
      info: 'rgba(59,130,246,0.15)'
    };
    const borderColors = {
      success: 'rgba(0,200,150,0.3)',
      error: 'rgba(239,68,68,0.3)',
      warning: 'rgba(245,158,11,0.3)',
      info: 'rgba(59,130,246,0.3)'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      display:flex;align-items:flex-start;gap:10px;padding:14px 18px;
      background:${colors[type] || colors.info};
      border:1px solid ${borderColors[type] || borderColors.info};
      border-radius:12px;margin-bottom:8px;min-width:280px;max-width:380px;
      animation:toast-in 0.35s ease;font-family:'Inter',system-ui,sans-serif;
      box-shadow:0 8px 32px rgba(0,0,0,0.3);backdrop-filter:blur(12px);
    `;

    toast.innerHTML = `
      <div style="font-size:1.1rem;margin-top:1px">${icons[type] || icons.info}</div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:0.875rem;color:#E6EDF3">${title}</div>
        ${desc ? `<div style="font-size:0.8rem;color:#8B949E;margin-top:3px">${desc}</div>` : ''}
      </div>
      <button onclick="this.parentElement.remove()" style="background:none;border:none;color:#484F58;cursor:pointer;font-size:1rem;padding:0;line-height:1">×</button>
    `;

    container.appendChild(toast);

    // Auto-remove after 4s
    setTimeout(() => {
      toast.style.animation = 'toast-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // ── Confetti ──
  triggerConfetti(count = 40) {
    const colors = ['#00C896', '#7C3AED', '#F59E0B', '#3B82F6', '#EF4444', '#EC4899'];
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const size = 6 + Math.random() * 6;
      const color = colors[Math.floor(Math.random() * colors.length)];
      el.style.cssText = `
        position:fixed;top:-10px;left:${Math.random() * 100}vw;
        width:${size}px;height:${size}px;background:${color};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        pointer-events:none;z-index:99999;
        animation:confetti-fall ${1.5 + Math.random() * 2}s ease-in forwards;
        animation-delay:${Math.random() * 0.5}s;
      `;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }
  },

  // ── Navbar Sync ──
  _syncNavbar(state) {
    const s = state || EQ.getState();
    const level = EQ.getLevel(s.totalXP);
    const progress = EQ.getLevelProgress(s.totalXP);
    const nextLevel = EQ.LEVELS[level.index + 1];

    const xpVal = document.getElementById('nav-xp-val');
    const xpNext = document.getElementById('nav-xp-next');
    const xpFill = document.getElementById('nav-xp-fill');
    const levelName = document.getElementById('nav-level-name');

    if (xpVal) xpVal.textContent = `${s.totalXP} XP`;
    if (xpNext) xpNext.textContent = nextLevel ? `to ${nextLevel.name}` : 'MAX';
    if (xpFill) xpFill.style.width = `${progress}%`;
    if (levelName) levelName.textContent = `${level.icon} ${level.name}`;
  },

  /** Initialize page — sync navbar & setup hamburger */
  init() {
    EQ._syncNavbar();

    // Hamburger menu
    const hamburger = document.getElementById('nav-hamburger');
    const overlay = document.getElementById('mobile-nav-overlay');
    const drawer = document.getElementById('mobile-nav-drawer');

    if (hamburger && drawer) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('open');
        drawer.classList.toggle('open');
        if (overlay) overlay.classList.toggle('open');
      });

      if (overlay) {
        overlay.addEventListener('click', () => {
          hamburger.classList.remove('open');
          drawer.classList.remove('open');
          overlay.classList.remove('open');
        });
      }
    }
  }
};

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => EQ.init());

// ── Inject toast & confetti keyframes ──
(function() {
  const style = document.createElement('style');
  style.textContent = `
    #toast-container {
      position:fixed;top:20px;right:20px;z-index:99998;
      display:flex;flex-direction:column;gap:8px;
    }
    @keyframes toast-in {
      from { opacity:0; transform:translateX(40px) scale(0.95); }
      to   { opacity:1; transform:translateX(0) scale(1); }
    }
    @keyframes toast-out {
      from { opacity:1; transform:translateX(0) scale(1); }
      to   { opacity:0; transform:translateX(40px) scale(0.95); }
    }
    @keyframes confetti-fall {
      0%   { transform:translateY(0) rotate(0deg) scale(1); opacity:1; }
      100% { transform:translateY(100vh) rotate(${360 + Math.random()*360}deg) scale(0.5); opacity:0; }
    }
  `;
  document.head.appendChild(style);
})();
