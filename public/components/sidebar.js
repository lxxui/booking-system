function renderSidebar(activeMenu) {
  const sidebarHTML = `
    <aside class="w-64 bg-[var(--ink)] text-[var(--paper)] min-h-screen p-5 flex flex-col justify-between shrink-0 border-r border-[var(--paper)]/10">
      <div>
        <!-- Logo Brand Section -->
        <div class="flex items-center gap-3 mb-8 px-2">
          <div class="w-10 h-10 rounded-full border-2 border-dashed border-[var(--brass)] flex items-center justify-center font-display font-bold text-sm text-[var(--brass)]">
            01
          </div>
          <div>
            <h1 class="font-display font-semibold text-base tracking-tight text-[var(--paper)] leading-none">BookingApp</h1>
            <span class="text-[10px] text-[var(--paper)]/50 font-medium tracking-wider uppercase">Admin Panel</span>
          </div>
        </div>
        
        <!-- Navigation Menu -->
        <nav class="space-y-1.5">
          <!-- เมนู Dashboard & สถิติ -->
          <a href="/admin-dashboard" class="flex items-center gap-3 px-3.5 py-3 rounded-full transition-all duration-200 ${activeMenu === 'dashboard' ? 'bg-[var(--moss)] text-[var(--paper)] font-medium' : 'hover:bg-[var(--paper)]/5 text-[var(--paper)]/60 hover:text-[var(--paper)]'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            <span class="text-sm">Dashboard & สถิติ</span>
          </a>

          <!-- เมนู จัดการรายการจอง -->
          <a href="/admin" class="flex items-center gap-3 px-3.5 py-3 rounded-full transition-all duration-200 ${activeMenu === 'list' ? 'bg-[var(--moss)] text-[var(--paper)] font-medium' : 'hover:bg-[var(--paper)]/5 text-[var(--paper)]/60 hover:text-[var(--paper)]'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2"></path></svg>
            <span class="text-sm">จัดการรายการจอง</span>
          </a>

          <!-- เมนู จัดการแพ็กเกจบริการ -->
          <a href="/services" class="flex items-center gap-3 px-3.5 py-3 rounded-full transition-all duration-200 ${activeMenu === 'services' ? 'bg-[var(--moss)] text-[var(--paper)] font-medium' : 'hover:bg-[var(--paper)]/5 text-[var(--paper)]/60 hover:text-[var(--paper)]'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <span class="text-sm">จัดการแพ็กเกจบริการ</span>
          </a>
        </nav>

        <div class="my-6 border-t border-[var(--paper)]/10"></div>

        <!-- External Link -->
        <a href="/" target="_blank" class="flex items-center gap-3 px-3.5 py-3 rounded-full text-[var(--paper)]/60 hover:text-[var(--paper)] hover:bg-[var(--paper)]/5 transition-all duration-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          <span class="text-sm">ดูหน้าเว็บฝั่งลูกค้า</span>
        </a>
      </div>

      <!-- Bottom Actions & Info -->
      <div class="space-y-4">
        <button onclick="handleLogout()" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[var(--rose)] hover:brightness-110 hover:bg-[var(--rose)]/10 transition-all duration-200 text-xs font-semibold">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          <span>ออกจากระบบ</span>
        </button>

        <div class="text-xs text-[var(--paper)]/40 border-t border-[var(--paper)]/10 pt-4 px-2 flex items-center justify-between">
          <span>Portfolio Project</span>
          <span class="bg-[var(--paper)]/10 text-[var(--paper)]/60 px-2 py-0.5 rounded-full text-[10px]">v1.0</span>
        </div>
      </div>
    </aside>
  `;

  const container = document.getElementById('sidebar-container');
  if (container) {
    container.innerHTML = sidebarHTML;
  }
}

// ฟังก์ชัน Logout กลาง
function handleLogout() {
  localStorage.removeItem('adminToken');
  window.location.href = '/login';
}