import { format } from 'url';
import { JsonApiParams } from '../types';
import { format as formatJasonApiParams } from './json-api-params';
export interface IRelationshipLinksOptions {
  type: string;
  id: string;
  relName: string;
  baseUrl?: URL;
  params?: JsonApiParams;
}

export function getRelationshipLinks({ type, id, relName, baseUrl, params }: IRelationshipLinksOptions) {
  return {
    self: format({
      protocol: baseUrl?.protocol,
      host: baseUrl?.host,
      pathname: `${type}/${id}/relationships/${relName}`,
      search: params && new URLSearchParams(formatJasonApiParams(params)).toString(),
    }),
    related: format({
      protocol: baseUrl?.protocol,
      host: baseUrl?.host,
      pathname: `${type}/${id}/${relName}`,
      search: params && new URLSearchParams(formatJasonApiParams(params)).toString(),
    })
  }
}
