import * as THREE from "three";

// These definition make it possible to try different versions THREE in the package deps
const PlaneGeometry = ("PlaneBufferGeometry" in THREE) ?
    THREE.PlaneBufferGeometry : THREE.PlaneGeometry;

const SphereGeometry = ("SphereBufferGeometry" in THREE) ?
    THREE.SphereBufferGeometry : THREE.SphereGeometry;

export default function setupVideoLayerManager (
    video,
    videoWidth = 2064,
    videoHeight = 2208,
    videoReducer = 0.090579710,
    videoCenterX = 0.0,
    videoCenterY = 0.0,
    videoDepthZ = -2.5,
    meshWidth = 5
) {

    const meshHeight = videoHeight / videoWidth * meshWidth;

    let webGLVideo = new THREE.Group();
    let webXRLayerVideo = null;

    // Detect Wolvic browser
    const isWolvic = /Wolvic/i.test(navigator.userAgent);

    const texture = new THREE.Texture(video);

    // Starting with Three.js r152, a "linear workflow" was enabled by default,
    // where sRGB input colors are converted to linear color space for rendering,
    // then converted back to sRGB for display. Updates to Color Management in
    // three.js r152 - [Discussion - three.js forum](https://discourse.threejs.org/t/updates-to-color-management-in-three-js-r152/50791)

    // Wolvic (based on Chromium/Firefox Reality) may handle WebGL color spaces
    // differently than Meta's Quest browser, leading to this double-conversion
    // issue where the video gets gamma-corrected twice.
    if (isWolvic) {
        // Wolvic applies extra gamma, so we need to pre-compensate
        // by providing "under-corrected" input
        texture.colorSpace = THREE.LinearSRGBColorSpace;
        // ... sort of works, but color space is still visibly "washed out".
    } else {
        // Quest browser and others handle sRGB correctly
        texture.colorSpace = THREE.SRGBColorSpace;
    }

    let textureUpdateInterval = 0;

    let initialized = false;

    function initVideoLayer (withWebXRLayer = false, renderer = null, scene = null, session = null, refSpace = null) {

        if (!withWebXRLayer || session === null) {

            if (textureUpdateInterval < 1) {
                textureUpdateInterval = setInterval(function () {
                    if (video.readyState >= video.HAVE_CURRENT_DATA) {
                        texture.needsUpdate = true;
                    }
                }, 1000 / 24);
            }

            // left

            // const geometry1 = new SphereGeometry( 500, 60, 40 );
            const geometry1 = new PlaneGeometry(meshWidth, meshHeight, 1, 1);
            // invert the geometry on the x-axis so that all of the faces point inward
            // geometry1.scale( - 1, 1, 1 );
            geometry1.translate(videoCenterX + videoReducer, videoCenterY + meshHeight / 2 + videoCenterY - 5, videoDepthZ);

            const uvs1 = geometry1.attributes.uv.array;

            for (let i = 0; i < uvs1.length; i += 2) {

                uvs1[i] *= 0.5;

            }

            const material1 = new THREE.MeshBasicMaterial({map: texture});

            const mesh1 = new THREE.Mesh(geometry1, material1);

            mesh1.layers.set(1); // display in left eye only
            webGLVideo.add(mesh1);

            // right

            // const geometry2 = new SphereGeometry( 500, 60, 40 );
            const geometry2 = new PlaneGeometry(meshWidth, meshHeight, 1, 1);
            // geometry2.scale( - 1, 1, 1 );
            geometry2.translate(videoCenterX - videoReducer, videoCenterY + meshHeight / 2 + videoCenterY - 5, videoDepthZ)

            const uvs2 = geometry2.attributes.uv.array;

            for (let i = 0; i < uvs2.length; i += 2) {

                uvs2[i] *= 0.5;

                // Render stereo image ("3D")
                uvs2[i] += 0.5;

            }

            const material2 = new THREE.MeshBasicMaterial({map: texture});

            const mesh2 = new THREE.Mesh(geometry2, material2);

            mesh2.layers.set(2); // display in right eye only
            webGLVideo.add(mesh2);

            console.log("Add video layer using WebGL plane geometry");

            scene.add(webGLVideo);

            initialized = true;

            return webGLVideo;

        } else if (refSpace !== null) {

            const xr = renderer.xr;
            const gl = renderer.getContext();

            let videoAngle = 96; // 110;
            let videoLayout = "stereo-left-right";
            let eqrtRadius = 10;
            const videoWidth = 2064;
            const videoHeight = 2208;
            const videoReducer = 0.00090579710;

            // Create background EQR video layer.
            const mediaBinding = new XRMediaBinding(session);

            console.log("Create XRQuadLayer with XRMediaBinding");

            webXRLayerVideo = mediaBinding.createQuadLayer(
                video,
                {
                    layout: 'stereo-left-right',
                    width: videoWidth * videoReducer,
                    height: videoHeight * videoReducer,
                    space: refSpace,
                    transform: new XRRigidTransform(
                        {x: 0, y: (videoHeight * videoReducer) / 2 + videoCenterY, z: videoDepthZ},
                        {},
                        {}
                    )
                }
            );

            //  console.log("Create XREquirectLayer with XRMediaBinding");

            //  webXRLayerVideo = mediaBinding.createEquirectLayer(
            //      video,
            //      {
            //         // layout: 'stereo-left-right',
            //         layout: videoLayout,
            //         viewPixelWidth: videoWidth / (videoLayout === "stereo-left-right" ? 2 : 1),
            //         viewPixelHeight: videoHeight / (videoLayout === "stereo-top-bottom" ? 2 : 1),
            //         space: refSpace,
            //         // // Rotate by 45 deg to avoid stereo conflict with the 3D geometry.
            //         // transform: new XRRigidTransform(
            //         //   {},
            //         //   { x: 0, y: .28, z: 0, w: .96 }
            //         // )
            //         transform: new XRRigidTransform(
            //             {x: 0, y: -5, z: -10},
            //             // { x: -0.28, y: 0, z: 0, w: .96 }
            //         )
            //      }
            //  );
            //
            // webXRLayerVideo.centralHorizontalAngle = Math.PI * videoAngle / 180;
            // webXRLayerVideo.upperVerticalAngle = (Math.PI * videoAngle / 180) * 0.5; // Math.PI / 2.0 * 0.5;
            // webXRLayerVideo.lowerVerticalAngle = -(Math.PI * videoAngle / 180) * 0.5; // -Math.PI / 2.0 * 0.5;
            // webXRLayerVideo.radius = eqrtRadius;

            initialized = true;

            return webXRLayerVideo;
        }
    }

    function clearVideoLayer (withWebXRLayer = false, renderer = null, scene = null) {

        initialized = false;

        if (!withWebXRLayer) {

            console.log("Remove video layer from WebGL plane geometry");
            scene.remove(webGLVideo);
        }

        if (textureUpdateInterval > 0) {
            clearInterval(textureUpdateInterval);
        }

        textureUpdateInterval = 0;
    }

    return (
        Object.defineProperty(
            Object.defineProperty(
                {
                    initVideoLayer,
                    clearVideoLayer,
                    webGLVideo,
                    webXRLayerVideo
                },
                'videoLayerInitialized',
                {
                    get() {
                        return initialized;
                    },
                    set(new_state) {
                        initialized = new_state;
                    }
                }
            ),
            'video',
            {
                get() {
                    return video;
                },
                set(new_video) {
                    video = new_video;
                }
            }
        )
    );
}
