(function(){
console.log('race-scene: loading');
try{
  const container = document.getElementById('three-container');
  if(!container){ console.warn('race-scene: container not found'); return; }

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071018);

  const camera = new THREE.PerspectiveCamera(50, container.clientWidth/container.clientHeight, 0.1, 1000);
  camera.position.set(0, 4, 12);

  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  // lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.position.set(10,20,10);
  sun.castShadow = true;
  scene.add(sun);

  // create an oval spline for the racetrack
  const pts = [];
  const a = 10, b = 6; // ellipse radii
  const segments = 120;
  for(let i=0;i<segments;i++){
    const u = (i/segments) * Math.PI * 2;
    const x = Math.cos(u) * a;
    const z = Math.sin(u) * b;
    pts.push(new THREE.Vector3(x, 0, z));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  curve.closed = true;

  // road surface using TubeGeometry
  const tubeGeo = new THREE.TubeGeometry(curve, 600, 1.6, 8, true);
  const roadMat = new THREE.MeshStandardMaterial({color:0x222222, metalness:0.2, roughness:0.6});
  const road = new THREE.Mesh(tubeGeo, roadMat);
  road.rotation.x = 0;
  scene.add(road);

  // clickable objects (signs + panels)
  const clickableObjects = [];

  // helper: create high-res canvas texture for text panels with wrapping
  function createTextTexture(title, body, w=1024, h=512){
    const canvas = document.createElement('canvas');
    // use devicePixelRatio to make crisp on HiDPI
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // background with slight border
    ctx.fillStyle = '#07161a';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(8,8,w-16,h-16);

    // title
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 36px sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(title, 24, 20);

    // body - word wrap
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    const maxWidth = w - 48;
    const words = body.split(/\s+/);
    let line = '';
    let y = 72;
    for(let n=0;n<words.length;n++){
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if(metrics.width > maxWidth && n > 0){
        ctx.fillText(line, 24, y);
        line = words[n] + ' ';
        y += 22;
      } else {
        line = testLine;
      }
    }
    if(line) ctx.fillText(line, 24, y);

    const tex = new THREE.CanvasTexture(canvas);
    tex.encoding = THREE.sRGBEncoding;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  // create simple bleachers and crowd near a curve point
  function createStands(u, side=1){
    const base = curve.getPointAt(u);
    const tangent = curve.getTangentAt(u).normalize();
    const normal = new THREE.Vector3(-tangent.z,0,tangent.x).multiplyScalar(side);
    const standGroup = new THREE.Group();
    for(let row=0;row<6;row++){
      const seats = 12 - row;
      for(let s=0;s<seats;s++){
        const seat = new THREE.BoxGeometry(0.35,0.25,0.35);
        const mat = new THREE.MeshStandardMaterial({color: 0x444444});
        const mesh = new THREE.Mesh(seat, mat);
        const offset = (s - seats/2) * 0.6;
        const pos = base.clone().add(normal.clone().multiplyScalar(3 + row*0.6)).add(tangent.clone().multiplyScalar(offset));
        mesh.position.copy(pos);
        mesh.position.y = 0.3 + row*0.28;
        mesh.rotation.y = Math.atan2(tangent.x, tangent.z);
        standGroup.add(mesh);
      }
    }
    // add crowd (small colored spheres) on top rows
    for(let i=0;i<80;i++){
      const c = new THREE.SphereGeometry(0.12,6,6);
      const color = new THREE.MeshStandardMaterial({color: Math.random()*0xffffff});
      const m = new THREE.Mesh(c,color);
      const rx = (Math.random()-0.5)*5;
      const rz = (Math.random()-0.2)*6;
      m.position.copy(base.clone().add(normal.clone().multiplyScalar(3 + Math.random()*2)).add(tangent.clone().multiplyScalar(rx)));
      m.position.y = 1.2 + Math.random()*1.0;
      standGroup.add(m);
    }
    scene.add(standGroup);
  }

  // info panels (About/Portfolio/Interests/Projects/Contact) placed around the track
  function addInfoPanel(u, title, body, href){
    const pos = curve.getPointAt(u);
    // compute outward normal to position panel slightly away from track center
    const tangent = curve.getTangentAt(u).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const outward = normal.multiplyScalar(3.2);
    const worldPos = pos.clone().add(outward);

    const tex = createTextTexture(title, body, 1024, 512);
    const mat = new THREE.MeshBasicMaterial({map:tex, side: THREE.FrontSide, transparent:false});
    const geom = new THREE.PlaneGeometry(3.2,1.6);
    const panel = new THREE.Mesh(geom, mat);
    panel.position.copy(worldPos);
    panel.position.y = 1.8;
    // rotate to roughly face outward
    const lookTarget = panel.position.clone().add(normal.clone().multiplyScalar(10));
    panel.lookAt(lookTarget);
    panel.userData = { link: href };
    // add a thin backing for contrast
    const backMat = new THREE.MeshBasicMaterial({color:0x041014});
    const back = new THREE.Mesh(new THREE.PlaneGeometry(3.28,1.68), backMat);
    back.position.copy(panel.position);
    back.position.z -= 0.01;
    back.position.y = panel.position.y;
    back.quaternion.copy(panel.quaternion);
    scene.add(back);
    scene.add(panel);
    clickableObjects.push(panel);
  }

  // create stands and panels at multiple locations
  createStands(0.02, 1);
  createStands(0.35, -1);
  createStands(0.7, 1);

  addInfoPanel(0.02, 'About', 'Game Developer. Click to view About section.', '#body');
  addInfoPanel(0.22, 'Portfolio', 'Showcase of projects. Click to view portfolio.', '#portfolio_sec');
  addInfoPanel(0.35, 'Interests', 'Motorsport, Gaming, Music. Click to view interests.', '#interest_sec');
  addInfoPanel(0.55, 'Projects', 'Projects and work. Click to view project list.', '#project_sec');
  addInfoPanel(0.75, 'Contact', 'Get in touch. Click to view contact.', '#contact_sec');

  // center grass/ground
  const groundGeo = new THREE.PlaneGeometry(200,200);
  const groundMat = new THREE.MeshStandardMaterial({color:0x2a5b2c});
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.position.y = -1.1;
  scene.add(ground);

  // simple car model (body + 4 wheels)
  const car = new THREE.Group();
  const body = new THREE.BoxGeometry(1.8,0.5,1);
  const bodyMat = new THREE.MeshStandardMaterial({color:0xff1e1e, metalness:0.5, roughness:0.4});
  const bodyMesh = new THREE.Mesh(body, bodyMat);
  bodyMesh.position.y = 0.45;
  car.add(bodyMesh);
  const wheelGeo = new THREE.CylinderGeometry(0.18,0.18,0.2,16);
  const wheelMat = new THREE.MeshStandardMaterial({color:0x111111});
  const wheelPositions = [[0.7,0.15,0.45],[ -0.7,0.15,0.45],[0.7,0.15,-0.45],[-0.7,0.15,-0.45]];
  wheelPositions.forEach(p=>{
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI/2;
    w.position.set(p[0], p[1], p[2]);
    car.add(w);
  });
  scene.add(car);

  // start/finish sign hotspots
  const hotspots = [];
  const hotspotMaterial = new THREE.MeshStandardMaterial({color:0xffd200});
  function addSign(u, label, href){
    const pos = curve.getPointAt(u);
    const signGeom = new THREE.BoxGeometry(0.6,0.6,0.2);
    const sign = new THREE.Mesh(signGeom, hotspotMaterial);
    sign.position.copy(pos);
    sign.position.y = 0.7;
    sign.userData = { link: href, label };
    scene.add(sign);
    hotspots.push(sign);
  }
  addSign(0.02, 'Gooitmaar', 'gooitmaar.html');
  addSign(0.35, 'F2Game', 'f2racegame.html');
  addSign(0.7, 'DriveDeliver', 'driveanddeliver.html');

  // raycasting for clicks
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function onPointerDown(e){
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left)/rect.width)*2 -1;
    pointer.y = -((e.clientY - rect.top)/rect.height)*2 +1;
    raycaster.setFromCamera(pointer, camera);
    const inter = raycaster.intersectObjects((clickableObjects||[]).concat(hotspots||[]));
    if(inter.length){
      const obj = inter[0].object;
      if(obj.userData && obj.userData.link){
        const l = obj.userData.link;
        if(typeof l === 'string' && l.startsWith('#')){
          const el = document.querySelector(l);
          if(el) el.scrollIntoView({behavior:'smooth'});
        }else{
          window.location.href = l;
        }
      }
    }
  }
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  // scroll mapping: page scroll 0..1 -> curve 0..1
  let scrollProgress = 0;
  function onScroll(){
    const body = document.body, html = document.documentElement;
    const docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    const maxScroll = Math.max(1, docHeight - window.innerHeight);
    scrollProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
  }
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  // animation loop: place car at curve point according to scrollProgress
  const tempVec = new THREE.Vector3();
  const tempTangent = new THREE.Vector3();
  function animate(){
    requestAnimationFrame(animate);

    const u = scrollProgress; // 0..1 along curve
    const pos = curve.getPointAt(u);
    car.position.copy(pos);
    // orient using tangent
    tempTangent.copy(curve.getTangentAt(u)).normalize();
    const lookAtPos = tempVec.copy(pos).add(tempTangent);
    car.lookAt(lookAtPos);

    // camera follow behind and slightly above
    const camOffset = tempTangent.clone().multiplyScalar(-5).add(new THREE.Vector3(0,2,0));
    const desiredCam = car.position.clone().add(camOffset);
    camera.position.lerp(desiredCam, 0.14);
    camera.lookAt(car.position.clone().add(new THREE.Vector3(0,0.5,0)));
    // make panels face camera for readability
    if(clickableObjects && clickableObjects.length){
      clickableObjects.forEach(p=>{
        // keep upright: compute lookAt but zero out pitch
        const v = camera.position.clone();
        v.y = p.position.y; // keep same height so panel doesn't tilt too much
        p.lookAt(v);
      });
    }
    renderer.render(scene, camera);
  }

  function onResize(){
    camera.aspect = container.clientWidth/container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);
  onResize();
  animate();

}catch(err){
  console.error('race-scene error:', err);
}
})();

// --- hero toggle button (separate from scene try/catch so it always exists) ---
(function(){
  try{
    const container = document.getElementById('three-container');
    const layout = document.querySelector('.mdl-js-layout');
    if(!container || !layout) return;

    // create button
    const btn = document.createElement('button');
    btn.id = 'hero-toggle-btn';
    btn.textContent = 'Verberg hero';
    document.body.appendChild(btn);

    // helper to set layout margin when hero visible
    function setLayoutForHeroVisible(){
      layout.style.marginTop = window.innerHeight + 'px';
    }

    // helper to reset layout when hero hidden
    function setLayoutForHeroHidden(){
      layout.style.marginTop = '64px';
    }

    // initial: hero visible -> push layout
    setLayoutForHeroVisible();
    window.addEventListener('resize', setLayoutForHeroVisible);

    let hidden = false;
    btn.addEventListener('click', ()=>{
      hidden = !hidden;
      if(hidden){
        container.style.display = 'none';
        btn.textContent = 'Toon hero';
        setLayoutForHeroHidden();
      }else{
        container.style.display = '';
        btn.textContent = 'Verberg hero';
        setLayoutForHeroVisible();
      }
    });
  }catch(e){ console.warn('hero toggle init failed', e); }
})();
