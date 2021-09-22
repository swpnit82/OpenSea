import config from '../../appconfig'
import { collectionSeed } from '../collection/collection.seed'
export const entitySeed = {
  path: 'entity',
  randomize: false,
  templates: [
    {
      id: '08c8a840-24e9-11eb-bc2e-e7e742fb069f',
      entityId: '2266BED7-6CC4-48A6-95DD-9BCD3CF9EAFC',
      name: 'crater',
      parent: null,
      index: null,
      createdAt: '2020-11-12 13:14:45',
      updatedAt: '2020-11-12 13:14:45',
      collectionId: collectionSeed.templates.find((template) => template.id === 'd4457fc0-24e4-11eb-bc2e-e7e742fb069f')
        .id
    },
    {
      id: '08c8a843-24e9-11eb-bc2e-e7e742fb069f',
      entityId: '1463EAC0-883F-493A-9A33-6757CC8FF48B',
      name: 'scene preview camera',
      parent: '2266BED7-6CC4-48A6-95DD-9BCD3CF9EAFC',
      index: 2,
      createdAt: '2020-11-12 13:14:45',
      updatedAt: '2020-11-12 13:14:45',
      collectionId: collectionSeed.templates.find((template) => template.id === 'd4457fc0-24e4-11eb-bc2e-e7e742fb069f')
        .id
    },
    {
      id: '08c8a846-24e9-11eb-bc2e-e7e742fb069f',
      entityId: 'ED0888E7-4032-4DD9-9B43-59B02ECCCB7E',
      name: 'Skybox',
      parent: '2266BED7-6CC4-48A6-95DD-9BCD3CF9EAFC',
      index: 5,
      createdAt: '2020-11-12 13:14:45',
      updatedAt: '2020-11-12 13:14:45',
      collectionId: collectionSeed.templates.find((template) => template.id === 'd4457fc0-24e4-11eb-bc2e-e7e742fb069f')
        .id
    },
    {
      id: '1B698482-C15A-4CEC-9247-03873520DF70',
      entityId: '1B698482-C15A-4CEC-9247-03873520DF70',
      name: 'Ground Plane',
      parent: '2266BED7-6CC4-48A6-95DD-9BCD3CF9EAFC',
      index: 5,
      createdAt: '2020-11-12 13:14:45',
      updatedAt: '2020-11-12 13:14:45',
      collectionId: collectionSeed.templates.find((template) => template.id === 'd4457fc0-24e4-11eb-bc2e-e7e742fb069f')
        .id
    },
    {
      id: '1B698483-C15A-4CEC-9247-03873520DF70',
      entityId: '1B698483-C15A-4CEC-9247-03873520DF70',
      name: 'Spawn Point',
      parent: '2266BED7-6CC4-48A6-95DD-9BCD3CF9EAFC',
      index: 6,
      createdAt: '2020-11-12 13:14:45',
      updatedAt: '2020-11-12 13:14:45',
      collectionId: collectionSeed.templates.find((template) => template.id === 'd4457fc0-24e4-11eb-bc2e-e7e742fb069f')
        .id
    },
    {
      id: '1B698484-C15A-4CEC-9247-03873520DF70',
      entityId: '1B698484-C15A-4CEC-9247-03873520DF70',
      name: 'Post Processing',
      parent: '2266BED7-6CC4-48A6-95DD-9BCD3CF9EAFC',
      index: 7,
      createdAt: '2020-11-12 13:14:45',
      updatedAt: '2020-11-12 13:14:45',
      collectionId: collectionSeed.templates.find((template) => template.id === 'd4457fc0-24e4-11eb-bc2e-e7e742fb069f')
        .id
    },
    {
      id: '1B698484-C15A-4CEC-9247-03873520DF71',
      entityId: '1B698484-C15A-4CEC-9247-03873520DF71',
      name: 'Hemisphere Light',
      parent: '2266BED7-6CC4-48A6-95DD-9BCD3CF9EAFC',
      index: 8,
      createdAt: '2020-11-12 13:14:45',
      updatedAt: '2020-11-12 13:14:45',
      collectionId: collectionSeed.templates.find((template) => template.id === 'd4457fc0-24e4-11eb-bc2e-e7e742fb069f')
        .id
    },
    {
      id: '1A698484-D15A-4DED-9247-03873520DX70',
      entityId: '1A698484-D15A-4DED-9247-03873520DX70',
      name: 'Cubemap bake',
      parent: '2266BED7-6CC4-48A6-95DD-9BCD3CF9EAFC',
      index: 9,
      createdAt: '2020-11-12 13:14:45',
      updatedAt: '2020-11-12 13:14:45',
      collectionId: collectionSeed.templates.find((template) => template.id === 'd4457fc0-24e4-11eb-bc2e-e7e742fb069f')
        .id
    }
  ]
}
