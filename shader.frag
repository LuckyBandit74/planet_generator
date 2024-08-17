#version 330

#define PI 3.14159
#define RADIUS 2.0
#define SEED 7
#define SPEED 0.4
#define CLOUD_SIZE 1.3
#define SPARSITY 1.7
#define PIXELS 100

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

float rand2(vec2 coord) {
    coord = mod(coord, vec2(1.0,1.0)*round(RADIUS));
	return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 15.5453 * SEED);
}

float rand(vec3 coord) {
    coord = mod(coord, vec3(1.0, 1.0, 1.0)*round(RADIUS));
    return fract(sin(dot(coord, vec3(12.9898, 78.233, 54.53))) * 15.5453 * SEED);
}

float pnoise(vec2 coord){
	vec2 i = floor(coord);
	vec2 f = fract(coord);
	
	float a = rand2(i);
	float b = rand2(i + vec2(1.0, 0.0));
	float c = rand2(i + vec2(0.0, 1.0));
	float d = rand2(i + vec2(1.0, 1.0));

	vec2 cubic = f * f * (3.0 - 2.0 * f);

	return mix(a, b, cubic.x) + (c - a) * cubic.y * (1.0 - cubic.x) + (d - b) * cubic.x * cubic.y;
}

float fbm(vec3 uv) {
    float total = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float persistence = 0.5; // Controls how much each octave contributes
    int octaves = 4; // Number of layers of noise

    for (int i = 0; i < octaves; i++) {
        total += noise(uv*frequency)*amplitude;
        frequency *= 2.0;
        amplitude *= persistence;
    }

    return total;
}


float circleNoise(vec2 uv) {
    float uv_y = floor(uv.y);
    uv.x += uv_y*.31;
    vec2 f = fract(uv);
	float h = rand2(vec2(floor(uv.x),floor(uv_y)));
    float m = (length(f-0.25-(h*0.5)));
    float r = h*0.25;
    return smoothstep(0.0, r, m*0.75);
}

float cloudNoise(vec3 uv) {
	float total = 0.0;
	
	// more iterations for more turbulence
	for (int i = 0; i < 9; i++) {
		total += circleNoise(((uv*RADIUS*0.3) + (float(i+1)+10.0)).xy + vec2(fragTime*SPEED/10, 1.0));
	}

	float fbm = fbm(uv*RADIUS + total + vec3(fragTime*SPEED/10, 0.0, 0.0));
	
	return fbm;
}

float flowNoise(vec3 uv, float time) {
    vec3 flowDirection = vec3(1.0, 1.0, 0.0); // Direction of the flow
    float frequency = 0.3;
    float speed = 1.0;
    
    // Shift the coordinates based on time and flow direction
    vec3 flowUV = uv + flowDirection*time*speed;
    
    return cloudNoise(flowUV*frequency);
}

void main() {

    float specularPower = 16.0;
    vec4 specularColor = light.color;

    vec4 texelColor = texture(texture0, fragTexCoord);

    vec3 N = normalize(fragNormal)*1/CLOUD_SIZE;
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

    //if(N.z < 0.0) N *= -1;

    N = floor(N*PIXELS)/PIXELS;

    float c = cloudNoise(N*vec3(1.0, 2.0, 1.0));

    color = vec4(vec3(1.0), step(SPARSITY/10, c)*0.74999);
}
