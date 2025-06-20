document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('gallery');
  let scene, camera, renderer, controls, loader, mesh;
  let darkBackground = true;

  function initRenderer() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth - 250, window.innerHeight);
    document.getElementById('renderArea').innerHTML = '';
    document.getElementById('renderArea').appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x555555));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    camera.position.set(0, 0, 10);
    controls.update();

    animate();
  }

  function loadGallery() {
    fetch('/list-files')
      .then(res => res.json())
      .then(files => {
        gallery.innerHTML = '';
        files.forEach(file => {
          const div = document.createElement('div');
          div.classList.add('gallery-item');
          div.textContent = file;
          div.addEventListener('click', () => loadSTL(`/uploads/${file}`));
          gallery.appendChild(div);
        });
      });
  }

  function loadSTL(url) {
    if (!scene) initRenderer();
    loader = new THREE.STLLoader();

    loader.load(url, geometry => {
      if (mesh) scene.remove(mesh);
      const material = new THREE.MeshNormalMaterial();
      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      zoomExtents();
    });
  }

  function zoomExtents() {
    if (!mesh) return;
    const box = new THREE.Box3().setFromObject(mesh);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    camera.near = size / 100;
    camera.far = size * 100;
    camera.position.copy(center);
    camera.position.z += size * 1.5;
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
  }

  function resetCamera() {
    camera.position.set(0, 0, 10);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  function toggleBackground() {
    darkBackground = !darkBackground;
    renderer.setClearColor(darkBackground ? 0x000000 : 0xffffff);
  }

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', () => {
    camera.aspect = (window.innerWidth - 250) / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth - 250, window.innerHeight);
  });

  document.getElementById('resetCamera').addEventListener('click', resetCamera);
  document.getElementById('zoomExtents').addEventListener('click', zoomExtents);
  document.getElementById('toggleBackground').addEventListener('click', toggleBackground);

  loadGallery();
});
