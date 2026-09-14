function renderSidebar(activeMenu) {
  const sidebarHTML = `
    <aside class="w-64 bg-slate-900 text-white min-h-screen p-5 flex flex-col justify-between shrink-0 border-r border-slate-800">
      <div>
        <!-- Logo Brand Section -->
        <div class="flex items-center gap-3 mb-8 px-2">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30 font-bold text-lg text-white">
            ⚡
          </div>
          <div>
            <h1 class="font-bold text-base tracking-tight text-white leading-none">BookingApp</h1>
            <span class="text-[10px] text-blue-400 font-medium tracking-wider uppercase">Admin Panel</span>
          </div>
        </div>
        
        <!-- Navigation Menu -->
        <nav class="space-y-1.5">
          <a href="admin.html" class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${activeMenu === 'list' ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002 2h2a2 2 0 002-2"></path></svg>
            <span class="text-sm">จัดการรายการจอง</span>
          </a>

          <a href="services.html" class="flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 ${activeMenu === 'services' ? 'bg-blue-600 text-white font-medium shadow-md shadow-blue-600/20' : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200'}">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            <span class="text-sm">จัดการแพ็กเกจบริการ</span>
          </a>
        </nav>

        <div class="my-6 border-t border-slate-800"></div>

        <!-- External Link -->
        <a href="index.html" target="_blank" class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all duration-200">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          <span class="text-sm">ดูหน้าเว็บฝั่งลูกค้า</span>
        </a>
      </div>

      <div class="text-xs text-slate-500 border-t border-slate-800/80 pt-4 px-2 flex items-center justify-between">
        <span>Portfolio Project</span>
        <span class="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px]">v1.0</span>
      </div>
    </aside>
  `;

  document.getElementById('sidebar-container').innerHTML = sidebarHTML;
}