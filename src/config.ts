export interface IMConfig {
  url: string;
  mode: 'video' | 'iframe';
}

export default {
  properties: [
    {
      name: 'url',
      label: 'URL de la fuente',
      type: 'string'
    },
    {
      name: 'mode',
      label: 'Modo (video|iframe)',
      type: 'string'
    }
  ]
};