// Initializes the `feed` service on path `/feed`
// import { ServiceAddons } from '@feathersjs/feathers';
import { Application } from '../../../declarations'
import createModel from './block-creator.model'
import hooks from './block-creator.hooks'
import { BlockCreator } from './block-creator.class'

// Add this service to the service type index
// declare module '../../../declarations' {
//   interface ServiceTypes {
//     'FeedBookmark': FeedBookmark & ServiceAddons<any>;
//   }
// }

export default function (app: Application): void {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate')
  }

  // Initialize our service with any options it requires
  app.use('/block-creator', new BlockCreator(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('block-creator')

  service.hooks(hooks as any)
}
