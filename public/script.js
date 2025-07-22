document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('gallery');
  let scene, camera, renderer, controls, mesh;
  let darkBackground = true;

  function initRenderer() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth - 250, window.innerHeight);
    renderer.setClearColor(darkBackground ? 0x000000 : 0xffffff);
    
    const renderArea = document.getElementById('renderArea');
    renderArea.innerHTML = '';
    renderArea.appendChild(renderer.domElement);

    // Iluminação melhorada
    scene.add(new THREE.AmbientLight(0x404040, 0.4)); // Luz ambiente mais suave
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-1, -1, -1);
    scene.add(directionalLight2);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
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
          div.style.cursor = 'pointer';
          div.style.padding = '10px';
          div.style.margin = '5px';
          div.style.backgroundColor = '#f0f0f0';
          div.style.borderRadius = '5px';
          div.style.border = '1px solid #ccc';
          
          div.addEventListener('click', () => {
            console.log('Carregando arquivo:', file);
            loadSTL(`/uploads/${file}`);
          });
          
          div.addEventListener('mouseenter', () => {
            div.style.backgroundColor = '#e0e0e0';
          });
          
          div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = '#f0f0f0';
          });
          
          gallery.appendChild(div);
        });
      })
      .catch(err => {
        console.error('Erro ao carregar galeria:', err);
      });
  }

  function loadSTL(url) {
    console.log('Iniciando carregamento do STL:', url);
    
    if (!scene) {
      console.log('Inicializando renderer...');
      initRenderer();
    }

    const loader = new THREE.STLLoader();

    loader.load(
      url,
      function(geometry) {
        console.log('STL carregado com sucesso:', geometry);
        
        // Remove mesh anterior se existir
        if (mesh) {
          scene.remove(mesh);
        }

        // Centraliza a geometria
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);

        // Cria material e mesh
        const material = new THREE.MeshLambertMaterial({ 
          
        });
        
        mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2; // Orientação de boca
        scene.add(mesh);
        
        console.log('Mesh adicionado à cena');
        zoomExtents();
      },
      function(progress) {
        console.log('Progresso do carregamento:', (progress.loaded / progress.total * 100) + '%');
      },
      function(error) {
        console.error('Erro ao carregar STL:', error);
        alert('Erro ao carregar o arquivo STL. Verifique se o arquivo é válido.');
      }
    );
  }

  function zoomExtents() {
    if (!mesh) {
      console.log('Nenhum mesh para ajustar zoom');
      return;
    }
    
    const box = new THREE.Box3().setFromObject(mesh);
    const sizeVec = new THREE.Vector3();
    box.getSize(sizeVec);
    const size = box.getSize(new THREE.Vector3()).length();
    const center = box.getCenter(new THREE.Vector3());

    console.log('Ajustando câmera - Tamanho:', size, 'Centro:', center);

    // Ajusta a câmera
    camera.near = size / 1000;
    camera.far = size * 1000;
    camera.updateProjectionMatrix();
    
    // Posiciona a câmera para uma visão de "boca"
    const distance = Math.max(sizeVec.x, sizeVec.y, sizeVec.z) * 1.2;
    camera.position.copy(center);
    camera.position.y += sizeVec.y / 2; // Um pouco acima
    camera.position.z += distance; // Frontal
    
    camera.lookAt(center);
    controls.target.copy(center);
    controls.update();
    
    console.log('Câmera ajustada');
  }

  function resetCamera() {
    if (mesh) {
      zoomExtents();
    } else {
      camera.position.set(0, 0, 10);
      controls.target.set(0, 0, 0);
      controls.update();
    }
  }

  function toggleBackground() {
    darkBackground = !darkBackground;
    if (renderer) {
      renderer.setClearColor(darkBackground ? 0x000000 : 0xffffff);
    }
  }

  function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  // Event listeners
  window.addEventListener('resize', () => {
    if (camera && renderer) {
      camera.aspect = (window.innerWidth - 250) / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth - 250, window.innerHeight);
    }
  });

  document.getElementById('resetCamera').addEventListener('click', resetCamera);
  document.getElementById('zoomExtents').addEventListener('click', zoomExtents);
  document.getElementById('toggleBackground').addEventListener('click', toggleBackground);

  // Carrega a galeria ao iniciar
  loadGallery();
});