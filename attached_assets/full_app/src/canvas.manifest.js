export const manifest = {
  screens: {
    scr_58wmu2: { name: "Splash", route: "/", position: { "x": 160, "y": 220 } },
    scr_pilkks: { name: "Login", route: "/login", position: { "x": 1560, "y": 220 } },
    scr_i0kzqw: { name: "Create account", route: "/signup", position: { "x": 2960, "y": 220 } },
    scr_yw0pqz: { name: "Forgot password", route: "/forgot-password", position: { "x": 4360, "y": 220 } },
    scr_96x544: { name: "Dashboard", route: "/dashboard", position: { "x": 160, "y": 2200 } },
    scr_y8hu2l: { name: "Projects", route: "/projects", position: { "x": 9960, "y": 2200 } },
    scr_odvh4c: { name: "Studio", route: "/studio", position: { "x": 1560, "y": 2200 } },
    scr_faqqoq: { name: "Calendar", route: "/calendar", position: { "x": 2960, "y": 2200 } },
    scr_kprwo0: { name: "Tasks", route: "/tasks", position: { "x": 4360, "y": 2200 } },
    scr_6zcxsg: { name: "Templates", route: "/templates", position: { "x": 5760, "y": 2200 } },
    scr_smydtt: { name: "Media Library", route: "/media-library", position: { "x": 7160, "y": 2200 } },
    scr_1lnim2: { name: "Analytics — Overview", route: "/analytics", state: { "tab": "overview" }, position: { "x": 160, "y": 4180 } },
    scr_0rhuwh: { name: "Analytics — Episodes", route: "/analytics", state: { "tab": "episodes" }, position: { "x": 1560, "y": 4180 } },
    scr_2g0s9n: { name: "Analytics — Audience", route: "/analytics", state: { "tab": "audience" }, position: { "x": 2960, "y": 4180 } },
    scr_h1oqcq: { name: "Analytics — Engagement", route: "/analytics", state: { "tab": "engagement" }, position: { "x": 4360, "y": 4180 } },
    scr_fwq18p: { name: "Analytics — Platforms", route: "/analytics", state: { "tab": "platforms" }, position: { "x": 5760, "y": 4180 } },
    scr_taepae: { name: "Team", route: "/team", position: { "x": 8560, "y": 2200 } },
    scr_dbakn0: { name: "Settings", route: "/settings", position: { "x": 160, "y": 6160 } },
    scr_zhhf3a: { name: "Settings — Profile", route: "/settings/profile", position: { "x": 1560, "y": 6160 } },
    scr_y0uzhw: { name: "Settings — Account", route: "/settings/account", position: { "x": 2960, "y": 6160 } },
    scr_zrtabk: { name: "Settings — Security", route: "/settings/security", position: { "x": 4360, "y": 6160 } },
    scr_dghtzf: { name: "Settings — Notifications", route: "/settings/notifications", position: { "x": 5760, "y": 6160 } },
    scr_js6tip: { name: "Settings — Appearance", route: "/settings/appearance", position: { "x": 7160, "y": 6160 } },
    scr_jhclht: { name: "Settings — Audio Preferences", route: "/settings/audio", position: { "x": 8560, "y": 6160 } },
    scr_hv7x29: { name: "Settings — Recording Preferences", route: "/settings/recording", position: { "x": 9960, "y": 6160 } },
    scr_lbc15y: { name: "Settings — Storage", route: "/settings/storage", position: { "x": 11360, "y": 6160 } },
    scr_26rla1: { name: "Settings — Integrations", route: "/settings/integrations", position: { "x": 12760, "y": 6160 } },
    scr_zsatln: { name: "Settings — API Keys", route: "/settings/api-keys", position: { "x": 14160, "y": 6160 } },
    scr_w2mery: { name: "Settings — Team & Permissions", route: "/settings/team-permissions", position: { "x": 15560, "y": 6160 } },
    scr_lxdijg: { name: "Settings — Import & Export", route: "/settings/import-export", position: { "x": 16960, "y": 6160 } },
    scr_lvtenc: { name: "Settings — Advanced", route: "/settings/advanced", position: { "x": 18360, "y": 6160 } },
    scr_xrc5r0: { name: "Settings — Danger Zone", route: "/settings/danger-zone", position: { "x": 19760, "y": 6160 } },
    scr_xri1y5: { name: "Knowledge Base", route: "/knowledge-base", position: { "x": 1560, "y": 8140 } },
    scr_dhan31: { name: "Legal & Policies", route: "/legal", position: { "x": 2960, "y": 8140 } },
    scr_dlf07l: { name: "Help & Support", route: "/help", position: { "x": 160, "y": 8140 } },
    scr_y5p6pm: { name: "About Podify", route: "/about", position: { "x": 4360, "y": 8140 } }
  },
  sections: {
    sec_b3a6oy: { name: "Authentication flow", x: 0, y: 0, width: 5720, height: 1180 },
    sec_8kdg6r: { name: "App workspace", x: 0, y: 1980, width: 11320, height: 1180 },
    sec_hf76t7: { name: "Analytics dashboard", x: 0, y: 3960, width: 7120, height: 1180 },
    sec_13idaz: { name: "Settings flow", x: 0, y: 5940, width: 21120, height: 1180 },
    sec_phvl7h: { name: "Help & Information", x: 0, y: 7920, width: 5720, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_b3a6oy", children: [
    { kind: "screen", id: "scr_58wmu2" },
    { kind: "screen", id: "scr_pilkks" },
    { kind: "screen", id: "scr_i0kzqw" },
    { kind: "screen", id: "scr_yw0pqz" }]
  },
  { kind: "section", id: "sec_8kdg6r", children: [
    { kind: "screen", id: "scr_96x544" },
    { kind: "screen", id: "scr_odvh4c" },
    { kind: "screen", id: "scr_faqqoq" },
    { kind: "screen", id: "scr_kprwo0" },
    { kind: "screen", id: "scr_6zcxsg" },
    { kind: "screen", id: "scr_smydtt" },
    { kind: "screen", id: "scr_taepae" },
    { kind: "screen", id: "scr_y8hu2l" }]
  },
  { kind: "section", id: "sec_hf76t7", children: [
    { kind: "screen", id: "scr_1lnim2" },
    { kind: "screen", id: "scr_0rhuwh" },
    { kind: "screen", id: "scr_2g0s9n" },
    { kind: "screen", id: "scr_h1oqcq" },
    { kind: "screen", id: "scr_fwq18p" }]
  },
  { kind: "section", id: "sec_13idaz", children: [
    { kind: "screen", id: "scr_dbakn0" },
    { kind: "screen", id: "scr_zhhf3a" },
    { kind: "screen", id: "scr_y0uzhw" },
    { kind: "screen", id: "scr_zrtabk" },
    { kind: "screen", id: "scr_dghtzf" },
    { kind: "screen", id: "scr_js6tip" },
    { kind: "screen", id: "scr_jhclht" },
    { kind: "screen", id: "scr_hv7x29" },
    { kind: "screen", id: "scr_lbc15y" },
    { kind: "screen", id: "scr_26rla1" },
    { kind: "screen", id: "scr_zsatln" },
    { kind: "screen", id: "scr_w2mery" },
    { kind: "screen", id: "scr_lxdijg" },
    { kind: "screen", id: "scr_lvtenc" },
    { kind: "screen", id: "scr_xrc5r0" }]
  },
  { kind: "section", id: "sec_phvl7h", children: [
    { kind: "screen", id: "scr_dlf07l" },
    { kind: "screen", id: "scr_xri1y5" },
    { kind: "screen", id: "scr_dhan31" },
    { kind: "screen", id: "scr_y5p6pm" }]
  }]

};