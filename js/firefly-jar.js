/**
 * 3D Interactive Firefly Jar
 * Built with Three.js for Jar of Light
 * Developed for Ali Rajabi (Computer Graphics & HPC Researcher)
 */

(function () {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        const canvas = document.getElementById('firefly-jar-canvas');
        const container = document.getElementById('firefly-jar-container');
        if (!canvas || !container) return;

        if (typeof THREE === 'undefined') {
            console.warn('Three.js not loaded. Firefly jar disabled.');
            return;
        }

        try {
            setupFireflyJar(canvas, container);
        } catch (err) {
            console.error('Failed to initialize 3D Firefly Jar:', err);
        }
    }

    /* ----------------------------------------------------------------------
     * Main 3D Firefly Jar Scene
     * ---------------------------------------------------------------------- */
    function setupFireflyJar(canvas, container) {
        let width = container.clientWidth || 270;
        let height = container.clientHeight || 320;

        // Scene & Camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);

        // Renderer with 100% transparent clear color
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        // Generate Studio Softbox Environment Map for Physically Correct Glass Speculars
        const studioEnvMap = createStudioEnvironment(renderer);
        scene.environment = studioEnvMap;

        // Calculate Camera Framing to guarantee zero clipping on all sides
        function updateCameraFraming() {
            if (!container || !renderer || !camera) return;
            const w = container.clientWidth || 270;
            const h = container.clientHeight || 320;
            const aspect = w / h;
            camera.aspect = aspect;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);

            const desiredV = 4.7;
            const desiredH = 3.8;
            const halfFOVRad = (camera.fov * Math.PI) / 360;
            const tanHalf = Math.tan(halfFOVRad);

            const distV = (desiredV * 0.5) / tanHalf;
            const distH = (desiredH * 0.5) / (tanHalf * aspect);
            const dist = Math.max(distV, distH, 7.2);

            camera.position.set(0, 0.22, dist);
            camera.lookAt(0, 0.22, 0);
        }
        updateCameraFraming();

        // Main Master Group for Jar Wobble & Parallax
        const jarGroup = new THREE.Group();
        jarGroup.position.set(0, 0.0, 0);
        scene.add(jarGroup);

        /* ------------------------------------------------------------------
         * Lighting Rig (Accurate Studio Specular Highlights)
         * ------------------------------------------------------------------ */
        const ambientLight = new THREE.AmbientLight(0xfff6e8, 0.45);
        scene.add(ambientLight);

        // Key Light: Front-Left, casts the primary sleek vertical specular glint on the jar curvature
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.15);
        keyLight.position.set(-2.8, 2.6, 4.0);
        scene.add(keyLight);

        // Rim / Kicker Light: Right side, highlights the right silhouette of the glass
        const rimLight = new THREE.DirectionalLight(0xfff2d4, 0.85);
        rimLight.position.set(3.2, 2.0, 2.2);
        scene.add(rimLight);

        // Top Light: Accentuates the glass mouth rim and neck collar ridge
        const topLight = new THREE.DirectionalLight(0xffffff, 0.55);
        topLight.position.set(0, 4.5, 2.0);
        scene.add(topLight);

        // Dynamic Point Lights tracking the 3 brightest fireflies
        const pointLight1 = new THREE.PointLight(0xffdf66, 1.4, 3.8, 1.5);
        const pointLight2 = new THREE.PointLight(0xb5ff42, 1.0, 3.2, 1.5);
        const pointLight3 = new THREE.PointLight(0xff9e3b, 0.8, 2.6, 1.5);
        jarGroup.add(pointLight1);
        jarGroup.add(pointLight2);
        jarGroup.add(pointLight3);

        /* ------------------------------------------------------------------
         * Procedural Textures
         * ------------------------------------------------------------------ */
        const glowTexture = createGlowTexture();
        const corkTexture = createCorkTexture();
        const shadowTexture = createShadowTexture();

        const glowBackdropEl = container.querySelector('.firefly-jar-glow-backdrop');
        let smoothHaloIntensity = 0.85;

        /* ------------------------------------------------------------------
         * Volumetric 3D Halo Light Around Jar (Optical Back-Glow)
         * Placed safely BEHIND the jar (z = -1.80) with depthTest: false
         * so it never intersects the 3D glass geometry or causes cutting lines.
         * ------------------------------------------------------------------ */
        const haloMat = new THREE.SpriteMaterial({
            map: glowTexture,
            color: 0xffcb47,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0.35,
            depthWrite: false,
            depthTest: false
        });
        const haloSprite = new THREE.Sprite(haloMat);
        haloSprite.position.set(0, 0.12, -1.80);
        haloSprite.scale.set(3.8, 4.2, 1);
        haloSprite.renderOrder = -1;
        jarGroup.add(haloSprite);

        /* ------------------------------------------------------------------
         * Ground Shadow Disc (Flat on tabletop, never tilts)
         * ------------------------------------------------------------------ */
        const shadowGeo = new THREE.CircleGeometry(1.15, 32);
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTexture,
            transparent: true,
            opacity: 0.50,
            depthWrite: false
        });
        const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        shadowMesh.rotation.x = -Math.PI / 2;
        shadowMesh.position.set(0, -1.48, 0);
        shadowMesh.renderOrder = 0;
        scene.add(shadowMesh);

        /* ------------------------------------------------------------------
         * Glass Jar Geometry (Smooth Spline Contours & Welded Seam Normals)
         * ------------------------------------------------------------------ */
        // Smooth seam normal welding helper for LatheGeometry
        function smoothLatheSeamNormals(geometry, segments, pointsCount) {
            geometry.computeVertexNormals();
            const normalAttr = geometry.attributes.normal;
            if (!normalAttr) return;

            for (let j = 0; j < pointsCount; j++) {
                const idx0 = j * (segments + 1);
                const idxEnd = j * (segments + 1) + segments;

                const n0x = normalAttr.getX(idx0);
                const n0y = normalAttr.getY(idx0);
                const n0z = normalAttr.getZ(idx0);

                const nEx = normalAttr.getX(idxEnd);
                const nEy = normalAttr.getY(idxEnd);
                const nEz = normalAttr.getZ(idxEnd);

                let avgX = (n0x + nEx) * 0.5;
                let avgY = (n0y + nEy) * 0.5;
                let avgZ = (n0z + nEz) * 0.5;
                const len = Math.sqrt(avgX * avgX + avgY * avgY + avgZ * avgZ) || 1.0;

                avgX /= len;
                avgY /= len;
                avgZ /= len;

                normalAttr.setXYZ(idx0, avgX, avgY, avgZ);
                normalAttr.setXYZ(idxEnd, avgX, avgY, avgZ);
            }
            normalAttr.needsUpdate = true;
        }

        // 1. Outer Glass Profile (C2 continuous spline curve, 70 sampled points)
        const outerControlPoints = [
            new THREE.Vector2(0.00, -1.45),
            new THREE.Vector2(0.75, -1.45),
            new THREE.Vector2(0.96, -1.38),
            new THREE.Vector2(1.05, -1.18),
            new THREE.Vector2(1.07, -0.60),
            new THREE.Vector2(1.08,  0.00),
            new THREE.Vector2(1.07,  0.50),
            new THREE.Vector2(1.03,  0.85),
            new THREE.Vector2(0.92,  1.12),
            new THREE.Vector2(0.77,  1.32),
            new THREE.Vector2(0.72,  1.42),
            new THREE.Vector2(0.78,  1.48),
            new THREE.Vector2(0.79,  1.54),
            new THREE.Vector2(0.74,  1.60),
            new THREE.Vector2(0.72,  1.68),
            new THREE.Vector2(0.66,  1.72),
            new THREE.Vector2(0.58,  1.70)
        ];
        const outerCurve = new THREE.SplineCurve(outerControlPoints);
        const outerLathePoints = outerCurve.getPoints(70);

        // 2. Inner Glass Profile (Smooth inner vessel cavity, 60 sampled points)
        const innerControlPoints = [
            new THREE.Vector2(0.58,  1.70),
            new THREE.Vector2(0.60,  1.55),
            new THREE.Vector2(0.62,  1.40),
            new THREE.Vector2(0.70,  1.25),
            new THREE.Vector2(0.83,  1.05),
            new THREE.Vector2(0.93,  0.50),
            new THREE.Vector2(0.94,  0.00),
            new THREE.Vector2(0.93, -0.60),
            new THREE.Vector2(0.90, -1.15),
            new THREE.Vector2(0.80, -1.30),
            new THREE.Vector2(0.60, -1.33),
            new THREE.Vector2(0.00, -1.33)
        ];
        const innerCurve = new THREE.SplineCurve(innerControlPoints);
        const innerLathePoints = innerCurve.getPoints(60);

        const RADIAL_SEGMENTS = 64;
        // Start angle at Math.PI (back) + weld normals for 100% seam-free continuous shading
        const outerJarGeo = new THREE.LatheGeometry(outerLathePoints, RADIAL_SEGMENTS, Math.PI, Math.PI * 2);
        smoothLatheSeamNormals(outerJarGeo, RADIAL_SEGMENTS, outerLathePoints.length);

        const innerJarGeo = new THREE.LatheGeometry(innerLathePoints, RADIAL_SEGMENTS, Math.PI, Math.PI * 2);
        smoothLatheSeamNormals(innerJarGeo, RADIAL_SEGMENTS, innerLathePoints.length);

        // Inner Glass Material (BackSide, transmission: 0 to prevent nested buffer artifacts)
        const innerGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0xf2f7ff,
            metalness: 0.0,
            roughness: 0.15,
            transmission: 0.0,
            thickness: 0.15,
            ior: 1.48,
            transparent: true,
            opacity: 0.16,
            clearcoat: 0.0,
            depthWrite: false,
            side: THREE.BackSide
        });
        const innerGlassMesh = new THREE.Mesh(innerJarGeo, innerGlassMat);
        innerGlassMesh.renderOrder = 0;
        jarGroup.add(innerGlassMesh);

        // Outer Glass Material (FrontSide with realistic specular & clearcoat)
        const outerGlassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0.02,
            roughness: 0.04,
            transmission: 0.93,
            thickness: 0.40,
            ior: 1.52,
            reflectivity: 0.92,
            transparent: true,
            opacity: 0.40,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            depthWrite: false,
            side: THREE.FrontSide
        });
        const outerGlassMesh = new THREE.Mesh(outerJarGeo, outerGlassMat);
        outerGlassMesh.renderOrder = 2;
        jarGroup.add(outerGlassMesh);

        /* ------------------------------------------------------------------
         * Cork Stopper
         * ------------------------------------------------------------------ */
        const corkGeo = new THREE.CylinderGeometry(0.64, 0.56, 0.45, 32);
        const corkMat = new THREE.MeshStandardMaterial({
            map: corkTexture,
            bumpMap: corkTexture,
            bumpScale: 0.035,
            roughness: 0.88,
            metalness: 0.04
        });
        const corkMesh = new THREE.Mesh(corkGeo, corkMat);
        corkMesh.position.y = 1.72;
        corkMesh.renderOrder = 2;
        jarGroup.add(corkMesh);

        /* ------------------------------------------------------------------
         * Rustic Hemp Twine Neck Wrap
         * ------------------------------------------------------------------ */
        const twineGeo = new THREE.TorusGeometry(0.72, 0.028, 10, 48);
        const twineMat = new THREE.MeshStandardMaterial({
            color: 0x82542e,
            roughness: 0.95,
            metalness: 0.0
        });

        const twine1 = new THREE.Mesh(twineGeo, twineMat);
        twine1.position.y = 1.48;
        twine1.rotation.x = Math.PI / 2;
        twine1.renderOrder = 2;
        jarGroup.add(twine1);

        const twine2 = new THREE.Mesh(twineGeo, twineMat);
        twine2.position.y = 1.54;
        twine2.rotation.x = Math.PI / 2;
        twine2.scale.set(1.02, 1.02, 1.02);
        twine2.renderOrder = 2;
        jarGroup.add(twine2);

        const knotGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const knot = new THREE.Mesh(knotGeo, twineMat);
        knot.position.set(0.72, 1.51, 0.08);
        knot.renderOrder = 2;
        jarGroup.add(knot);

        /* ------------------------------------------------------------------
         * Ambient Floating Dust Motes (Micro-sparks)
         * ------------------------------------------------------------------ */
        const dustCount = 20;
        const dustGeo = new THREE.BufferGeometry();
        const dustPositions = new Float32Array(dustCount * 3);
        const dustSpeeds = [];

        for (let i = 0; i < dustCount; i++) {
            dustPositions[i * 3] = (Math.random() - 0.5) * 1.1;
            dustPositions[i * 3 + 1] = -1.0 + Math.random() * 1.9;
            dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.1;
            dustSpeeds.push({
                vy: 0.0012 + Math.random() * 0.0015,
                seed: Math.random() * 100
            });
        }
        dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));

        const dustMat = new THREE.PointsMaterial({
            size: 0.045,
            map: glowTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            opacity: 0.45,
            depthWrite: false,
            color: 0xffdf88
        });
        const dustParticles = new THREE.Points(dustGeo, dustMat);
        dustParticles.renderOrder = 1;
        jarGroup.add(dustParticles);

        /* ------------------------------------------------------------------
         * Inner Jar Containment Bounds Profile
         * ------------------------------------------------------------------ */
        function getJarInnerRadius(y) {
            if (y <= 0.70) {
                return 0.74;
            }
            const t = Math.min(1.0, Math.max(0.0, (y - 0.70) / (1.08 - 0.70)));
            return 0.74 - t * 0.24;
        }

        const FLOOR_Y = -1.15;
        const CEILING_Y = 1.08;

        /* ------------------------------------------------------------------
         * Bioluminescent Fireflies Swarm
         * ------------------------------------------------------------------ */
        const FIREFLY_COUNT = 20;
        const fireflies = [];
        const bugGeo = new THREE.SphereGeometry(0.022, 6, 6);
        const bugMat = new THREE.MeshBasicMaterial({ color: 0x1a1208 });

        for (let i = 0; i < FIREFLY_COUNT; i++) {
            const huePick = Math.random();
            const color = new THREE.Color();
            if (huePick < 0.65) {
                color.setHSL(0.12 + Math.random() * 0.04, 0.98, 0.62);
            } else {
                color.setHSL(0.21 + Math.random() * 0.05, 0.96, 0.58);
            }

            const baseScale = 0.16 + Math.random() * 0.12;

            const spriteMat = new THREE.SpriteMaterial({
                map: glowTexture,
                color: color,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.85
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(baseScale, baseScale, 1);
            sprite.renderOrder = 1;
            jarGroup.add(sprite);

            const bug = new THREE.Mesh(bugGeo, bugMat);
            bug.renderOrder = 1;
            jarGroup.add(bug);

            const initY = -0.9 + Math.random() * 1.8;
            const initMaxR = getJarInnerRadius(initY) * 0.8;
            const initAngle = Math.random() * Math.PI * 2;
            const initR = Math.random() * initMaxR;

            const baseSpeed = 0.0020 + Math.random() * 0.0016;

            fireflies.push({
                sprite: sprite,
                bug: bug,
                pos: new THREE.Vector3(
                    Math.cos(initAngle) * initR,
                    initY,
                    Math.sin(initAngle) * initR
                ),
                vel: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.003,
                    (Math.random() - 0.5) * 0.003,
                    (Math.random() - 0.5) * 0.003
                ),
                wanderAngle: Math.random() * Math.PI * 2,
                elevationAngle: (Math.random() - 0.5) * 0.6,
                baseSpeed: baseSpeed,
                fastMultiplier: 1.0,
                noiseSeed: Math.random() * 500,
                pulseFreq: 1.2 + Math.random() * 1.4,
                pulsePhase: Math.random() * Math.PI * 2,
                baseScale: baseScale,
                currentBrightness: 0.5,
                flashBoost: 1.0
            });
        }

        /* ------------------------------------------------------------------
         * Physics, Wobble & Interaction State
         * ------------------------------------------------------------------ */
        let mouseX = 0;
        let mouseY = 0;
        let targetRotX = 0;
        let targetRotY = 0;
        let isPointerOver = false;

        let wobbleAngleX = 0;
        let wobbleVelX = 0;
        let wobbleAngleZ = 0;
        let wobbleVelZ = 0;
        let isWobbling = false;

        function triggerTapReaction() {
            wobbleVelX = (Math.random() - 0.5) * 0.14;
            wobbleVelZ = (Math.random() > 0.5 ? 1 : -1) * 0.16;
            isWobbling = true;

            for (let i = 0; i < fireflies.length; i++) {
                const ff = fireflies[i];
                ff.flashBoost = 3.2;
                ff.fastMultiplier = 5.0;

                const startleAngle = Math.random() * Math.PI * 2;
                const startleSpeed = 0.020 + Math.random() * 0.012;
                ff.vel.x = Math.cos(startleAngle) * startleSpeed;
                ff.vel.y = (Math.random() - 0.5) * startleSpeed * 1.2;
                ff.vel.z = Math.sin(startleAngle) * startleSpeed;
            }
        }

        window.__triggerFireflyJarTap = triggerTapReaction;

        container.addEventListener('click', function () {
            triggerTapReaction();
        });

        container.addEventListener('mousemove', function (e) {
            isPointerOver = true;
            const rect = container.getBoundingClientRect();
            const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

            mouseX = normX;
            mouseY = normY;
            targetRotY = normX * 0.20;
            targetRotX = -normY * 0.12;
        });

        container.addEventListener('mouseleave', function () {
            isPointerOver = false;
            targetRotX = 0;
            targetRotY = 0;
        });

        container.addEventListener('touchstart', function () {
            triggerTapReaction();
        }, { passive: true });

        // Synchronize with button fireflies
        window.addEventListener('firefly-button-hover', function () {
            for (let i = 0; i < fireflies.length; i++) {
                if (fireflies[i].fastMultiplier <= 1.0) {
                    fireflies[i].fastMultiplier = 1.35;
                }
            }
        });

        window.addEventListener('firefly-button-activate', function () {
            for (let i = 0; i < fireflies.length; i++) {
                const ff = fireflies[i];
                ff.fastMultiplier = Math.max(ff.fastMultiplier, 3.2);
                ff.flashBoost = Math.max(ff.flashBoost, 2.0);
            }
        });

        /* ------------------------------------------------------------------
         * Theme Switch Awareness
         * ------------------------------------------------------------------ */
        function updateThemeColors() {
            const isDark = document.documentElement.dataset.theme === 'dark' ||
                (!document.documentElement.dataset.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);

            if (isDark) {
                ambientLight.intensity = 0.40;
                keyLight.intensity = 1.15;
                rimLight.intensity = 0.85;
                outerGlassMat.opacity = 0.38;
                haloSprite.material.opacity = 0.42;
                shadowMat.opacity = 0.65;
            } else {
                ambientLight.intensity = 0.65;
                keyLight.intensity = 1.25;
                rimLight.intensity = 0.95;
                outerGlassMat.opacity = 0.46;
                haloSprite.material.opacity = 0.32;
                shadowMat.opacity = 0.35;
            }
        }
        updateThemeColors();

        const themeObserver = new MutationObserver(function () {
            updateThemeColors();
        });
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        /* ------------------------------------------------------------------
         * Animation Loop with Viewport Caching
         * ------------------------------------------------------------------ */
        let isVisible = true;
        let animationFrameId = null;
        let lastTime = performance.now() * 0.001;

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible && !animationFrameId) {
                    lastTime = performance.now() * 0.001;
                    renderLoop();
                }
            });
        }, { threshold: 0.05 });
        observer.observe(container);

        document.addEventListener('visibilitychange', function () {
            if (document.hidden) {
                isVisible = false;
            } else {
                isVisible = true;
                if (!animationFrameId) {
                    lastTime = performance.now() * 0.001;
                    renderLoop();
                }
            }
        });

        function renderLoop() {
            animationFrameId = null;
            if (!isVisible) return;

            const now = performance.now() * 0.001;
            const delta = Math.min(now - lastTime, 0.1);
            lastTime = now;

            // Parallax Tilt
            jarGroup.rotation.y += (targetRotY - jarGroup.rotation.y) * 0.06;
            jarGroup.rotation.x += (targetRotX - jarGroup.rotation.x) * 0.06;

            if (!isPointerOver) {
                jarGroup.rotation.y += Math.sin(now * 0.7) * 0.0006;
                jarGroup.position.y = Math.sin(now * 1.2) * 0.015;
            }

            // Spring Wobble Simulation
            if (isWobbling) {
                wobbleVelX += -wobbleAngleX * 24 * delta;
                wobbleVelX *= Math.pow(0.80, delta * 60);
                wobbleAngleX += wobbleVelX * delta * 60;

                wobbleVelZ += -wobbleAngleZ * 26 * delta;
                wobbleVelZ *= Math.pow(0.78, delta * 60);
                wobbleAngleZ += wobbleVelZ * delta * 60;

                jarGroup.rotation.x += wobbleAngleX;
                jarGroup.rotation.z = wobbleAngleZ;

                if (Math.abs(wobbleAngleX) < 0.001 && Math.abs(wobbleVelX) < 0.001 &&
                    Math.abs(wobbleAngleZ) < 0.001 && Math.abs(wobbleVelZ) < 0.001) {
                    jarGroup.rotation.z = 0;
                    isWobbling = false;
                }
            }

            // Update Bioluminescent Fireflies
            const sortedByBrightness = [];
            let swarmBrightnessSum = 0;

            for (let i = 0; i < fireflies.length; i++) {
                const ff = fireflies[i];

                if (ff.fastMultiplier > 1.0) {
                    ff.fastMultiplier = Math.max(1.0, ff.fastMultiplier - delta * 1.6);
                }

                const wanderRate = 0.35 + (ff.fastMultiplier - 1.0) * 0.45;
                ff.wanderAngle += Math.sin(now * wanderRate + ff.noiseSeed) * (0.025 * ff.fastMultiplier);
                ff.elevationAngle += Math.cos(now * (wanderRate * 0.8) + ff.noiseSeed) * (0.018 * ff.fastMultiplier);

                const buoyancy = Math.sin(now * 0.8 + ff.noiseSeed) * 0.0006;

                const currentSpeed = ff.baseSpeed * ff.fastMultiplier;
                const targetVx = Math.cos(ff.wanderAngle) * Math.cos(ff.elevationAngle) * currentSpeed;
                const targetVy = Math.sin(ff.elevationAngle) * currentSpeed + buoyancy;
                const targetVz = Math.sin(ff.wanderAngle) * Math.cos(ff.elevationAngle) * currentSpeed;

                const lerpRate = 0.025 + (ff.fastMultiplier - 1.0) * 0.015;
                ff.vel.x += (targetVx - ff.vel.x) * lerpRate;
                ff.vel.y += (targetVy - ff.vel.y) * lerpRate;
                ff.vel.z += (targetVz - ff.vel.z) * lerpRate;

                if (isPointerOver && ff.fastMultiplier <= 1.2) {
                    const curiousTargetX = mouseX * 0.40;
                    const curiousTargetY = mouseY * 0.40;
                    ff.vel.x += (curiousTargetX - ff.pos.x) * 0.0002;
                    ff.vel.y += (curiousTargetY - ff.pos.y) * 0.0002;
                }

                const maxAllowedSpeed = 0.0036 * ff.fastMultiplier;
                const currentVelocityMagnitude = ff.vel.length();
                if (currentVelocityMagnitude > maxAllowedSpeed) {
                    ff.vel.multiplyScalar(maxAllowedSpeed / currentVelocityMagnitude);
                }

                ff.pos.add(ff.vel);

                // STRICT JAR CONTAINMENT
                const maxR = getJarInnerRadius(ff.pos.y);
                const horizDist = Math.sqrt(ff.pos.x * ff.pos.x + ff.pos.z * ff.pos.z);

                if (horizDist > maxR * 0.78) {
                    const steerForce = (horizDist - maxR * 0.78) * 0.08;
                    ff.vel.x -= (ff.pos.x / horizDist) * steerForce;
                    ff.vel.z -= (ff.pos.z / horizDist) * steerForce;
                }

                if (horizDist >= maxR) {
                    const clampedR = maxR - 0.005;
                    ff.pos.x = (ff.pos.x / horizDist) * clampedR;
                    ff.pos.z = (ff.pos.z / horizDist) * clampedR;

                    const nx = ff.pos.x / clampedR;
                    const nz = ff.pos.z / clampedR;
                    const vDotN = ff.vel.x * nx + ff.vel.z * nz;
                    if (vDotN > 0) {
                        ff.vel.x = (ff.vel.x - 1.8 * vDotN * nx) * 0.6;
                        ff.vel.z = (ff.vel.z - 1.8 * vDotN * nz) * 0.6;
                    }
                }

                if (ff.pos.y <= FLOOR_Y) {
                    ff.pos.y = FLOOR_Y + 0.005;
                    if (ff.vel.y < 0) ff.vel.y = -ff.vel.y * 0.6;
                } else if (ff.pos.y >= CEILING_Y) {
                    ff.pos.y = CEILING_Y - 0.005;
                    if (ff.vel.y > 0) ff.vel.y = -ff.vel.y * 0.6;
                }

                ff.sprite.position.copy(ff.pos);
                ff.bug.position.set(
                    ff.pos.x - ff.vel.x * 2.0,
                    ff.pos.y - ff.vel.y * 2.0,
                    ff.pos.z - ff.vel.z * 2.0
                );

                const pulseRate = ff.pulseFreq * (1.0 + (ff.fastMultiplier - 1.0) * 0.3);
                const rawSine = Math.sin(now * pulseRate + ff.pulsePhase) * 0.5 + 0.5;
                const naturalPulse = Math.pow(rawSine, 3.8);

                if (ff.flashBoost > 1.0) {
                    ff.flashBoost = Math.max(1.0, ff.flashBoost - delta * 1.5);
                }

                const totalBrightness = (0.25 + naturalPulse * 0.9) * ff.flashBoost;
                ff.currentBrightness = totalBrightness;
                swarmBrightnessSum += totalBrightness;

                const pulseScale = ff.baseScale * (0.85 + naturalPulse * 0.45) * Math.min(ff.flashBoost, 1.8);
                ff.sprite.scale.set(pulseScale, pulseScale, 1);
                ff.sprite.material.opacity = Math.min(1.0, 0.4 + naturalPulse * 0.6);

                sortedByBrightness.push(ff);
            }

            sortedByBrightness.sort((a, b) => b.currentBrightness - a.currentBrightness);

            // Calculate Average Swarm Brightness (calm baseline ~0.55 - 0.70, excited/flashing 1.8 - 2.5)
            const avgSwarmBrightness = swarmBrightnessSum / Math.max(1, fireflies.length);
            const targetHaloIntensity = Math.min(2.4, Math.max(0.35, avgSwarmBrightness * 1.25));
            smoothHaloIntensity += (targetHaloIntensity - smoothHaloIntensity) * Math.min(1.0, delta * 4.8);

            // Dynamically synchronize 3D volumetric optical halo to swarm total light
            haloMat.opacity = Math.min(0.70, 0.20 + smoothHaloIntensity * 0.24);
            const haloBloom = 0.92 + smoothHaloIntensity * 0.15;
            haloSprite.scale.set(3.8 * haloBloom, 4.2 * haloBloom, 1);

            // Dynamically synchronize CSS backdrop glow to swarm total light
            if (glowBackdropEl) {
                const backdropAlpha = Math.min(0.95, 0.35 + smoothHaloIntensity * 0.32);
                const backdropScale = (0.92 + smoothHaloIntensity * 0.15).toFixed(3);
                glowBackdropEl.style.opacity = backdropAlpha.toFixed(3);
                glowBackdropEl.style.transform = `translate(-50%, -50%) scale(${backdropScale})`;
            }

            if (sortedByBrightness.length >= 3) {
                pointLight1.position.copy(sortedByBrightness[0].pos);
                pointLight1.intensity = sortedByBrightness[0].currentBrightness * 1.1;

                pointLight2.position.copy(sortedByBrightness[1].pos);
                pointLight2.intensity = sortedByBrightness[1].currentBrightness * 0.85;

                pointLight3.position.copy(sortedByBrightness[2].pos);
                pointLight3.intensity = sortedByBrightness[2].currentBrightness * 0.7;
            }

            renderer.render(scene, camera);
            animationFrameId = requestAnimationFrame(renderLoop);
        }

        window.addEventListener('resize', updateCameraFraming);

        renderLoop();
    }

    /* ----------------------------------------------------------------------
     * Studio Softbox Environment Map Generator (Smooth 2D Elliptical Falloffs)
     * ---------------------------------------------------------------------- */
    function createStudioEnvironment(renderer) {
        try {
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            pmremGenerator.compileEquirectangularShader();

            const c = document.createElement('canvas');
            c.width = 512;
            c.height = 256;
            const ctx = c.getContext('2d');

            // Dark studio base
            ctx.fillStyle = '#08080c';
            ctx.fillRect(0, 0, 512, 256);

            // Helper to draw a smooth 2D elliptical softbox (zero sharp edges in X or Y)
            function drawSoftbox(cx, cy, rx, ry, maxAlpha, colorRGB) {
                ctx.save();
                ctx.translate(cx, cy);
                ctx.scale(rx, ry);
                const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
                g.addColorStop(0.0, `rgba(${colorRGB}, ${maxAlpha})`);
                g.addColorStop(0.35, `rgba(${colorRGB}, ${maxAlpha * 0.85})`);
                g.addColorStop(0.70, `rgba(${colorRGB}, ${maxAlpha * 0.30})`);
                g.addColorStop(1.0, `rgba(${colorRGB}, 0.0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(0, 0, 1, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Left Key Softbox: Smooth vertical pill at x=110, y=128, rx=48, ry=110
            drawSoftbox(110, 128, 48, 110, 0.92, '255, 255, 255');

            // Right Rim Softbox: Subtle warm vertical pill at x=385, y=128, rx=38, ry=98
            drawSoftbox(385, 128, 38, 98, 0.50, '255, 240, 200');

            // Top Ambient Ceiling Reflection: Smooth dome fade without horizontal cutoffs
            const topGrad = ctx.createLinearGradient(0, 0, 0, 100);
            topGrad.addColorStop(0.0, 'rgba(255, 250, 235, 0.28)');
            topGrad.addColorStop(0.5, 'rgba(255, 250, 235, 0.12)');
            topGrad.addColorStop(1.0, 'rgba(8, 8, 12, 0.0)');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, 512, 100);

            const envTexture = new THREE.CanvasTexture(c);
            const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
            pmremGenerator.dispose();
            envTexture.dispose();
            return envMap;
        } catch (e) {
            console.warn('Could not generate studio environment map:', e);
            return null;
        }
    }

    /* ----------------------------------------------------------------------
     * Procedural Texture Generators
     * ---------------------------------------------------------------------- */
    function createGlowTexture() {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext('2d');

        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0.00, 'rgba(255, 255, 255, 1.0)');
        g.addColorStop(0.12, 'rgba(255, 245, 170, 0.95)');
        g.addColorStop(0.32, 'rgba(255, 205, 50, 0.70)');
        g.addColorStop(0.60, 'rgba(175, 240, 45, 0.28)');
        g.addColorStop(0.82, 'rgba(120, 210, 35, 0.08)');
        g.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);

        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }

    function createCorkTexture() {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#b3824f';
        ctx.fillRect(0, 0, 256, 256);

        for (let i = 0; i < 3500; i++) {
            const x = Math.random() * 256;
            const y = Math.random() * 256;
            const r = Math.random() * 2.2 + 0.4;
            const dark = Math.random() > 0.45;
            ctx.fillStyle = dark ? 'rgba(84, 48, 20, 0.42)' : 'rgba(238, 192, 134, 0.45)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(2, 2);
        tex.needsUpdate = true;
        return tex;
    }

    function createShadowTexture() {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 256;
        const ctx = c.getContext('2d');

        const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 116);
        g.addColorStop(0.00, 'rgba(20, 15, 8, 0.60)');
        g.addColorStop(0.35, 'rgba(35, 25, 12, 0.30)');
        g.addColorStop(0.70, 'rgba(50, 35, 15, 0.08)');
        g.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);

        const tex = new THREE.CanvasTexture(c);
        tex.needsUpdate = true;
        return tex;
    }
})();
