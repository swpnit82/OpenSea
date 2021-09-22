import { Chain } from '../components/Chain'
import Pose, { PoseBoneTransform } from '../classes/Pose'
import { Quaternion, Vector3 } from 'three'
import { Axis } from '../classes/Axis'
import { lawCosinesSSS } from './IKFunctions'

///////////////////////////////////////////////////////////////////
// Multi Bone Solvers
///////////////////////////////////////////////////////////////////

export type IKSolverFunction = (
  chain: Chain,
  tpose: Pose,
  pose: Pose,
  axis: Axis,
  cLen: number,
  p_wt: PoseBoneTransform
) => void

/**
 *
 * @param chain
 * @param tpose
 * @param pose
 * @param axis IKPose.target.axis
 * @param cLen IKPose.target.len
 * @param p_wt parent world transform
 */
export function solveLimb(chain: Chain, tpose: Pose, pose: Pose, axis: Axis, cLen: number, p_wt: PoseBoneTransform) {
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Using law of cos SSS, so need the length of all sides of the triangle
  let bind_a = tpose.bones[chain.chainBones[0].index], // Bone Reference from Bind
    bind_b = tpose.bones[chain.chainBones[1].index],
    pose_a = pose.bones[chain.chainBones[0].index], // Bone Reference from Pose
    pose_b = pose.bones[chain.chainBones[1].index],
    aLen = bind_a.length,
    bLen = bind_b.length,
    // cLen = this.len,
    rot = new Quaternion(),
    rad: number

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // FIRST BONE - Aim then rotate by the angle.
  _aim_bone2(chain, tpose, axis, p_wt, rot) // Aim the first bone toward the target oriented with the bend direction.

  const rotAfterAim = rot.clone()
  const acbLen = { aLen, cLen, bLen }

  rad = lawCosinesSSS(aLen, cLen, bLen) // Get the Angle between First Bone and Target.

  const firstRad = rad

  // ORIGINAL CODE
  // rot
  //   .pmul_axis_angle(this.axis.x, -rad)
  //   .pmul_invert(p_wt.rot)
  rot
    .premultiply(new Quaternion().setFromAxisAngle(axis.x, -rad)) // Use the Target's X axis for rotation along with the angle from SSS
    .premultiply(p_wt.quaternion.clone().invert()) // Convert to Bone's Local Space by mul invert of parent bone rotation

  pose.setBone(bind_a.idx, rot) // Save result to bone.
  // Update World Data for future use
  /* ORIGINAL
  			pose_a.world											// Update World Data for future use
				.copy( p_wt )
				.add( rot, bind_a.local.pos, bind_a.local.scl );
   */
  pose_a.world.position.copy(p_wt.position)
  pose_a.world.quaternion.copy(p_wt.quaternion)
  pose_a.world.scale.copy(p_wt.scale)
  transformAdd(
    // transform
    pose_a.world,
    // add
    {
      quaternion: rot,
      position: bind_a.local.position,
      scale: bind_a.local.scale
    }
  )

  //   .copy(p_wt)
  //   .add(rot, bind_a.local.pos, bind_a.local.scl)

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // SECOND BONE
  // Need to rotate from Right to Left, So take the angle and subtract it from 180 to rotate from
  // the other direction. Ex. L->R 70 degrees == R->L 110 degrees
  rad = Math.PI - lawCosinesSSS(aLen, bLen, cLen)

  rot
    .copy(pose_a.world.quaternion)
    .multiply(bind_b.local.quaternion) // Add Bone 2's Local Bind Rotation to Bone 1's new World Rotation.
    .premultiply(new Quaternion().setFromAxisAngle(axis.x, rad)) // Rotate it by the target's x-axis
    .premultiply(pose_a.world.quaternion.clone().invert()) // Convert to Bone's Local Space

  pose.setBone(bind_b.idx, rot) // Save result to bone.

  // Update World Data for future use
  //  ORIGINAL
  //   pose_b.world
  //     .copy(pose_a.world)
  pose_b.world.position.copy(pose_a.world.position)
  pose_b.world.quaternion.copy(pose_a.world.quaternion)
  pose_b.world.scale.copy(pose_a.world.scale)
  // pose_b.world.add(rot, bind_b.local.pos, bind_b.local.scl)
  transformAdd(
    // transform
    pose_b.world,
    // add
    {
      quaternion: rot,
      position: bind_b.local.position,
      scale: bind_b.local.scale
    }
  )

  return {
    rotAfterAim,
    acbLen,
    firstRad
  }
}

export function solveThreeBone(
  chain: Chain,
  tpose: Pose,
  pose: Pose,
  axis: Axis,
  cLen: number,
  p_wt: PoseBoneTransform
) {
  //------------------------------------
  // Get the length of the bones, the calculate the ratio length for the bones based on the chain length
  // The 3 bones when placed in a zig-zag pattern creates a Parallelogram shape. We can break the shape down into two triangles
  // By using the ratio of the Target length divided between the 2 triangles, then using the first bone + half of the second bound
  // to solve for the top 2 joints, then uing the half of the second bone + 3rd bone to solve for the bottom joint.
  // If all bones are equal length,  then we only need to use half of the target length and only test one triangle and use that for
  // both triangles, but if bones are uneven, then we need to solve an angle for each triangle which this function does.

  //------------------------------------
  let bind_a = tpose.bones[chain.chainBones[0].index], // Bone Reference from Bind
    bind_b = tpose.bones[chain.chainBones[1].index],
    bind_c = tpose.bones[chain.chainBones[2].index],
    pose_a = pose.bones[chain.chainBones[0].index], // Bone Reference from Pose
    pose_b = pose.bones[chain.chainBones[1].index],
    pose_c = pose.bones[chain.chainBones[2].index],
    a_len = bind_a.length, // First Bone length
    b_len = bind_b.length, // Second Bone Length
    c_len = bind_c.length, // Third Bone Length
    bh_len = bind_b.length * 0.5, // How Much of Bone 2 to use with Bone 1
    t_ratio = (a_len + bh_len) / (a_len + b_len + c_len), // How much to subdivide the Target length between the two triangles
    ta_len = cLen * t_ratio, // Goes with A & B
    tb_len = cLen - ta_len, // Goes with B & C
    rot = new Quaternion(),
    rad

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Bone A
  _aim_bone2(chain, tpose, axis, p_wt, rot) // Aim the first bone toward the target oriented with the bend direction.

  rad = lawCosinesSSS(a_len, ta_len, bh_len) // Get the Angle between First Bone and Target.
  rot
    .premultiply(new Quaternion().setFromAxisAngle(axis.x, -rad)) // Rotate the the aimed bone by the angle from SSS
    .premultiply(p_wt.quaternion.clone().invert()) // Convert to Bone's Local Space by mul invert of parent bone rotation

  pose.setBone(bind_a.idx, rot)

  pose_a.world.position.copy(p_wt.position)
  pose_a.world.quaternion.copy(p_wt.quaternion)
  pose_a.world.scale.copy(p_wt.scale)

  transformAdd(pose_a.world, { ...bind_a.local, quaternion: rot })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Bone B
  rad = Math.PI - lawCosinesSSS(a_len, bh_len, ta_len)

  rot
    .copy(pose_a.world.quaternion)
    .multiply(bind_b.local.quaternion) // Add Bone Local to get its WS rot
    .premultiply(new Quaternion().setFromAxisAngle(axis.x, rad)) // Rotate it by the target's x-axis .pmul( tmp.from_axis_angle( this.axis.x, rad ) )
    .premultiply(pose_a.world.quaternion.clone().invert()) // Convert to Local Space in temp to save WS rot for next bone.

  pose.setBone(bind_b.idx, rot)

  pose_b.world.position.copy(pose_a.world.position)
  pose_b.world.quaternion.copy(pose_a.world.quaternion)
  pose_b.world.scale.copy(pose_a.world.scale)

  transformAdd(pose_b.world, { ...bind_b.local, quaternion: rot })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Bone C
  rad = Math.PI - lawCosinesSSS(c_len, bh_len, tb_len)
  rot
    .copy(pose_b.world.quaternion)
    .multiply(bind_c.local.quaternion) // Still contains WS from previous bone, Add next bone's local
    .premultiply(new Quaternion().setFromAxisAngle(axis.x, -rad)) // Rotate it by the target's x-axis
    .premultiply(pose_b.world.quaternion.invert()) // Convert to Bone's Local Space

  pose.setBone(bind_c.idx, rot)

  pose_c.world.position.copy(pose_b.world.position)
  pose_c.world.quaternion.copy(pose_b.world.quaternion)
  pose_c.world.scale.copy(pose_b.world.scale)

  transformAdd(pose_c.world, { ...bind_c.local, quaternion: rot })
}

// Computing Transforms, Parent -> Child
/**
 *
 * @param target target transform (will be modified)
 * @param source source transform
 */
export function transformAdd(target: PoseBoneTransform, source: PoseBoneTransform) {
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // POSITION - parent.position + ( parent.rotation * ( parent.scale * child.position ) )
  // pos.add( Vec3.mul( this.scl, cp ).transform_quat( this.rot ) );
  target.position.add(source.position.clone().multiply(target.scale).applyQuaternion(target.quaternion))

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // SCALE - parent.scale * child.scale
  if (source.scale) target.scale.multiply(source.scale)

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // ROTATION - parent.rotation * child.rotation
  target.quaternion.multiply(source.quaternion)
}

//// helpers

function _aim_bone2(chain: Chain, tpose: Pose, axis: Axis, p_wt: PoseBoneTransform, out: Quaternion) {
  const rot = new Quaternion()
  tpose.bones[chain.first()].bone.getWorldQuaternion(rot) // Get World Space Rotation for Bone
  const dir = chain.altForward.clone().applyQuaternion(rot) // Get Bone's WS Forward Dir

  //Swing
  let q = new Quaternion().setFromUnitVectors(dir, axis.z)
  out.copy(q).multiply(rot)

  // Twist
  // let u_dir = chain.altUp.clone().applyQuaternion(out)
  // let twistx = u_dir.angleTo(axis.y)
  //App.Debug.ln( ct.pos, Vec3.add( ct.pos, u_dir), "white" );

  dir.copy(chain.altUp).applyQuaternion(out) // After Swing, Whats the UP Direction
  let twist = dir.angleTo(axis.y) // Get difference between Swing Up and Target Up

  if (twist <= 0.00017453292) twist = 0
  else {
    //let l_dir  	= Vec3.cross( dir, this.axis.z );
    dir.crossVectors(dir, axis.z) // Get Swing LEFT, used to test if twist is on the negative side.
    //App.Debug.ln( ct.pos, Vec3.add( ct.pos, l_dir), "black" );

    if (dir.dot(axis.y) >= 0) twist = -twist
  }

  out.premultiply(new Quaternion().setFromAxisAngle(axis.z, twist)) // Apply Twist
}
