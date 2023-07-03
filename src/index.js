import { b2BodyType, b2PolygonShape, b2Vec2, b2World, DrawShapes } from "@box2d/core";
import { mat4, vec3 } from "gl-matrix";
import { gl, initWebGLContext } from "./webgl-context.js";
import DebugDrawer from "./debug-drawer.js";
import createProgram from "./shader-program.js";
import RayCaster from "./ray-caster.js";

async function init() {

    if (!initWebGLContext("renderCanvas")) return;

    gl.clearColor(0.2, 0.2, 0.2, 1);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const projMatrix = mat4.create();
    mat4.ortho(projMatrix, 0, 300, 300, 0, 1, -1);
    const viewMatrix = mat4.create();
    mat4.lookAt(viewMatrix, [0, 0, 1], [0, 0, 0], [0, 1, 0]);
    const projViewMatrix = mat4.create();
    mat4.mul(projViewMatrix, projMatrix, viewMatrix);

    const program = await createProgram("assets/shaders/",
        "default.vert", "default.frag");

    const uMvpMatrixLocation = gl.getUniformLocation(program, "uMvpMatrix");
    const uColorLocation = gl.getUniformLocation(program, "uColor");

    const vertPositions = [
        -0.5, -0.5,
        0.5, -0.5,
        -0.5, 0.5,
        0.5, 0.5
    ];
    const vertPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPositions),
        gl.STATIC_DRAW);

    const aPositionLocation = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(aPositionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPositionLocation);

    const world = b2World.Create({ x: 0, y: 9.8 });
    const pixelsPerMeter = 30;
    const debugDrawer = new DebugDrawer(program, pixelsPerMeter);
    debugDrawer.projViewMatrix = projViewMatrix;

    // Box
    const boxShape = new b2PolygonShape();
    boxShape.SetAsBox(20 / pixelsPerMeter, 20 / pixelsPerMeter);
    const boxBody = world.CreateBody({
        type: b2BodyType.b2_dynamicBody,
        position: { x: 100 / pixelsPerMeter, y: 30 / pixelsPerMeter },
        angle: 0
    });
    const boxFixture = boxBody.CreateFixture({ shape: boxShape, density: 1 });
    boxBody.SetFixedRotation(true);

    // Ground
    const groundShape = new b2PolygonShape();
    groundShape.SetAsBox(130 / pixelsPerMeter, 20 / pixelsPerMeter);
    const groundBody = world.CreateBody({
        type: b2BodyType.b2_staticBody,
        position: { x: 150 / pixelsPerMeter, y: 270 / pixelsPerMeter }
    });
    groundBody.CreateFixture({ shape: groundShape });

    // Platform
    const platformShape = new b2PolygonShape();
    platformShape.SetAsBox(20 / pixelsPerMeter, 20 / pixelsPerMeter);
    const platformBody = world.CreateBody({
        type: b2BodyType.b2_staticBody,
        position: { x: 150 / pixelsPerMeter, y: 170 / pixelsPerMeter }
    });
    platformBody.CreateFixture({ shape: platformShape });

    const rayCaster = new RayCaster(program);
    rayCaster.projViewMatrix = projViewMatrix;

    let currentTime, lastTime, dt;

    function render() {
        requestAnimationFrame(render);

        currentTime = Date.now();
        dt = (currentTime - lastTime) / 1000;
        lastTime = currentTime;

        world.Step(dt, { velocityIterations: 3, positionIterations: 2 });
        DrawShapes(debugDrawer, world);

        rayCaster.drawLine([150, 170], [100, 170], [1, 0, 0]);

        const point1 = new b2Vec2(150 / pixelsPerMeter, 170 / pixelsPerMeter);
        const point2 = new b2Vec2(100 / pixelsPerMeter, 170 / pixelsPerMeter);

        const input = {
            p1: point1,
            p2: point2,
            maxFraction: 1
        };

        const output = {
            normal: new b2Vec2(0, 0),
            fraction: 1
        };

        const ok = boxFixture.RayCast(output, input);
        if (ok) {
            console.log("ok");
        }


    }

    lastTime = Date.now();
    render();
}

init();
