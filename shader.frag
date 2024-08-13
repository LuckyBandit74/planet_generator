#version 330

#define PI 3.14159

in vec3 fragPosition;
in vec2 fragTexCoord;
in vec3 fragNormal;
in mat4 fragRotationMatrix;
in float fragTime;

out vec4 color;

struct Light {
    vec3 position;
    vec3 target;
    vec4 color;
};

uniform sampler2D texture0;

uniform Light light;
uniform vec4 ambience;
uniform vec3 cameraPosition;

vec3 fade(vec3 t) {
    return t*t*t*(t*(t*6.0 - 15.0) + 10.0);
}

float grad(int hash, vec3 p) {
    int h = hash & 15;
    float u = h < 8 ? p.x : p.y;
    float v = h < 4 ? p.y : (h == 12 || h == 14 ? p.x : p.z);
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
}

float noise(vec3 uv) {
    vec3 i = floor(uv);
    vec3 f = fade(fract(uv));

    int n = int(i.x) + int(i.y)*57 + int(i.z)*131;
    int nn = (n) % 256;
    int np = (n + 1) % 256;
    int pn = (n + 57) % 256;
    int pp = (n + 58) % 256;

    float value = mix(
        mix(
            mix(grad(nn, f), grad(np, f - vec3(1.0, 0.0, 0.0)), f.x),
            mix(grad(pn, f - vec3(0.0, 1.0, 0.0)), grad(pp, f - vec3(1.0, 1.0, 0.0)), f.x),
            f.y
        ),
        mix(
            mix(grad(nn + 131, f - vec3(0.0, 0.0, 1.0)), grad(np + 131, f - vec3(1.0, 0.0, 1.0)), f.x),
            mix(grad(pn + 131, f - vec3(0.0, 1.0, 1.0)), grad(pp + 131, f - vec3(1.0, 1.0, 1.0)), f.x),
            f.y
        ),
        f.z
    );

    return value;
}

float fbm(vec3 uv) {
    float total = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    float persistence = 0.5; // Controls how much each octave contributes
    int octaves = 3; // Number of layers of noise

    for (int i = 0; i < octaves; i++) {
        total += noise(uv*frequency)*amplitude;
        frequency *= 2.0;
        amplitude *= persistence;
    }

    return total;
}

void main() {

    float specularPower = 16.0;
    vec4 specularColor = light.color;

    vec4 texelColor = texture(texture0, fragTexCoord);

    vec3 N = normalize(fragNormal);
    vec3 C = normalize(cameraPosition - fragPosition);

    //directional lighting
    vec3 L = -normalize(light.target - light.position);
    //vec3 L = normalize(light.position - fragPosition);
    vec3 R = normalize(reflect(-L, N));

    float NdotL = dot(N, L);
    
    vec4 phong = ambience;
    if(NdotL > 0.0) {
        vec4 specular = specularColor*pow(max(0.0, dot(C, R)), specularPower);
        vec4 diffuse = NdotL*light.color;
        phong += diffuse + specular;
    }

    color = texelColor*phong;
    //color = pow(color, vec4(1.0/2.2));

    float n = fbm(N*1.0 + fragTime/5);


    color = vec4(vec3((n + 1)*0.5), n < 0 ? 0 : 1);
}
