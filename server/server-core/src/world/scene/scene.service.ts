import { ServiceAddons } from '@feathersjs/feathers'
import { Application } from '../../../declarations'
import { Scene } from './scene.class'
import createModel from './scene.model'
import hooks from './scene.hooks'

declare module '../../../declarations' {
  interface ServiceTypes {
    scene: Scene & ServiceAddons<any>
  }
}

export default (app: Application): void => {
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
  app.use('/scene', new Scene(options, app))

  /**
   * Get our initialized service so that we can register hooks
   *
   * @author Vyacheslav Solovjov
   */
  const service = app.service('scene')

  service.hooks(hooks as any)
}
