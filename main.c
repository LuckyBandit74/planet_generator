#include <raylib.h>
#include <rlgl.h>
#include <raymath.h>
#include <stdlib.h>
#include <stdio.h>

int main() {

    const int screenWidth = 800;
    const int screenHeight = 450;

    InitWindow(screenWidth, screenHeight, "Planet Generator");
    SetTargetFPS(60);

    Camera camera = {0};
    camera.position = (Vector3){0.0f, 0.0f, -20.0f};
    camera.target = (Vector3){0.0f, 0.0f, 0.0f};
    camera.up = (Vector3){0.0f, 1.0f, 0.0f};
    camera.fovy = 45.0f;
    camera.projection = CAMERA_PERSPECTIVE;
    /* camera.projection = CAMERA_ORTHOGRAPHIC; */

    float sensitivity = 0.01f;
    Quaternion rotation = QuaternionIdentity();
    Quaternion globalr = QuaternionIdentity();
    Vector2 mouse = Vector2Zero();

    float pitch = 0;
    float yaw = 0;

    while(!WindowShouldClose()) {
        Quaternion pitchr = QuaternionIdentity();
        Quaternion yawr = QuaternionIdentity();

        if(IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
            Vector2 delta = GetMouseDelta();

            pitch -= delta.y*sensitivity;
            yaw += delta.x*sensitivity;

            pitchr = QuaternionFromAxisAngle((Vector3){1.0f, 0.0f, 0.0f}, pitch);
            yawr = QuaternionFromAxisAngle((Vector3){0.0f, 1.0f, 0.0f}, yaw);


            /* rotation = QuaternionMultiply(QuaternionMultiply(rotation, yawr), pitchr); */
            rotation = QuaternionMultiply(QuaternionMultiply(QuaternionIdentity(), pitchr), yawr);
        }

        BeginDrawing();
            ClearBackground(BLACK);
            BeginMode3D(camera);

                rlPushMatrix();
                rlMultMatrixf(MatrixToFloatV(QuaternionToMatrix(rotation)).v);

                /* DrawCubeWiresV((Vector3){0, 0, 0}, (Vector3){10, 10, 10}, WHITE); */

                DrawSphereWires((Vector3){0.0f, 0.0f, 0.0f}, 2.0f, 16, 16, WHITE);
                rlPopMatrix();

            EndMode3D();
        EndDrawing();

        DrawFPS(10, 10);
    }

    CloseWindow(); 

    return 0;
}
