#version 330

in vec3 fragPosition;
in vec2 fragTexCoord;
in vec3 fragNormal;

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

void main() {

    float specularPower = 16.0;
    vec4 specularColor = light.color;

    vec4 texelColor = texture(texture0, fragTexCoord);

    vec3 N = normalize(fragNormal);
    vec3 C = normalize(cameraPosition - fragPosition);

    //directional lighting
    //vec3 L = -normalize(light.target - light.position);
    vec3 L = normalize(light.position - fragPosition);
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
}
