import { Application } from 'playcanvas/build/playcanvas/src/framework/application.js';
import { CameraComponent } from 'playcanvas/build/playcanvas/src/framework/components/camera/component.js';
import { RenderComponent } from 'playcanvas/build/playcanvas/src/framework/components/render/component.js';
import { Entity } from 'playcanvas/build/playcanvas/src/framework/entity.js';
import { Color } from 'playcanvas/build/playcanvas/src/core/math/color.js';
import { Mat4 } from 'playcanvas/build/playcanvas/src/core/math/mat4.js';
import { Quat } from 'playcanvas/build/playcanvas/src/core/math/quat.js';
import { Vec3 } from 'playcanvas/build/playcanvas/src/core/math/vec3.js';
import { Ray } from 'playcanvas/build/playcanvas/src/core/shape/ray.js';
import { FILLMODE_NONE, RESOLUTION_AUTO } from 'playcanvas/build/playcanvas/src/framework/constants.js';
import { createGraphicsDevice } from 'playcanvas/build/playcanvas/src/platform/graphics/graphics-device-create.js';
import { GraphicsDevice } from 'playcanvas/build/playcanvas/src/platform/graphics/graphics-device.js';
import { Mesh } from 'playcanvas/build/playcanvas/src/scene/mesh.js';
import { MeshInstance } from 'playcanvas/build/playcanvas/src/scene/mesh-instance.js';
import { SphereGeometry } from 'playcanvas/build/playcanvas/src/scene/geometry/sphere-geometry.js';
import { StandardMaterial } from 'playcanvas/build/playcanvas/src/scene/materials/standard-material.js';

export const playCanvasContinuumSurface = Object.freeze({
  Application,
  CameraComponent,
  Color,
  Entity,
  FILLMODE_NONE,
  GraphicsDevice,
  Mat4,
  Mesh,
  MeshInstance,
  Quat,
  Ray,
  RenderComponent,
  RESOLUTION_AUTO,
  StandardMaterial,
  Vec3,
  createGraphicsDevice,
  SphereGeometry
});
