import { format } from 'url';
import { JsonApiParams } from '../types';
import { format as formatJasonApiParams } from './json-api-params';

export function getToManyLinks(type: string, baseUrl?: URL, params?: JsonApiParams) {
  return {
    self: format({
      protocol: baseUrl?.protocol,
      host: baseUrl?.host,
      pathname: type,
      search: params && new URLSearchParams(formatJasonApiParams(params)).toString(),
    }),
  }
}


export function getToOneLinks(type: string, id?: string, baseUrl?: URL, params?: JsonApiParams) {
  return {
    self: format({
      protocol: baseUrl?.protocol,
      host: baseUrl?.host,
      pathname: `${type}/${id}`,
      search: params && new URLSearchParams(formatJasonApiParams(params)).toString(),
    }),
  };
}
