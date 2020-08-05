import { serloDomain } from '../../helper/serlo-domain'
import { InstanceData } from '@/data-types'

export const headerData: InstanceData['headerData'] = [
  {
    url: '',
    title: 'Temas',
    icon: 'subject',
    children: [
      { url: '/169578', title: 'Matemáticas' },
      { url: '/community/sandbox', title: 'Sandbox' },
    ],
  },
  { url: '/serlo', title: 'Sobre Serlo', icon: 'about' },
  { url: '/participa', title: '¡Participa!', icon: 'participate' },
  {
    url: '',
    title: 'Comunidad',
    icon: 'community',
    children: [
      {
        url: '/community',
        title: 'Página para autores',
      },
      { url: 'https://community.serlo.org/', title: 'Chat para autores' },
      { url: '/entity/unrevised', title: 'Cambios en revisión' },
    ],
  },
]

export const footerData: InstanceData['footerData'] = {
  footerNavigation: [
    {
      title: 'Configuración General',
      children: [
        { title: 'A cerca de Serlo', url: '/serlo' },
        { title: '¡Participa!', url: '/participa' },
        { title: 'Contactanos', url: '/41043' },
        {
          title: 'Serlo en otros idiomas',
          url: `https://en.${serloDomain}/global`,
        },
        {
          title: 'API',
          url: `https://en.${serloDomain}/community/technology-and-development/content-api`,
        },
      ],
    },
    {
      title: 'Mantente en contacto',
      children: [
        {
          title: 'GitHub',
          url: 'https://github.com/serlo',
          icon: 'github',
        },
      ],
    },
    {
      title: 'Términos legales',
      children: [
        {
          title: 'Politica de privacidad',
          url: `https://es.${serloDomain}/privacy`,
        },
        {
          title: 'Términos legales',
          url: `https://es.${serloDomain}/terms`,
        },
        { title: 'Imprint', url: `https://es.${serloDomain}/imprint` },
      ],
    },
  ],
  aboutHref: '/serlo',
  participationHref: '/27469',
  donationHref: '/spenden',
}
