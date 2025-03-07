import { GraphQLClient } from 'graphql-request'
import type { NextApiRequest, NextApiResponse } from 'next'

import { endpoint } from '@/api/endpoint'
import { ParsedArgs } from '@/api/graphql-fetch'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { query, variables } = req.body as ParsedArgs

  if (!req.headers.cookie)
    res.status(403).json({ message: 'No auth cookie provided!' })

  function executeQuery() {
    const client = new GraphQLClient(endpoint, {
      credentials: 'include',
      headers: { Cookie: req.headers.cookie! },
    })
    return client.request(query, variables)
  }

  res.json(await executeQuery())
}

export const config = {
  api: {
    externalResolver: true,
  },
}
