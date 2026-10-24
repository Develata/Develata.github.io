// renderer/shaders/terrain.ts

export const terrainVertexShader = `
  // 对应 FieldSystem 中的 Singularity 结构
  struct Singularity {
    vec2 position;
    float strength;
    float radius;
  };

  // 最大支持 20 个动态影响点 (根据性能调整)
  uniform Singularity uSingularities[20];
  uniform int uSingularityCount;

  // 传递给 Fragment Shader 的高度数据
  varying float vHeight;

  void main() {
    // 获取 Instance 的世界坐标 (InstancedMesh)
    // instanceMatrix 包含平移/旋转/缩放
    vec4 worldPosition = instanceMatrix * vec4(position, 1.0);

    float totalDisplacement = 0.0;

    // 在 Shader 中复现高斯叠加逻辑
    for (int i = 0; i < 20; i++) {
      if (i >= uSingularityCount) break;

      Singularity s = uSingularities[i];
      
      float distSq = pow(worldPosition.x - s.position.x, 2.0) + pow(worldPosition.z - s.position.y, 2.0);
      
      // Gaussian: A * exp(-dist^2 / (2*sigma^2))
      float influence = s.strength * exp(-distSq / (2.0 * s.radius * s.radius));
      
      totalDisplacement += influence;
    }

    // 应用位移到 Y 轴
    worldPosition.y += totalDisplacement;
    vHeight = worldPosition.y;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const terrainFragmentShader = `
  varying float vHeight;

  void main() {
    vec3 color;

    // 颜色映射逻辑
    // 高度 > 0.5 (墙/障碍) -> 红色/橙色
    // 高度 < -0.5 (坑/敌人) -> 蓝色/紫色
    // 接近 0 (平地) -> 深灰色网格色

    if (vHeight > 0.2) {
      // 隆起：红色渐变
      float t = smoothstep(0.2, 3.0, vHeight);
      color = mix(vec3(0.2, 0.2, 0.25), vec3(1.0, 0.2, 0.2), t);
    } else if (vHeight < -0.2) {
      // 凹陷：蓝色/霓虹紫渐变
      float t = smoothstep(-0.2, -5.0, vHeight); // 注意深度也是正向增长的幅度
      color = mix(vec3(0.2, 0.2, 0.25), vec3(0.0, 0.8, 1.0), t);
    } else {
      // 平地：基础深灰
      color = vec3(0.15, 0.15, 0.18);
    }

    // 添加简单的网格线效果 (基于屏幕空间的简单模拟，或者以后用 texture)
    // 这里为了纯色块风格，暂时只输出颜色
    
    gl_FragColor = vec4(color, 1.0);
  }
`;