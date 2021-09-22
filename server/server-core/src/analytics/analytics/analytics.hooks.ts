import * as authentication from '@feathersjs/authentication'
import restrictUserRole from '../../hooks/restrict-user-role'
import * as commonHooks from 'feathers-hooks-common'

const { authenticate } = authentication.hooks

export default {
  before: {
    all: [authenticate('jwt'), commonHooks.iff(commonHooks.isProvider('external'), restrictUserRole('admin') as any)],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
} as any
