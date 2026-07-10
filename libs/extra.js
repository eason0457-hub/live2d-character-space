(() => {
  const list = document.getElementById('dropdown-list');
  const upload = document.getElementById('upload-btn');
  if (!list || !upload || list.dataset.mygoInjected === 'true') return;

  const base = 'https://cdn.jsdelivr.net/gh/panxuc/live2d-widget-mygo@main/public/model/';
  const groups = {"高松灯":[["tomori/036_casual-2023","日常服（2023）"],["tomori/036_school_winter-2023","冬季校服（2023）"],["tomori/036_school_summer-2023","夏季校服（2023）"],["tomori/036_live_default","默认演出服"],["tomori/036_live_sr_01","SR 演出服"],["tomori/036_live_event_235_ur","活动235 UR"],["tomori/036_live_event_240_ssr","活动240 SSR"],["tomori/036_live_event_250_ur","活动250 UR"],["tomori/036_live_event_286_ur","活动286 UR"],["tomori/036_live_event_289_ur","活动289 UR"],["tomori/036_live_event_297_ur","活动297 UR"],["tomori/036_birthday_2024_ssr","2024 生日 SSR"],["tomori/036_dream_festival_3_ur","Dream Festival 3 UR"],["tomori/036_collabo_a_ur","联动 A UR"],["tomori/036_collabo_d_3_ur","联动 D3 UR"],["tomori/036_2024_furisode","2024 振袖"]],"千早爱音":[["anon/037_casual-2023","日常服（2023）"],["anon/037_school_winter-2023","冬季校服（2023）"],["anon/037_school_summer-2023","夏季校服（2023）"],["anon/037_live_default","默认演出服"],["anon/037_live_sr_01","SR 演出服"],["anon/037_live_event_235_ur","活动235 UR"],["anon/037_live_event_240_sr","活动240 SR"],["anon/037_live_event_250_r","活动250 R"],["anon/037_live_event_253_ur","活动253 UR"],["anon/037_live_event_277_sr","活动277 SR"],["anon/037_live_event_286_sr","活动286 SR"],["anon/037_live_event_297_sr","活动297 SR"],["anon/037_birthday_2024_ssr","2024 生日 SSR"],["anon/037_dream_festival_3_ur","Dream Festival 3 UR"],["anon/037_collabo_a_ur","联动 A UR"]],"要乐奈":[["rana/038_casual-2023","日常服（2023）"],["rana/038_school_winter-2023","冬季校服（2023）"],["rana/038_school_summer-2023","夏季校服（2023）"],["rana/038_live_default","默认演出服"],["rana/038_live_sr_01","SR 演出服"],["rana/038_live_event_235_sr","活动235 SR"],["rana/038_live_event_240_ur","活动240 UR"],["rana/038_live_event_250_sr","活动250 SR"],["rana/038_live_event_286_ur","活动286 UR"],["rana/038_live_event_297_sr","活动297 SR"],["rana/038_birthday_2024_ssr","2024 生日 SSR"],["rana/038_dream_festival_3_ur","Dream Festival 3 UR"],["rana/038_collabo_a_ur","联动 A UR"]],"长崎爽世":[["soyo/039_casual-2023","日常服（2023）"],["soyo/039_school_winter-2023","冬季校服（2023）"],["soyo/039_school_summer-2023","夏季校服（2023）"],["soyo/039_live_default","默认演出服"],["soyo/039_live_sr_01","SR 演出服"],["soyo/039_live_event_235_ur","活动235 UR"],["soyo/039_live_event_240_r","活动240 R"],["soyo/039_live_event_250_ur","活动250 UR"],["soyo/039_live_event_286_ssr","活动286 SSR"],["soyo/039_live_event_289_ur","活动289 UR"],["soyo/039_live_event_297_ur","活动297 UR"],["soyo/039_birthday_2024_ssr","2024 生日 SSR"],["soyo/039_dream_festival_3_ur","Dream Festival 3 UR"],["soyo/039_collabo_a_ur","联动 A UR"]],"椎名立希":[["taki/040_casual-2023","日常服（2023）"],["taki/040_school_winter-2023","冬季校服（2023）"],["taki/040_school_summer-2023","夏季校服（2023）"],["taki/040_live_default","默认演出服"],["taki/040_live_sr_01","SR 演出服"],["taki/040_live_event_235_sr","活动235 SR"],["taki/040_live_event_240_ur","活动240 UR"],["taki/040_live_event_250_ssr","活动250 SSR"],["taki/040_live_event_277_ur","活动277 UR"],["taki/040_live_event_286_r","活动286 R"],["taki/040_live_event_297_ur","活动297 UR"],["taki/040_birthday_2024_ssr","2024 生日 SSR"],["taki/040_dream_festival_3_ur","Dream Festival 3 UR"],["taki/040_collabo_a_ur","联动 A UR"],["taki/040_arbeit","打工服"],["taki/040_event_277_story_01","活动277 剧情服"]]};
  const fragment = document.createDocumentFragment();

  const title = document.createElement('li');
  title.textContent = 'MyGO!!!!! 全角色 · 74 套';
  title.setAttribute('aria-hidden', 'true');
  title.style.cssText = 'padding:10px 12px 6px;font-weight:800;opacity:.82;pointer-events:none;';
  fragment.appendChild(title);

  for (const [character, entries] of Object.entries(groups)) {
    const heading = document.createElement('li');
    heading.textContent = character;
    heading.setAttribute('aria-hidden', 'true');
    heading.style.cssText = 'padding:10px 12px 5px;font-weight:700;opacity:.65;pointer-events:none;';
    fragment.appendChild(heading);

    for (const [path, outfit] of entries) {
      const item = document.createElement('li');
      item.className = 'dropdown-option';
      item.setAttribute('role', 'option');
      item.dataset.value = `${base}${path}/index.json`;
      item.textContent = `${character} · ${outfit}`;
      fragment.appendChild(item);
    }
  }

  list.insertBefore(fragment, upload);
  list.dataset.mygoInjected = 'true';

  const label = document.getElementById('dropdown-label');
  if (label) label.textContent = 'MyGO!!!!! 全角色（74套）';

  const loadButton = document.getElementById('load-selected-btn');
  if (loadButton) loadButton.textContent = '载入所选模型';
})();
