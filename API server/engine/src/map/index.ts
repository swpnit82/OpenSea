import { Position, Polygon, MultiPolygon } from 'geojson'
import { Group } from 'three'
import { NavMesh } from 'yuka'
import { Engine } from '../ecs/classes/Engine'
import { fetchRasterTiles, fetchVectorTiles, getCenterTile } from './MapBoxClient'
import { MapProps } from './MapProps'
import {
  createBuildings,
  createGroundMesh,
  createRoads,
  createWater,
  createLandUse,
  createLabels,
  setGroundScaleAndPosition
} from './MeshBuilder'
import { NavMeshBuilder } from './NavMeshBuilder'
import { TileFeaturesByLayer } from './types'
import pc from 'polygon-clipping'
import { computeBoundingBox, scaleAndTranslate } from './GeoJSONFns'
import { METERS_PER_DEGREE_LL } from './constants'

let centerCoord = {}
let centerTile = {}
let scaleArg

export const create = async function (args: MapProps) {
  console.log('addmap called with args:', args)
  const center = await getStartCoords(args)
  const vectorTiles = await fetchVectorTiles(center)
  const rasterTiles = (args as any).showRasterTiles ? await fetchRasterTiles(center) : []

  const group = new Group()
  const buildingMesh = createBuildings(vectorTiles, center)
  const groundMesh = createGroundMesh(rasterTiles as any, center[1])
  const roadsMesh = createRoads(vectorTiles, center)
  const waterMesh = createWater(vectorTiles, center)
  const landUseMesh = createLandUse(vectorTiles, center)
  const labels = createLabels(vectorTiles, center)

  ;[buildingMesh, roadsMesh, waterMesh, landUseMesh, groundMesh].forEach((mesh) => {
    group.add(mesh)
  })

  setGroundScaleAndPosition(groundMesh, buildingMesh)

  labels.forEach((label) => {
    group.add(label.object3d)
  })

  const navMesh = generateNavMesh(vectorTiles, center, args.scale.x * METERS_PER_DEGREE_LL)

  group.name = 'MapObject'
  centerCoord = Object.assign(center)
  centerTile = Object.assign(getCenterTile(center))
  scaleArg = args.scale.x

  return { mapMesh: group, buildingMesh, groundMesh, roadsMesh, navMesh, labels }
}

const generateNavMesh = function (tiles: TileFeaturesByLayer[], center: Position, scale: number): NavMesh {
  const builder = new NavMeshBuilder()
  const gBuildings = tiles
    .reduce((acc, tiles) => acc.concat(tiles.building), [])
    .map((feature) => {
      return scaleAndTranslate(feature.geometry as Polygon | MultiPolygon, center as any, scale)
    })

  const gGround = computeBoundingBox(gBuildings)
  let gBuildingNegativeSpace = [gGround.coordinates]
  gBuildings.forEach((gPositiveSpace) => {
    gBuildingNegativeSpace = pc.difference(gBuildingNegativeSpace as any, gPositiveSpace.coordinates as any)
  })
  builder.addGeometry({ type: 'MultiPolygon', coordinates: gBuildingNegativeSpace })
  return builder.build()
}

export const update = async function (args: MapProps, longtitude, latitude, position) {
  console.log('addmap called with args:', args)
  const center = [longtitude, latitude]
  const vectorTiles = await fetchVectorTiles(center)
  const rasterTiles = (args as any).showRasterTiles ? await fetchRasterTiles(center) : []

  const group = new Group()
  const buildingMesh = createBuildings(vectorTiles, center)
  const groundMesh = createGroundMesh(rasterTiles as any, center[1])
  const roadsMesh = createRoads(vectorTiles, center)

  setGroundScaleAndPosition(groundMesh, buildingMesh)

  group.add(buildingMesh)

  group.add(roadsMesh)

  group.add(groundMesh)

  const navMesh = generateNavMesh(vectorTiles, center, args.scale.x * METERS_PER_DEGREE_LL)

  group.add(createGroundMesh(rasterTiles as any, center[1]))

  group.position.multiplyScalar(args.scale.x)
  group.scale.multiplyScalar(args.scale.x)
  group.position.set(position.x, 0, position.z)
  group.name = 'MapObject'
  // centerCoord = Object.assign(center)
  centerTile = Object.assign(getCenterTile(center))

  return { mapMesh: group, buildingMesh, groundMesh, roadsMesh, navMesh }
}

export function getStartCoords(props: MapProps): Promise<Position> {
  if (props.useDeviceGeolocation) {
    return new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(({ coords }) => resolve([coords.longitude, coords.latitude]), reject)
    )
  }

  // Default to downtown ATL
  return Promise.resolve([parseFloat(props.startLongitude) || -84.388, parseFloat(props.startLatitude) || 33.749])
}

export const getCoord = () => {
  return centerCoord
}

export const getTile = () => {
  return centerTile
}

export const getScaleArg = () => {
  return scaleArg
}
