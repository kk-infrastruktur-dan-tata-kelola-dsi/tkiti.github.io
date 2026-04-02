"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/app/components/ui/utils";

const vsSource = `attribute vec4 aVertexPosition; void main() { gl_Position = aVertexPosition; }`;
const fsSource = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iTime;
  const float gridSmoothWidth = 0.015;
  const float scale = 5.0;

  const vec4 lineColor = vec4(0.24, 0.81, 0.70, 1.0);

  const float minLineWidth = 0.01;
  const float maxLineWidth = 0.2;
  const int linesPerGroup = 16;

  float random(float t) { return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0; }
  float drawSmoothLine(float pos, float halfWidth, float t) { return smoothstep(halfWidth, 0.0, abs(pos - t)); }
  float drawCrispLine(float pos, float halfWidth, float t) { return smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - t)); }

  void main() {
    vec2 uv = gl_FragCoord.xy / iResolution.xy;
    vec2 space = (gl_FragCoord.xy - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;
    float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
    float verticalFade = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

    vec4 bgColor = vec4(0.027, 0.031, 0.035, 1.0);
    vec4 lines = vec4(0.0);

    for(int l = 0; l < linesPerGroup; l++) {
      float offsetTime = iTime * 0.26;
      float offsetPosition = float(l) + space.x * 0.5;
      float rand = random(offsetPosition + offsetTime) * 0.5 + 0.5;
      float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) / 2.0;
      float linePosition = random(space.x * 0.2 + iTime * 0.2) * horizontalFade + (random(offsetPosition + offsetTime) * 2.0);
      lines += (drawSmoothLine(linePosition, halfWidth, space.y) / 2.0 + drawCrispLine(linePosition, halfWidth * 0.15, space.y)) * lineColor * rand;
    }

    gl_FragColor = (bgColor * verticalFade) + lines;
  }
`;

const ShaderBackground = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const createShader = (type: number, src: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vertexShader = createShader(gl.VERTEX_SHADER, vsSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "aVertexPosition");
    const resolutionLocation = gl.getUniformLocation(program, "iResolution");
    const timeLocation = gl.getUniformLocation(program, "iTime");

    let animationFrame = 0;
    const render = (time: number) => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      gl.uniform1f(timeLocation, time * 0.001);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
    };
  }, []);

  return <canvas ref={canvasRef} className={cn("pointer-events-none absolute inset-0 h-full w-full z-0", className)} />;
};

export default ShaderBackground;
