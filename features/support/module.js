const globalMercator = require('global-mercator')
const axios = require('axios')
const { VectorTile } = require('mapbox-vector-tile')

const defaultZoom = 14

/**
 * 緯度経度からタイル番号に変換する
 *
 * @param {*} lng
 * @param {*} lat
 * @param {*} zoom
 * @returns
 */
const lnglatToTile = (lng, lat, zoom = defaultZoom) => {
  return google = globalMercator.lngLatToGoogle([lng, lat], zoom)
}

/**
 * ベクトルタイルを取得してGeoJSONに変換する
 *
 * @param {*} tileUrl
 * @param {*} x
 * @param {*} y
 * @param {*} z
 * @returns
 */
const getTile = async (tileUrl, x, y, z) => {
  const url = tileUrl.replace('{z}', String(z)).replace('{x}', String(x)).replace('{y}', String(y))

  let buffer

  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' })
    buffer = Buffer.from(res.data, 'binary')
  } catch (error) {
    throw new Error(error)
  }

  const tile = new VectorTile(buffer)

  let layers = Object.keys(tile.layers)

  if (!Array.isArray(layers)) layers = [layers]

  const features = []

  for (let i = 0; i < layers.length; i++) {
    const layerID = layers[i]

    const layer = tile.layers[layerID]
    if (layer) {
      for (let j = 0; j < layer.length; j++) {
        const feature = layer.feature(j).toGeoJSON(x, y, z)
        if (layers.length > 1) feature.properties.vt_layer = layerID

        const geojson = {
          type: 'FeatureCollection',
          features: [feature],
        }

        features.push(geojson)
      }
    }
  }

  return features
}

/**
 * テキストから緯度経度を抽出する
 * @param {*} text
 * @returns
 */
const textToLngLat = (text) => {
  let match = []

  let lng = 0
  let lat = 0

  match = text.match(/緯度.*?(\-?[0-9]+\.?[0-9]+).*?経度.*?(\-?[0-9]+\.?[0-9]+)/)
  if (match) {
    lng = match[2]
    lat = match[1]
  } else {
    match = text.match(/.*?(\-?[0-9]+\.?[0-9]+).*?(\-?[0-9]+\.?[0-9]+)/)
    if (match) {
      lng = match[2]
      lat = match[1]
    }
  }

  return [Number(lng), Number(lat)]
}

const addLocations = (object, lnglat) => {
  object.locations.push(lnglat)
}

const getLocations = (object) => {
  return object.locations
}

module.exports = {
  lnglatToTile,
  getTile,
  textToLngLat,
  addLocations,
  getLocations,
}
