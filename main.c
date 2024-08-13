#include <raylib.h>
#include <rlgl.h>
#include <raymath.h>
#include <stdlib.h>
#include <stdio.h>

typedef struct {   
    Vector3 position;
    Vector3 target;
    Color color;
    
    // Shader locations
    int positionLoc;
    int targetLoc;
    int colorLoc;
} Light;

void update_light(Shader shader, Light light) {
    SetShaderValue(shader, light.positionLoc, (float[3]){light.position.x, light.position.y, light.position.z}, SHADER_UNIFORM_VEC3);
    SetShaderValue(shader, light.targetLoc, (float[3]){light.target.x, light.target.y, light.target.z}, SHADER_UNIFORM_VEC3);
    SetShaderValue(shader, light.colorLoc, (float[4]){light.color.r/255.0f, light.color.g/255.0f, light.color.b/255.0f, light.color.a/255.0f}, SHADER_UNIFORM_VEC4);
}

int main() {

    const int screenWidth = 800;
    const int screenHeight = 450;

    InitWindow(screenWidth, screenHeight, "Planet Generator");
    SetTargetFPS(60);

    Camera camera = {0};
    camera.position = (Vector3){0.0f, 0.0f, -10.0f};
    camera.target = (Vector3){0.0f, 0.0f, 0.0f};
    camera.up = (Vector3){0.0f, 1.0f, 0.0f};
    camera.fovy = 45.0f;
    camera.projection = CAMERA_PERSPECTIVE;
    /* camera.projection = CAMERA_ORTHOGRAPHIC; */

    float sensitivity = 0.01f;
    Quaternion rotation = QuaternionIdentity();
    Vector2 mouse = Vector2Zero();

    Shader shader = LoadShader("shader.vert", "shader.frag");
    SetShaderValue(shader, GetShaderLocation(shader, "ambience"), (float[4]){0.1f, 0.1f, 0.1f, 1.0f}, SHADER_UNIFORM_VEC4);
    shader.locs[SHADER_LOC_VECTOR_VIEW] = GetShaderLocation(shader, "cameraPosition");
    SetShaderValue(shader, shader.locs[SHADER_LOC_VECTOR_VIEW], (float[3]){camera.position.x, camera.position.y, camera.position.z}, SHADER_UNIFORM_VEC3);

    Light light = {0};
    light.position = (Vector3){-10.0f, 0.0f, 0.0f};
    light.target = (Vector3){0.0f, 0.0f, 0.0f};
    light.color = GRAY;

    light.positionLoc = GetShaderLocation(shader, "light.position");
    light.targetLoc = GetShaderLocation(shader, "light.target");
    light.colorLoc = GetShaderLocation(shader, "light.color");
    update_light(shader, light);

    Model planet = LoadModelFromMesh(GenMeshSphere(1.8f, 32, 32));
    Model sphere = LoadModelFromMesh(GenMeshSphere(2.0f, 32, 32));
    /* planet.materials[0].shader = shader; */
    sphere.materials[0].shader = shader;

    float angle = 0;
    float time = 0;

    while(!WindowShouldClose()) {
        time = GetTime();

        Quaternion pitchr = QuaternionIdentity();
        Quaternion yawr = QuaternionIdentity();

        if(1 || IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
            Vector2 delta = GetMouseDelta();

            pitchr = QuaternionFromAxisAngle((Vector3){1.0f, 0.0f, 0.0f}, -delta.y*sensitivity);
            yawr = QuaternionFromAxisAngle((Vector3){0.0f, 1.0f, 0.0f}, delta.x*sensitivity);

            rotation = QuaternionMultiply(QuaternionMultiply(yawr, pitchr), rotation);
        }

        angle += 0.05;
        if(angle >= 2*PI) angle = -2*PI;

        light.position = (Vector3){
            5.0f*cos(angle),
            0, 
            5.0f*sin(angle)
        };

        Quaternion dq = QuaternionFromAxisAngle((Vector3){0.0f, 1.0f, 0.0f}, Lerp(0, 2*PI, time/10));
        SetShaderValue(shader, GetShaderLocation(shader, "time"), &time, SHADER_UNIFORM_FLOAT);
        /* SetShaderValueMatrix(shader, GetShaderLocation(shader, "timeRotation"), QuaternionToMatrix(dq)); */
        SetShaderValueMatrix(shader, GetShaderLocation(shader, "rotationMatrix"), QuaternionToMatrix(rotation));
        update_light(shader, light);

        BeginDrawing();
            ClearBackground(BLACK);
            BeginMode3D(camera);

                rlPushMatrix();
                rlMultMatrixf(MatrixToFloatV(QuaternionToMatrix(rotation)).v);

                DrawModel(planet, Vector3Zero(), 1.0f, BLUE);
                DrawModel(sphere, Vector3Zero(), 1.0f, WHITE);
                /* DrawCubeWiresV((Vector3){0, 0, 0}, (Vector3){10, 10, 10}, WHITE); */

                /* DrawSphereWires((Vector3){0.0f, 0.0f, 0.0f}, 2.0f, 16, 16, WHITE); */
                rlPopMatrix();

            EndMode3D();
        EndDrawing();

        DrawFPS(10, 10);
    }

    UnloadModel(sphere);
    UnloadShader(shader);
    CloseWindow(); 

    return 0;
}
