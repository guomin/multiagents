<template>
  <div class="exhibition-3d-container" ref="containerRef">
    <canvas ref="canvasRef"></canvas>
    <div class="overlay-content">
      <div class="overlay-text">
        <h2 class="overlay-title">✨ 数字艺术展厅</h2>
        <p class="overlay-subtitle">拖动旋转 · 滚轮缩放 · 沉浸式体验</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const containerRef = ref<HTMLElement>()
const canvasRef = ref<HTMLCanvasElement>()
let scene: any = null
let camera: any = null
let renderer: any = null
let animationId: number = 0

onMounted(() => {
  init3DScene()
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

const init3DScene = () => {
  // 动态导入 Three.js（支持 tree-shaking）
  import('three').then((THREE) => {
    if (!containerRef.value || !canvasRef.value) return

    // 场景设置 - 深邃的暗色背景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0a0a15)

    // 相机设置 - 室内视角
    const aspect = containerRef.value.clientWidth / containerRef.value.clientHeight
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
    camera.position.set(0, 5, 18)
    camera.lookAt(0, 3, 0)

    // 渲染器设置 - 启用高级特性
    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
      alpha: true
    })
    renderer.setSize(containerRef.value.clientWidth, containerRef.value.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace

    // 灯光设置 - 多层次精致照明
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    scene.add(ambientLight)

    // 顶部主光源 - 更柔和
    const mainLight = new THREE.DirectionalLight(0xfff5e6, 0.6)
    mainLight.position.set(0, 18, 0)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 50
    mainLight.shadow.camera.left = -20
    mainLight.shadow.camera.right = 20
    mainLight.shadow.camera.top = 20
    mainLight.shadow.camera.bottom = -20
    scene.add(mainLight)

    // 彩色氛围光 - 四角点缀
    const cornerLights = [
      { color: 0x3b82f6, pos: [-12, 8, 12] },  // 蓝色
      { color: 0x8b5cf6, pos: [12, 8, 12] },   // 紫色
      { color: 0xec4899, pos: [-12, 8, -12] }, // 粉色
      { color: 0x06b6d4, pos: [12, 8, -12] }   // 青色
    ]

    cornerLights.forEach(light => {
      const pointLight = new THREE.PointLight(light.color, 0.8, 20)
      pointLight.position.set(...light.pos)
      scene.add(pointLight)
    })

    // 中央金色光晕
    const centerGlow = new THREE.PointLight(0xffd700, 1.5, 15)
    centerGlow.position.set(0, 6, 0)
    scene.add(centerGlow)

    // 创建展览馆内部场景
    createExhibitionBuilding(THREE)

    // 创建粒子效果
    createParticles(THREE)

    // 鼠标交互已禁用 - 仅展示自动旋转动画

    // 动画循环 - 添加丰富的动态效果
    const time = Date.now() * 0.001

    const animate = () => {
      animationId = requestAnimationFrame(animate)

      const currentTime = Date.now() * 0.001

      // 自动缓慢旋转 - 持续进行
      scene.rotation.y += 0.001

      // 粒子动画 - 缓慢旋转和浮动
      const particles = scene.getObjectByName('particles')
      if (particles && particles.material.uniforms) {
        particles.rotation.y += 0.0003
        particles.rotation.x = Math.sin(currentTime * 0.2) * 0.05
        particles.material.uniforms.time.value = currentTime
      }

      // 量子雕塑旋转
      const quantumSculpture = scene.getObjectByName('rotatingArt0')
      if (quantumSculpture) {
        quantumSculpture.rotation.y += 0.01
        quantumSculpture.rotation.z = Math.sin(currentTime * 0.5) * 0.2
      }

      // 卫星公转
      for (let i = 0; i < 3; i++) {
        const satellite = scene.getObjectByName('satellite0_' + i)
        if (satellite && satellite.userData) {
          satellite.userData.angle += satellite.userData.speed
          satellite.position.x = Math.cos(satellite.userData.angle) * satellite.userData.radius
          satellite.position.z = Math.sin(satellite.userData.angle) * satellite.userData.radius
        }
      }

      // 水晶立方各层独立旋转
      for (let i = 0; i < 3; i++) {
        const cube = scene.getObjectByName('rotatingArt1_' + i)
        if (cube) {
          cube.rotation.x += 0.005 * (i + 1)
          cube.rotation.y += 0.003 * (i + 1)
        }
      }

      // 水晶立方内核脉动
      const pulsingCore1 = scene.getObjectByName('pulsingCore1')
      if (pulsingCore1) {
        const scale = 1 + Math.sin(currentTime * 2) * 0.1
        pulsingCore1.scale.set(scale, scale, scale)
      }

      // 星际球体系统旋转
      const sphereSystem = scene.getObjectByName('rotatingSystem2')
      if (sphereSystem) {
        sphereSystem.rotation.y += 0.008
        sphereSystem.rotation.z = Math.sin(currentTime * 0.3) * 0.1
      }

      // 时间之环 - 各环不同速旋转
      for (let i = 0; i < 4; i++) {
        const ring = scene.getObjectByName('ring3_' + i)
        if (ring && ring.userData) {
          if (i % 2 === 0) {
            ring.rotation.z += ring.userData.rotationSpeed
          } else {
            ring.rotation.y += ring.userData.rotationSpeed
          }
        }
      }

      // 中央主展品动画
      const mainCrystalOuter = scene.getObjectByName('mainCrystalOuter')
      if (mainCrystalOuter) {
        mainCrystalOuter.rotation.y += 0.003
        mainCrystalOuter.rotation.x = Math.sin(currentTime * 0.5) * 0.1
      }

      const mainCrystalMiddle = scene.getObjectByName('mainCrystalMiddle')
      if (mainCrystalMiddle) {
        mainCrystalMiddle.rotation.y -= 0.005
        mainCrystalMiddle.rotation.z += 0.003
      }

      const mainCore = scene.getObjectByName('mainCore')
      if (mainCore) {
        // 内核快速脉动
        const coreScale = 1 + Math.sin(currentTime * 3) * 0.15
        mainCore.scale.set(coreScale, coreScale, coreScale)
        mainCore.rotation.y += 0.02
      }

      // 能量环动画
      for (let i = 0; i < 3; i++) {
        const energyRing = scene.getObjectByName('energyRing' + i)
        if (energyRing) {
          energyRing.rotation.z += (i + 1) * 0.002
          const ringScale = 1 + Math.sin(currentTime * 2 + i) * 0.05
          energyRing.scale.set(ringScale, ringScale, ringScale)
        }
      }

      renderer.render(scene, camera)
    }

    animate()

    // 响应窗口大小变化
    const handleResize = () => {
      if (!containerRef.value || !camera || !renderer) return

      const width = containerRef.value.clientWidth
      const height = containerRef.value.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // 清理函数
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })
  })
}

const createExhibitionBuilding = (THREE: any) => {
  const interiorGroup = new THREE.Group()

  // ===== 高级材质定义 =====
  // 高反射地面 - 如镜面般
  const floorMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1a1a2e,
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 1.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1
  })

  // 墙壁材质 - 深色调
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f0f1a,
    metalness: 0.3,
    roughness: 0.7,
    side: THREE.DoubleSide
  })

  // 展示台底座 - 黑色高光
  const pedestalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a0a,
    metalness: 0.8,
    roughness: 0.2,
    clearcoat: 1.0
  })

  // 金色装饰 - 高品质金属
  const goldMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffd700,
    metalness: 1.0,
    roughness: 0.15,
    envMapIntensity: 1.5,
    clearcoat: 1.0
  })

  // 铬银色
  const chromeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1.0,
    roughness: 0.05,
    envMapIntensity: 2.0
  })

  // 发光材质 - 用于核心展品
  const glowingMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x4fc3f7,
    metalness: 0.1,
    roughness: 0.1,
    emissive: 0x4fc3f7,
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.9
  })

  // 玻璃材质
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.95,
    thickness: 0.5,
    envMapIntensity: 1.0,
    transparent: true,
    opacity: 0.3
  })

  // ===== 地面 - 镜面效果 =====
  const floorGeometry = new THREE.PlaneGeometry(36, 36)
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  interiorGroup.add(floor)

  // 地面装饰 - 发光圆环
  const ringGeometry = new THREE.RingGeometry(5, 5.2, 64)
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide
  })
  const centerRing = new THREE.Mesh(ringGeometry, ringMaterial)
  centerRing.rotation.x = -Math.PI / 2
  centerRing.position.y = 0.02
  interiorGroup.add(centerRing)

  // 外围装饰环
  const outerRingGeometry = new THREE.RingGeometry(11, 11.15, 64)
  const outerRingMaterial = new THREE.MeshBasicMaterial({
    color: 0x8b5cf6,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  })
  const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial)
  outerRing.rotation.x = -Math.PI / 2
  outerRing.position.y = 0.02
  interiorGroup.add(outerRing)

  // ===== 墙壁 =====
  const wallHeight = 12
  const roomWidth = 32
  const roomDepth = 32

  // 后墙
  const backWallGeometry = new THREE.BoxGeometry(roomWidth, wallHeight, 0.5)
  const backWall = new THREE.Mesh(backWallGeometry, wallMaterial)
  backWall.position.set(0, wallHeight / 2, -roomDepth / 2)
  backWall.receiveShadow = true
  interiorGroup.add(backWall)

  // 左墙
  const leftWallGeometry = new THREE.BoxGeometry(0.5, wallHeight, roomDepth)
  const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial)
  leftWall.position.set(-roomWidth / 2, wallHeight / 2, 0)
  leftWall.receiveShadow = true
  interiorGroup.add(leftWall)

  // 右墙
  const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial)
  rightWall.position.set(roomWidth / 2, wallHeight / 2, 0)
  rightWall.receiveShadow = true
  interiorGroup.add(rightWall)

  // 天花板 - 深色
  const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth)
  const ceilingMaterial = new THREE.MeshStandardMaterial({
    color: 0x0a0a0f,
    metalness: 0.5,
    roughness: 0.8,
    side: THREE.DoubleSide
  })
  const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial)
  ceiling.rotation.x = Math.PI / 2
  ceiling.position.y = wallHeight
  ceiling.receiveShadow = true
  interiorGroup.add(ceiling)

  // ===== 精致展品展示台（仅4个，分布在角落） =====
  const exhibitPositions = [
    { x: -10, z: -8, name: '量子雕塑' },
    { x: 10, z: -8, name: '水晶立方' },
    { x: -10, z: 8, name: '星际球体' },
    { x: 10, z: 8, name: '时间之环' }
  ]

  exhibitPositions.forEach((pos, index) => {
    const exhibitGroup = new THREE.Group()

    // 展示台底座 - 三层结构
    const base1Geometry = new THREE.CylinderGeometry(2, 2.2, 0.3, 32)
    const base1 = new THREE.Mesh(base1Geometry, pedestalMaterial)
    base1.position.y = 0.15
    base1.castShadow = true
    base1.receiveShadow = true
    exhibitGroup.add(base1)

    const base2Geometry = new THREE.CylinderGeometry(1.5, 1.7, 0.4, 32)
    const base2 = new THREE.Mesh(base2Geometry, goldMaterial)
    base2.position.y = 0.5
    base2.castShadow = true
    exhibitGroup.add(base2)

    const base3Geometry = new THREE.CylinderGeometry(1.3, 1.5, 0.2, 32)
    const base3 = new THREE.Mesh(base3Geometry, chromeMaterial)
    base3.position.y = 0.8
    base3.castShadow = true
    exhibitGroup.add(base3)

    // 发光环
    const glowRingGeometry = new THREE.TorusGeometry(1.4, 0.05, 16, 32)
    const glowRingMaterial = new THREE.MeshBasicMaterial({
      color: [0x3b82f6, 0x8b5cf6, 0xec4899, 0x06b6d4][index],
      transparent: true,
      opacity: 0.8
    })
    const glowRing = new THREE.Mesh(glowRingGeometry, glowRingMaterial)
    glowRing.rotation.x = Math.PI / 2
    glowRing.position.y = 0.85
    exhibitGroup.add(glowRing)

    // 不同类型的精致展品
    if (index === 0) {
      // 量子雕塑 - 复杂的环面结
      const sculptureGeometry = new THREE.TorusKnotGeometry(0.7, 0.25, 128, 16)
      const sculptureMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00ffff,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x0088ff,
        emissiveIntensity: 0.5,
        clearcoat: 1.0
      })
      const sculpture = new THREE.Mesh(sculptureGeometry, sculptureMaterial)
      sculpture.position.y = 2.5
      sculpture.castShadow = true
      sculpture.name = 'rotatingArt' + index
      exhibitGroup.add(sculpture)

      // 添加小卫星
      for (let i = 0; i < 3; i++) {
        const satelliteGeometry = new THREE.SphereGeometry(0.15, 16, 16)
        const satellite = new THREE.Mesh(satelliteGeometry, goldMaterial)
        satellite.userData = { angle: (i * Math.PI * 2) / 3, radius: 1.2, speed: 0.01 + i * 0.005 }
        satellite.position.y = 2.5
        satellite.name = 'satellite' + index + '_' + i
        exhibitGroup.add(satellite)
      }
    } else if (index === 1) {
      // 水晶立方 - 多层透明结构
      for (let i = 0; i < 3; i++) {
        const cubeGeometry = new THREE.BoxGeometry(1.2 - i * 0.3, 1.2 - i * 0.3, 1.2 - i * 0.3)
        const cubeMaterial = new THREE.MeshPhysicalMaterial({
          color: [0x3b82f6, 0x8b5cf6, 0xec4899][i],
          metalness: 0.1,
          roughness: 0.0,
          transmission: 0.9,
          thickness: 0.5,
          envMapIntensity: 1.0,
          transparent: true,
          opacity: 0.6
        })
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
        cube.position.y = 2 + i * 0.5
        cube.rotation.set(i * 0.5, i * 0.3, i * 0.7)
        cube.castShadow = true
        cube.name = 'rotatingArt' + index + '_' + i
        exhibitGroup.add(cube)
      }

      // 内核发光体
      const coreGeometry = new THREE.IcosahedronGeometry(0.3, 1)
      const core = new THREE.Mesh(coreGeometry, glowingMaterial)
      core.position.y = 3.5
      core.name = 'pulsingCore' + index
      exhibitGroup.add(core)
    } else if (index === 2) {
      // 星际球体 - 多球体组合
      const sphereGroup = new THREE.Group()
      sphereGroup.position.y = 2.5

      for (let i = 0; i < 5; i++) {
        const sphereGeometry = new THREE.SphereGeometry(0.3 - i * 0.05, 32, 32)
        const sphereMaterial = new THREE.MeshPhysicalMaterial({
          color: 0xffd700,
          metalness: 1.0,
          roughness: 0.1,
          envMapIntensity: 2.0
        })
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        const angle = (i / 5) * Math.PI * 2
        sphere.position.set(Math.cos(angle) * 0.8, Math.sin(angle) * 0.3, Math.sin(angle) * 0.8)
        sphere.castShadow = true
        sphereGroup.add(sphere)
      }

      // 中央核心
      const coreGeometry = new THREE.SphereGeometry(0.4, 32, 32)
      const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.0,
        emissive: 0xffa500,
        emissiveIntensity: 1.5
      })
      const core = new THREE.Mesh(coreGeometry, coreMaterial)
      sphereGroup.add(core)

      sphereGroup.name = 'rotatingSystem' + index
      exhibitGroup.add(sphereGroup)
    } else {
      // 时间之环 - 多重旋转环
      for (let i = 0; i < 4; i++) {
        const ringGeometry = new THREE.TorusGeometry(0.6 + i * 0.25, 0.05, 16, 32)
        const ringMaterial = new THREE.MeshPhysicalMaterial({
          color: [0x3b82f6, 0x8b5cf6, 0xec4899, 0xffd700][i],
          metalness: 0.9,
          roughness: 0.1,
          emissive: [0x3b82f6, 0x8b5cf6, 0xec4899, 0xffd700][i],
          emissiveIntensity: 0.3
        })
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.position.y = 2.5
        ring.rotation.x = Math.PI / 2 + i * 0.3
        ring.rotation.y = i * 0.5
        ring.name = 'ring' + index + '_' + i
        ring.userData = { rotationSpeed: (i + 1) * 0.005 }
        exhibitGroup.add(ring)
      }
    }

    exhibitGroup.position.set(pos.x, 0, pos.z)
    interiorGroup.add(exhibitGroup)

    // 添加射灯
    const spotLight = new THREE.SpotLight([0x00ffff, 0xff00ff, 0xffff00, 0x00ff00][index], 3, 15, Math.PI / 5, 0.5, 1, 15)
    spotLight.position.set(pos.x, 11, pos.z)
    spotLight.target.position.set(pos.x, 2.5, pos.z)
    spotLight.castShadow = true
    spotLight.shadow.mapSize.width = 1024
    spotLight.shadow.mapSize.height = 1024
    scene.add(spotLight)
    scene.add(spotLight.target)
  })

  // ===== 中央主展品 - 超级精致 =====
  const centerExhibitGroup = new THREE.Group()

  // 大型展示台基座
  const centerBase1Geometry = new THREE.CylinderGeometry(4, 4.5, 0.5, 64)
  const centerBase1 = new THREE.Mesh(centerBase1Geometry, pedestalMaterial)
  centerBase1.position.y = 0.25
  centerBase1.castShadow = true
  centerBase1.receiveShadow = true
  centerExhibitGroup.add(centerBase1)

  const centerBase2Geometry = new THREE.CylinderGeometry(3.5, 4, 0.4, 64)
  const centerBase2 = new THREE.Mesh(centerBase2Geometry, goldMaterial)
  centerBase2.position.y = 0.7
  centerBase2.castShadow = true
  centerExhibitGroup.add(centerBase2)

  // 发光平台
  const platformGeometry = new THREE.CylinderGeometry(3, 3.5, 0.3, 64)
  const platformMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x4fc3f7,
    metalness: 0.8,
    roughness: 0.2,
    emissive: 0x4fc3f7,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.8
  })
  const platform = new THREE.Mesh(platformGeometry, platformMaterial)
  platform.position.y = 1.05
  platform.castShadow = true
  centerExhibitGroup.add(platform)

  // 主展品 - 多层水晶结构
  const mainArtifactGroup = new THREE.Group()
  mainArtifactGroup.position.y = 3.5

  // 外层水晶
  const outerCrystalGeometry = new THREE.OctahedronGeometry(1.5, 0)
  const outerCrystalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.0,
    transmission: 0.95,
    thickness: 1.0,
    envMapIntensity: 1.5,
    transparent: true,
    opacity: 0.4
  })
  const outerCrystal = new THREE.Mesh(outerCrystalGeometry, outerCrystalMaterial)
  outerCrystal.castShadow = true
  outerCrystal.name = 'mainCrystalOuter'
  mainArtifactGroup.add(outerCrystal)

  // 中层晶体
  const middleCrystalGeometry = new THREE.DodecahedronGeometry(1.0, 0)
  const middleCrystalMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x3b82f6,
    metalness: 0.3,
    roughness: 0.1,
    transmission: 0.8,
    thickness: 0.5,
    emissive: 0x3b82f6,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7
  })
  const middleCrystal = new THREE.Mesh(middleCrystalGeometry, middleCrystalMaterial)
  middleCrystal.castShadow = true
  middleCrystal.name = 'mainCrystalMiddle'
  mainArtifactGroup.add(middleCrystal)

  // 内核 - 发光能量核心
  const innerCoreGeometry = new THREE.IcosahedronGeometry(0.5, 1)
  const innerCoreMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.0,
    emissive: 0x4fc3f7,
    emissiveIntensity: 3.0,
    transparent: true,
    opacity: 0.9
  })
  const innerCore = new THREE.Mesh(innerCoreGeometry, innerCoreMaterial)
  innerCore.name = 'mainCore'
  mainArtifactGroup.add(innerCore)

  // 能量环
  for (let i = 0; i < 3; i++) {
    const energyRingGeometry = new THREE.TorusGeometry(2 + i * 0.3, 0.03, 16, 64)
    const energyRingMaterial = new THREE.MeshBasicMaterial({
      color: [0x3b82f6, 0x8b5cf6, 0xec4899][i],
      transparent: true,
      opacity: 0.6
    })
    const energyRing = new THREE.Mesh(energyRingGeometry, energyRingMaterial)
    energyRing.rotation.x = Math.PI / 2
    energyRing.name = 'energyRing' + i
    mainArtifactGroup.add(energyRing)
  }

  centerExhibitGroup.add(mainArtifactGroup)

  // 中央展品专用聚光灯
  const centerSpotLight = new THREE.SpotLight(0xffffff, 5, 20, Math.PI / 4, 0.3, 1, 20)
  centerSpotLight.position.set(0, 12, 0)
  centerSpotLight.target.position.set(0, 3.5, 0)
  centerSpotLight.castShadow = true
  centerSpotLight.shadow.mapSize.width = 2048
  centerSpotLight.shadow.mapSize.height = 2048
  scene.add(centerSpotLight)
  scene.add(centerSpotLight.target)

  // 顶部光柱效果
  const lightBeamGeometry = new THREE.CylinderGeometry(0.1, 2, 10, 32, 1, true)
  const lightBeamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.05,
    side: THREE.DoubleSide
  })
  const lightBeam = new THREE.Mesh(lightBeamGeometry, lightBeamMaterial)
  lightBeam.position.set(0, 7, 0)
  centerExhibitGroup.add(lightBeam)

  interiorGroup.add(centerExhibitGroup)

  // ===== 精致墙面挂画（3幅，后墙） =====
  const paintingPositions = [-8, 0, 8]

  paintingPositions.forEach((xPos, index) => {
    const paintingGroup = new THREE.Group()

    // 画框 - 多层结构
    const frameOuterGeometry = new THREE.BoxGeometry(4.5, 6, 0.3)
    const frameOuterMaterial = new THREE.MeshPhysicalMaterial({
      color: index % 2 === 0 ? 0x8b4513 : 0xffd700,
      metalness: 0.8,
      roughness: 0.3
    })
    const frameOuter = new THREE.Mesh(frameOuterGeometry, frameOuterMaterial)
    frameOuter.position.z = 0.15
    paintingGroup.add(frameOuter)

    const frameInnerGeometry = new THREE.BoxGeometry(4.2, 5.7, 0.2)
    const frameInnerMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x1a1a1a,
      metalness: 0.9,
      roughness: 0.2
    })
    const frameInner = new THREE.Mesh(frameInnerGeometry, frameInnerMaterial)
    frameInner.position.z = 0.25
    paintingGroup.add(frameInner)

    // 画布 - 使用渐变色
    const canvasGeometry = new THREE.PlaneGeometry(3.8, 5.3)
    const canvasColors = [0x1e40af, 0x7c3aed, 0xbe185d]
    const canvasMaterial = new THREE.MeshStandardMaterial({
      color: canvasColors[index],
      metalness: 0.2,
      roughness: 0.8,
      side: THREE.DoubleSide
    })
    const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial)
    canvas.position.z = 0.35
    paintingGroup.add(canvas)

    // 画作照明
    const paintingLight = new THREE.SpotLight(canvasColors[index], 2, 8, Math.PI / 6, 0.5, 1, 10)
    paintingLight.position.set(xPos, 10, -12)
    paintingLight.target.position.set(xPos, 5, -15)
    scene.add(paintingLight)
    scene.add(paintingLight.target)

    paintingGroup.position.set(xPos, 5, -15.5)
    interiorGroup.add(paintingGroup)
  })

  scene.add(interiorGroup)
}

const createParticles = (THREE: any) => {
  const particleCount = 500
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)
  const sizes = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3

    // 在室内空间随机分布
    positions[i3] = (Math.random() - 0.5) * 30
    positions[i3 + 1] = Math.random() * 10 + 2
    positions[i3 + 2] = (Math.random() - 0.5) * 30

    // 多彩粒子 - 金色、蓝色、紫色、粉色
    const colorChoice = Math.random()
    if (colorChoice < 0.25) {
      // 金色
      colors[i3] = 1.0
      colors[i3 + 1] = 0.84 + Math.random() * 0.16
      colors[i3 + 2] = 0.0
    } else if (colorChoice < 0.5) {
      // 蓝色
      colors[i3] = 0.23
      colors[i3 + 1] = 0.51
      colors[i3 + 2] = 1.0
    } else if (colorChoice < 0.75) {
      // 紫色
      colors[i3] = 0.55
      colors[i3 + 1] = 0.36
      colors[i3 + 2] = 0.96
    } else {
      // 粉色
      colors[i3] = 1.0
      colors[i3 + 1] = 0.28
      colors[i3 + 2] = 0.6
    }

    // 随机大小
    sizes[i] = Math.random() * 0.2 + 0.05
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  // 使用着色器材质实现发光效果
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 }
    },
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float r = distance(gl_PointCoord, vec2(0.5));
        if (r > 0.5) discard;
        float glow = 1.0 - (r * 2.0);
        glow = pow(glow, 2.0);
        gl_FragColor = vec4(vColor, glow * 0.8);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })

  const particles = new THREE.Points(geometry, material)
  particles.name = 'particles'
  scene.add(particles)
}
</script>

<style scoped>
.exhibition-3d-container {
  position: relative;
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
  animation: fadeInScale 0.6s ease-out;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.exhibition-3d-container canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: default;
}

.overlay-content {
  position: absolute;
  bottom: 24px;
  left: 24px;
  z-index: 10;
  pointer-events: none;
}

.overlay-text {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.overlay-title {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.overlay-subtitle {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 768px) {
  .exhibition-3d-container {
    height: 300px;
  }

  .overlay-content {
    bottom: 16px;
    left: 16px;
    right: 16px;
  }

  .overlay-text {
    padding: 12px 16px;
  }

  .overlay-title {
    font-size: 16px;
  }

  .overlay-subtitle {
    font-size: 12px;
  }
}
</style>
