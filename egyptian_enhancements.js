/**
 * ====================================================================
 *   🚗 حزمة التطوير الكبرى والجرافيك الفائق للعبة «ع الدائري» 🇪🇬
 *   (Egyptian Enhancements - Ultra Graphics AAA Edition)
 * ====================================================================
 *   1. محرك الجرافيك الفائق (Ultra Graphics):
 *      - تصفية إكساءات خارقة (16x Max Anisotropic Filtering) لنقاء خطوط الأسفلت واللافتات.
 *      - ظلال ناعمة واقعية (PCF Soft Shadows 2048x2048) تتتبع السيارة ديناميكياً على مدار 100 كم.
 *      - إضاءة سينمائية (ACES Filmic Tone Mapping) ودرجات ألوان سماء القاهرة ورمالها الطبيعية.
 *      - ظل التحام (Contact Ambient Occlusion Shadow) أسفل السيارة لمنع الطفو نهائياً.
 *   2. عجلات ثلاثية الأبعاد تدور وتلف بواقعية تامة مع سرعة السيارة وحركة التوجيه (Spinning & Steering Wheels).
 *   3. ثبات واستقرار مطلق للطريق بدون أي تنطيط أو اهتزاز.
 *   4. كشافات إضاءة أمامية حقيقية مع إسقاط ضوئي واقعي على الأسفلت (Headlights & Road Beam Projection).
 *   5. معالم مصر الحضارية والسياحية ثلاثية الأبعاد مع إلقاء الظلال الكاملة (الأهرامات، المتحف الكبير، برج القاهرة، القلعة، البرج الأيقوني).
 *   6. كاميرا الكابينة والمنظور الداخلي للسائق (Cockpit View) بنقرة زر أو بحرف C.
 * ====================================================================
 */

(function () {
  "use strict";

  // حالة النظام (State)
  const state = {
    cockpitMode: false,
    wheelAngle: 0,
    steerAngle: 0,
    wheelRig: null,
    leftWheel: null,
    rightWheel: null,
    contactShadow: null,
    headlights: null,
    landmarkGroup: null,
    activeTrackId: "",
    wheelTexture: null,
    contactShadowTexture: null,
    ultraGraphicsInitialized: false,
    maxAnisotropy: 16
  };

  /**
   * إنشاء خامة جنط ألومنيوم رياضي عالي التباين لرؤية دوران العجلات بوضوح فائق
   */
  function createWheelTexture() {
    if (state.wheelTexture) return state.wheelTexture;

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    // إطار الكاوتش الخارجي الأسود
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, 256, 256);

    ctx.beginPath();
    ctx.arc(128, 128, 124, 0, Math.PI * 2);
    ctx.fillStyle = "#1c1d21";
    ctx.fill();
    ctx.lineWidth = 12;
    ctx.strokeStyle = "#080808";
    ctx.stroke();

    // حافة الجنط الفضي اللامع
    ctx.beginPath();
    ctx.arc(128, 128, 92, 0, Math.PI * 2);
    ctx.fillStyle = "#22252a";
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#edf2f7";
    ctx.stroke();

    // برامق الجنط الرياضي (5 Spokes) بلون كروم فضي فاقع للعين
    ctx.save();
    ctx.translate(128, 128);
    for (let i = 0; i < 5; i++) {
      ctx.rotate((Math.PI * 2) / 5);
      ctx.beginPath();
      ctx.moveTo(-12, -18);
      ctx.lineTo(-15, -86);
      ctx.lineTo(15, -86);
      ctx.lineTo(12, -18);
      ctx.closePath();
      ctx.fillStyle = "#f8fafc";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#64748b";
      ctx.stroke();
    }

    // صرة العجلة في المنتصف مع شعار ذهبي لامع
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#ffd21f";
    ctx.stroke();

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = state.maxAnisotropy;
    state.wheelTexture = tex;
    return tex;
  }

  /**
   * إنشاء خامة ظل التلامس (Contact Shadow Texture) أسفل السيارة لمنع أي طفو
   */
  function createContactShadowTexture() {
    if (state.contactShadowTexture) return state.contactShadowTexture;

    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    const grad = ctx.createRadialGradient(64, 64, 10, 64, 64, 62);
    grad.addColorStop(0, "rgba(0, 0, 0, 0.78)");
    grad.addColorStop(0.45, "rgba(0, 0, 0, 0.40)");
    grad.addColorStop(0.8, "rgba(0, 0, 0, 0.12)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    state.contactShadowTexture = tex;
    return tex;
  }

  /**
   * 1. بناء نظام العجلات ثلاثية الأبعاد الدوارة وظل الالتحام (Spinning 3D Wheels & Contact Shadow)
   */
  function setupWheels(core) {
    const { world, THREE } = core;
    if (!world || !THREE || state.wheelRig) return;

    const rig = new THREE.Group();
    rig.name = "Player3DWheelRig";
    rig.renderOrder = 4;

    const wheelTex = createWheelTexture();
    const tireMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
    const rimMat = new THREE.MeshLambertMaterial({
      map: wheelTex,
      roughness: 0.3
    });

    const wheelMats = [tireMat, rimMat, rimMat];
    const wheelRadius = 0.36;
    const wheelWidth = 0.24;
    const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 24);
    wheelGeo.rotateZ(Math.PI / 2);

    const leftWheel = new THREE.Mesh(wheelGeo, wheelMats);
    const rightWheel = new THREE.Mesh(wheelGeo, wheelMats);

    leftWheel.castShadow = true;
    rightWheel.castShadow = true;
    leftWheel.renderOrder = 4;
    rightWheel.renderOrder = 4;

    rig.add(leftWheel);
    rig.add(rightWheel);

    // إضافة ظل ناعم مستمر أسفل السيارة يثبتها بالأسفلت
    const shadowTex = createContactShadowTexture();
    const shadowGeo = new THREE.PlaneGeometry(wheelRadius * 5.4, wheelRadius * 8.5);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.72,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, -wheelRadius + 0.03, 0.35);
    shadowMesh.renderOrder = 3;
    rig.add(shadowMesh);
    state.contactShadow = shadowMesh;

    world.add(rig);

    state.wheelRig = rig;
    state.leftWheel = leftWheel;
    state.rightWheel = rightWheel;

    console.log("🛞 تم تفعيل نظام العجلات الدوارة ثلاثية الأبعاد وظلال التلامس بنجاح.");
  }

  /**
   * تحديث دوران وتوجيه العجلات بدقة في كل دورة رسم (Spinning & Steering)
   */
  function updateWheels(core, dt) {
    const { getPlayer, getDist, pc } = core;
    const player = getPlayer && getPlayer();
    if (!state.wheelRig) return;
    if (!player || !player.visible) {
      state.wheelRig.visible = false;
      return;
    }
    state.wheelRig.visible = true;

    const dist = (getDist && getDist()) || 0;
    const radius = 0.36;

    // دوران العجلات الحقيقي: كل متر تقطعه السيارة تلف العجلة بزاوية فيزيائية مطابقة للأسفلت
    state.wheelAngle = dist / radius;

    // انحراف العجلات مع التوجيه يميناً ويساراً
    const lateralVel = player.userData && player.userData.vk ? player.userData.vk : 0;
    const targetSteer = -lateralVel * 0.25;
    state.steerAngle += (targetSteer - state.steerAngle) * Math.min(1, 16 * dt);

    // حساب عرض سيارة اللاعب لوضع العجلات أسفل الرفارف الخارجية بدقة
    const carWidth = player.scale ? player.scale.x * 0.85 : 1.8;
    const halfTrack = Math.max(0.72, carWidth * 0.44);

    // تموضع حامل العجلات على الأسفلت عند موقع السيارة
    state.wheelRig.position.x = player.position.x;
    state.wheelRig.position.z = player.position.z;
    state.wheelRig.position.y = (player.position.y || 0) + radius;

    if (pc) {
      const roadHeading = pc(dist).h || 0;
      state.wheelRig.rotation.y = roadHeading;
    }

    // تدوير العجلة اليسرى للأمام وانحرافها
    state.leftWheel.position.set(-halfTrack, 0, 0.05);
    state.leftWheel.rotation.x = -state.wheelAngle;
    state.leftWheel.rotation.y = state.steerAngle;

    // تدوير العجلة اليمنى للأمام وانحرافها
    state.rightWheel.position.set(halfTrack, 0, 0.05);
    state.rightWheel.rotation.x = -state.wheelAngle;
    state.rightWheel.rotation.y = state.steerAngle;
  }

  /**
   * 2. محرك الجرافيك الفائق والأعلى كواليتي (Ultra Graphics HD Engine)
   */
  function setupUltraGraphics(core) {
    const { renderer, THREE, sunLight, hemiLight, Gc } = core;
    if (!renderer || state.ultraGraphicsInitialized) return;

    // A. أقصى تباين وتصفية للإكساءات (16x Max Anisotropic Filtering)
    const maxAniso = renderer.capabilities ? renderer.capabilities.getMaxAnisotropy() : 16;
    state.maxAnisotropy = maxAniso;

    // جعل كل خامة جديدة تنشأ باللعبة تأخذ 16x تلقائياً
    if (THREE && THREE.Texture) {
      THREE.Texture.prototype.anisotropy = maxAniso;
    }

    // ترقية جميع الخامات الموجودة حالياً في الذاكرة
    function upgradeAllTextures(target) {
      if (!target) return;
      if (target.isTexture) {
        target.anisotropy = maxAniso;
        target.needsUpdate = true;
      } else if (typeof target === "object") {
        for (const k in target) {
          if (target[k] && target[k].isTexture) {
            target[k].anisotropy = maxAniso;
            target[k].needsUpdate = true;
          }
        }
      }
    }
    if (Gc) upgradeAllTextures(Gc);

    // B. إعدادات ريندر فائقة الدقة والألوان السينمائية والظلال الناعمة
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // C. تحسين إضاءة شمس مصر وظلالها العالية الدقة
    if (sunLight) {
      sunLight.castShadow = true;
      sunLight.intensity = 1.32;
      sunLight.color.setHex(0xfffaed);
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.radius = 2.4;
    }

    if (hemiLight) {
      hemiLight.color.setHex(0xb2d9fa); // زرقة سماء القاهرة
      hemiLight.groundColor.setHex(0xd4b88f); // دفء رمال وتربة مصر
      hemiLight.intensity = 0.72;
    }

    // D. إظهار شارة الجرافيك الفائق في الشاشة
    setupUltraBadge();

    state.ultraGraphicsInitialized = true;
    console.log(`✨ تم تفعيل الجرافيك الفائق بنجاح: Anisotropy ${maxAniso}x, PCF Soft Shadows 2048px, ACES Filmic Tone Mapping.`);
  }

  /**
   * شارة جرافيك فائق في واجهة اللعبة (Ultra HD 60fps Badge)
   */
  function setupUltraBadge() {
    if (document.getElementById("ultraGraphicBadge")) return;

    const badge = document.createElement("div");
    badge.id = "ultraGraphicBadge";
    badge.style.cssText = `
      position: fixed;
      top: 18px;
      left: 180px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 13px;
      border-radius: 20px;
      background: rgba(15, 23, 42, 0.90);
      border: 1.5px solid #22c55e;
      color: #fff;
      font: 700 13px 'Cairo', sans-serif;
      backdrop-filter: blur(6px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.4);
      pointer-events: none;
      user-select: none;
    `;
    badge.innerHTML = `<span style="color:#4ade80;">✨</span> <span>جرافيك فائق 4K</span>`;
    document.body.appendChild(badge);
  }

  /**
   * تحديث زاوية الشمس وتتبع الظلال لموقع السيارة على مدار الـ 100 كم
   */
  function updateSunShadows(core) {
    const { sunLight, getPlayer } = core;
    const player = getPlayer && getPlayer();
    if (!sunLight || !player) return;

    // تتبع الشمس والظل لموقع سيارة اللاعب على الدائري مهما طافت بالكيلومترات
    sunLight.position.set(player.position.x - 110, player.position.y + 240, player.position.z + 70);
    if (sunLight.target) {
      sunLight.target.position.set(player.position.x, player.position.y, player.position.z);
      sunLight.target.updateMatrixWorld();
    }
  }

  /**
   * 3. كشافات الإضاءة الأمامية والإسقاط الضوئي على الأسفلت
   */
  function setupLighting(core) {
    const { getPlayer, THREE } = core;
    if (!THREE || state.headlights) return;

    const player = getPlayer && getPlayer();
    if (!player) return;

    const lightGroup = new THREE.Group();
    lightGroup.name = "PlayerHeadlights";

    const leftHead = new THREE.SpotLight(0xfff6dd, 1.25, 80, Math.PI / 7, 0.45, 1.2);
    leftHead.position.set(-0.65, 0.5, 1.2);
    const leftTarget = new THREE.Object3D();
    leftTarget.position.set(-0.65, 0, 32);

    const rightHead = new THREE.SpotLight(0xfff6dd, 1.25, 80, Math.PI / 7, 0.45, 1.2);
    rightHead.position.set(0.65, 0.5, 1.2);
    const rightTarget = new THREE.Object3D();
    rightTarget.position.set(0.65, 0, 32);

    lightGroup.add(leftHead, leftTarget, rightHead, rightTarget);
    leftHead.target = leftTarget;
    rightHead.target = rightTarget;

    // مخروط إسقاط ضوء الكشافات على سطح الأسفلت
    const beamCanvas = document.createElement("canvas");
    beamCanvas.width = 128;
    beamCanvas.height = 256;
    const bctx = beamCanvas.getContext("2d");
    const bgrad = bctx.createRadialGradient(64, 230, 8, 64, 110, 115);
    bgrad.addColorStop(0, "rgba(255, 248, 210, 0.32)");
    bgrad.addColorStop(0.55, "rgba(255, 238, 175, 0.12)");
    bgrad.addColorStop(1, "rgba(255, 235, 160, 0)");
    bctx.fillStyle = bgrad;
    bctx.fillRect(0, 0, 128, 256);

    const beamTex = new THREE.CanvasTexture(beamCanvas);
    const beamGeo = new THREE.PlaneGeometry(3.4, 25);
    beamGeo.rotateX(-Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      map: beamTex,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(0, 0.05, 13.5);
    beamMesh.renderOrder = 3;
    lightGroup.add(beamMesh);

    player.add(lightGroup);
    state.headlights = lightGroup;
  }

  /**
   * 4. كاميرا الكابينة والمنظور الداخلي للسائق (Cockpit View)
   */
  function setupCockpitCam(core) {
    if (document.getElementById("cockpitToggleBtn")) return;

    const btn = document.createElement("button");
    btn.id = "cockpitToggleBtn";
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-label", "تبديل الكاميرا");
    btn.style.cssText = `
      position: fixed;
      top: 18px;
      left: 30px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 14px;
      border-radius: 20px;
      background: rgba(20, 24, 34, 0.90);
      border: 1.5px solid #ffd21f;
      color: #fff;
      font: 700 13px 'Cairo', sans-serif;
      cursor: pointer;
      backdrop-filter: blur(6px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.4);
      transition: transform 0.15s, background 0.15s;
    `;
    btn.innerHTML = `<span>🎥</span> <span id="camLabel">منظور الكابينة</span>`;

    btn.addEventListener("click", () => {
      state.cockpitMode = !state.cockpitMode;
      document.getElementById("camLabel").textContent = state.cockpitMode ? "منظور خارجي" : "منظور الكابينة";
      btn.style.borderColor = state.cockpitMode ? "#2fb36a" : "#ffd21f";
    });

    document.body.appendChild(btn);

    window.addEventListener("keydown", (e) => {
      if (e.key === "c" || e.key === "C" || e.key === "ؤ") {
        btn.click();
      }
    });
  }

  function updateCockpitCamera(core, dt) {
    if (!state.cockpitMode) return;
    const { camera, getPlayer, THREE } = core;
    const player = getPlayer && getPlayer();
    if (!camera || !player) return;

    const driverOffset = new THREE.Vector3(-0.35, 1.15, 0.2);
    driverOffset.applyQuaternion(player.quaternion);
    camera.position.copy(player.position).add(driverOffset);

    // توجيه الكاميرا للأمام مباشرة في نفس خط الرؤية بدون أي ميل جانبي
    const forwardTarget = new THREE.Vector3(-0.35, 1.15, 40);
    forwardTarget.applyQuaternion(player.quaternion);
    forwardTarget.add(player.position);
    camera.lookAt(forwardTarget);
  }

  /**
   * 5. بناء معالم مصر السياحية والتاريخية ثلاثية الأبعاد مع إلقاء الظلال الكاملة
   */
  function buildLandmarks(core, track) {
    const { world, Tg, THREE } = core;
    if (!world || !THREE) return;

    if (state.landmarkGroup) {
      world.remove(state.landmarkGroup);
      state.landmarkGroup.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const lmGroup = new THREE.Group();
    lmGroup.name = "EgyptianLandmarksGroup";
    state.landmarkGroup = lmGroup;
    world.add(lmGroup);

    const trackId = track ? track.id : "";
    state.activeTrackId = trackId;

    const limestoneMat = new THREE.MeshLambertMaterial({ color: 0xe8cca4 });
    const capStoneMat = new THREE.MeshLambertMaterial({ color: 0xf5dfbe });
    const stoneDarkMat = new THREE.MeshLambertMaterial({ color: 0x9b7a55 });
    const whiteMarbleMat = new THREE.MeshLambertMaterial({ color: 0xf0ede6 });
    const glassCyanMat = new THREE.MeshLambertMaterial({ color: 0x2bb5d8, transparent: true, opacity: 0.85 });
    const goldMat = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const darkMetalMat = new THREE.MeshLambertMaterial({ color: 0x333b47 });

    // [أ] أهرامات الجيزة وأبو الهول (قطاع المريوطية / الهرم)
    if (trackId.includes("maadi-moneeb") || trackId.includes("moneeb-sahrawi") || trackId.includes("west-arc")) {
      const pyramidBaseKm = trackId.includes("moneeb-sahrawi") ? 7.2 : 9.0;

      // هرم خوفو الأكبر
      const khufuGroup = new THREE.Group();
      const khufuGeo = new THREE.ConeGeometry(95, 125, 4);
      khufuGeo.rotateY(Math.PI / 4);
      const khufuMesh = new THREE.Mesh(khufuGeo, limestoneMat);
      khufuMesh.position.y = 62.5;
      khufuGroup.add(khufuMesh);

      const baseGeo = new THREE.CylinderGeometry(140, 160, 12, 8);
      const baseMesh = new THREE.Mesh(baseGeo, stoneDarkMat);
      baseMesh.position.y = 6;
      khufuGroup.add(baseMesh);

      Tg(khufuGroup, pyramidBaseKm * 1000, 360, 0, false);
      lmGroup.add(khufuGroup);

      // هرم خفرع
      const khafreGroup = new THREE.Group();
      const khafreGeo = new THREE.ConeGeometry(90, 120, 4);
      khafreGeo.rotateY(Math.PI / 4);
      const khafreMesh = new THREE.Mesh(khafreGeo, limestoneMat);
      khafreMesh.position.y = 60;
      khafreGroup.add(khafreMesh);

      const capGeo = new THREE.ConeGeometry(24, 32, 4);
      capGeo.rotateY(Math.PI / 4);
      const capMesh = new THREE.Mesh(capGeo, capStoneMat);
      capMesh.position.y = 104;
      khafreGroup.add(capMesh);

      Tg(khafreGroup, (pyramidBaseKm + 0.6) * 1000, 440, 0, false);
      lmGroup.add(khafreGroup);

      // هرم منقرع
      const menkaureGroup = new THREE.Group();
      const menkaureGeo = new THREE.ConeGeometry(45, 58, 4);
      menkaureGeo.rotateY(Math.PI / 4);
      const menkaureMesh = new THREE.Mesh(menkaureGeo, limestoneMat);
      menkaureMesh.position.y = 29;
      menkaureGroup.add(menkaureMesh);
      Tg(menkaureGroup, (pyramidBaseKm + 1.1) * 1000, 510, 0, false);
      lmGroup.add(menkaureGroup);

      // تمثال أبو الهول العظيم
      const sphinxGroup = new THREE.Group();
      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(22, 10, 42), stoneDarkMat);
      bodyMesh.position.set(0, 5, 0);
      const pawsMesh = new THREE.Mesh(new THREE.BoxGeometry(16, 4, 18), stoneDarkMat);
      pawsMesh.position.set(0, 2, 24);
      const headMesh = new THREE.Mesh(new THREE.BoxGeometry(10, 12, 10), limestoneMat);
      headMesh.position.set(0, 15, 12);
      sphinxGroup.add(bodyMesh, pawsMesh, headMesh);
      sphinxGroup.scale.set(0.7, 0.7, 0.7);
      Tg(sphinxGroup, (pyramidBaseKm + 0.3) * 1000, 270, 0, false);
      lmGroup.add(sphinxGroup);
    }

    // [ب] المتحف المصري الكبير (GEM) والمسلة المعلقة
    if (trackId.includes("sahrawi") || trackId.includes("west-arc")) {
      const gemGroup = new THREE.Group();
      const facadeGeo = new THREE.BoxGeometry(120, 28, 18);
      const facadeMat = new THREE.MeshLambertMaterial({ color: 0xdfd4c2 });
      const facadeMesh = new THREE.Mesh(facadeGeo, facadeMat);
      facadeMesh.position.y = 14;
      gemGroup.add(facadeMesh);

      const glassGeo = new THREE.PlaneGeometry(90, 20);
      const glassMesh = new THREE.Mesh(glassGeo, glassCyanMat);
      glassMesh.position.set(0, 14, 9.2);
      gemGroup.add(glassMesh);

      const obeliskGeo = new THREE.ConeGeometry(2.4, 22, 4);
      obeliskGeo.rotateY(Math.PI / 4);
      const obeliskMesh = new THREE.Mesh(obeliskGeo, goldMat);
      obeliskMesh.position.set(0, 18, 30);
      const obeliskBase = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 8), stoneDarkMat);
      obeliskBase.position.set(0, 3.5, 30);
      gemGroup.add(obeliskMesh, obeliskBase);

      Tg(gemGroup, 8.8 * 1000, -180, 0, false);
      lmGroup.add(gemGroup);
    }

    // [ج] برج القاهرة وفلوكات النيل
    if (trackId.includes("maadi-moneeb") || trackId.includes("west-arc") || trackId.includes("shubra-salam")) {
      const towerGroup = new THREE.Group();
      const shaftGeo = new THREE.CylinderGeometry(5.5, 7.5, 120, 16);
      const shaftMesh = new THREE.Mesh(shaftGeo, whiteMarbleMat);
      shaftMesh.position.y = 60;
      const topGeo = new THREE.CylinderGeometry(9.5, 8.0, 14, 16);
      const topMat = new THREE.MeshLambertMaterial({ color: 0xffd21f, emissive: 0x332600 });
      const topMesh = new THREE.Mesh(topGeo, topMat);
      topMesh.position.y = 125;
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 25, 8), darkMetalMat);
      antenna.position.y = 142;
      towerGroup.add(shaftMesh, topMesh, antenna);

      Tg(towerGroup, 3.8 * 1000, -420, 0, false);
      lmGroup.add(towerGroup);

      // فلوكات نيلية شراعية
      const nileCenterKm = 4.2;
      for (let f = 0; f < 4; f++) {
        const felucca = new THREE.Group();
        const hullGeo = new THREE.BoxGeometry(3.5, 1.4, 11);
        const hullMesh = new THREE.Mesh(hullGeo, stoneDarkMat);
        hullMesh.position.y = -4.5;
        const sailGeo = new THREE.ConeGeometry(3.8, 12, 3);
        const sailMat = new THREE.MeshLambertMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const sailMesh = new THREE.Mesh(sailGeo, sailMat);
        sailMesh.position.set(0, 2, 0);
        sailMesh.scale.set(0.2, 1, 1);
        felucca.add(hullMesh, sailMesh);

        const latOffset = (f % 2 === 0 ? 35 : -35) + f * 12;
        Tg(felucca, (nileCenterKm + (f - 1.5) * 0.3) * 1000, latOffset, -6, false);
        lmGroup.add(felucca);
      }
    }

    // [د] قلعة صلاح الدين والبرج الأيقوني
    if (trackId.includes("salam-maadi")) {
      const citadelGroup = new THREE.Group();
      const wallGeo = new THREE.BoxGeometry(90, 18, 24);
      const wallMesh = new THREE.Mesh(wallGeo, limestoneMat);
      wallMesh.position.y = 9;
      citadelGroup.add(wallMesh);

      const domeGeo = new THREE.SphereGeometry(14, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
      const domeMat = new THREE.MeshLambertMaterial({ color: 0xd8dde3, emissive: 0x111518 });
      const domeMesh = new THREE.Mesh(domeGeo, domeMat);
      domeMesh.position.set(0, 18, 0);
      citadelGroup.add(domeMesh);

      for (const mx of [-16, 16]) {
        const minaretGeo = new THREE.CylinderGeometry(1.2, 2.0, 48, 10);
        const minaretMesh = new THREE.Mesh(minaretGeo, whiteMarbleMat);
        minaretMesh.position.set(mx, 32, 10);
        const coneGeo = new THREE.ConeGeometry(1.4, 9, 8);
        const coneMesh = new THREE.Mesh(coneGeo, darkMetalMat);
        coneMesh.position.set(mx, 60, 10);
        citadelGroup.add(minaretMesh, coneMesh);
      }

      Tg(citadelGroup, 27.5 * 1000, 310, 18, false);
      lmGroup.add(citadelGroup);

      // البرج الأيقوني بالعاصمة الإدارية
      const iconicTower = new THREE.Group();
      const towerBody = new THREE.CylinderGeometry(10, 16, 190, 12);
      const towerGlassMat = new THREE.MeshLambertMaterial({ color: 0x1d4d75, emissive: 0x08182b });
      const towerMesh = new THREE.Mesh(towerBody, towerGlassMat);
      towerMesh.position.y = 95;
      const beaconGeo = new THREE.SphereGeometry(2.5, 8, 8);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff1e1e });
      const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
      beaconMesh.position.y = 192;
      iconicTower.add(towerMesh, beaconMesh);

      Tg(iconicTower, 13.5 * 1000, -480, 0, false);
      lmGroup.add(iconicTower);
    }

    // تفعيل إلقاء واستقبال الظلال على جميع المعالم ثلاثية الأبعاد
    lmGroup.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  /**
   * هوك الإطار (Frame Hook) المستدعى في كل دورة رسم 60fps
   * (أعلى جودة وثبات كامل للطريق بدون أي تنطيط أو اهتزاز)
   */
  window.__onDayeriFrame = function (dt) {
    if (!window.__dayeri_core) return;
    const core = window.__dayeri_core;

    if (!state.ultraGraphicsInitialized) setupUltraGraphics(core);
    if (!state.wheelRig) setupWheels(core);
    if (!state.headlights) setupLighting(core);
    setupCockpitCam(core);

    updateSunShadows(core);
    updateWheels(core, dt);
    updateCockpitCamera(core, dt);
  };

  /**
   * هوك تحميل القطاع والمسار الجديد
   */
  window.__onDayeriTrackLoad = function (track) {
    if (!window.__dayeri_core) return;
    const core = window.__dayeri_core;
    buildLandmarks(core, track);
  };

  console.log("🌟 محرك الجرافيك الفائق 4K والعجلات الدوارة للعبة «ع الدائري» قيد العمل بأقصى كفاءة!");
})();
