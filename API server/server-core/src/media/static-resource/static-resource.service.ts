import { ServiceAddons } from '@feathersjs/feathers'
import { Application } from '../../../declarations'
import { StaticResource } from './static-resource.class'
import createModel from './static-resource.model'
import createOwnedFileModel from '../owned-file.model'
import hooks from './static-resource.hooks'
import staticResourceDocs from './static-resource.docs'

declare module '../../../declarations' {
  interface ServiceTypes {
    'static-resource': StaticResource & ServiceAddons<any>
  }
}

export default (app: Application): any => {
  createOwnedFileModel(app)

  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  }

  /**
   * Initialize our service with any options it requires and docs
   *
   * @author Vyacheslav Solovjov
   */
  const event = new StaticResource(options, app)
  event.docs = staticResourceDocs

  app.use('/static-resource', event)

  /**
   * Get our initialized service so that we can register hooks
   *
   * @author Vyacheslav Solovjov
   */
  const service = app.service('static-resource')

  service.hooks(hooks as any)
}
