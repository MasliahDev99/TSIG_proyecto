
export function getUniqueAttributes(layer, attribute) {
  const source = layer.getSource()
  const features = source.getFeatures()
  const values = features.map(f => f.get(attribute)).filter(v => !!v)
  const unique = [...new Set(values)]
  return unique.map(val => ({ label: val, value: val }))
}
