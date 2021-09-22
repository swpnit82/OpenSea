import { Sequelize, DataTypes } from 'sequelize'
import { Application } from '../../../declarations'
import generateShortId from '../../util/generate-short-id'
import config from '../../appconfig'

const COLLECTION_API_ENDPOINT = `${config.server.url}/collection`

export default (app: Application): any => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const collection = sequelizeClient.define(
    'collection',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true
      },
      sid: {
        type: DataTypes.STRING,
        defaultValue: (): string => generateShortId(8),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      version: DataTypes.INTEGER,
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: true,
        get(this: any): string | JSON {
          const metaData = this.getDataValue('metadata')
          if (!metaData) {
            return ''
          } else {
            return metaData
          }
        }
      },
      isPublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      url: {
        type: DataTypes.VIRTUAL,
        get(this: any): string {
          return `${COLLECTION_API_ENDPOINT}/${this.id as string}`
        },
        set(): void {
          throw new Error('Do not try to set the `url` value!')
        }
      },
      ownedFileIds: {
        type: DataTypes.TEXT({ length: 'medium' }),
        allowNull: true
      }
    },
    {
      hooks: {
        beforeCount(options: any): void {
          options.raw = true
        }
      }
    }
  )

  ;(collection as any).associate = (models: any): void => {
    ;(collection as any).belongsTo(models.collection_type, { foreignKey: 'type', required: true })
    ;(collection as any).belongsTo(models.static_resource, {
      as: 'thumbnail_owned_file',
      required: false,
      constraints: false
    })
    ;(collection as any).hasMany(models.entity, { required: false, constraints: false, delete: 'cascade' })
    ;(collection as any).belongsTo(models.location)
  }

  return collection
}
