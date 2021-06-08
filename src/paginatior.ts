import { camelize } from './utils/string';

export type LinksPageParams<TPaginatorParams extends string = string> = {
  first?: Record<TPaginatorParams, number>,
  prev?: Record<TPaginatorParams, number>,
  next?: Record<TPaginatorParams, number>,
  last?: Record<TPaginatorParams, number>,
}

export abstract class Paginator {
  public static readonly requiresRecordCount: boolean = false;

  public apply(relation, orderOptions) {}

  public linksPageParams(recordCount: number): LinksPageParams {
    return {};
  };

  public static paginatorFor(paginator) {
    const paginatorClassName = `${camelize(paginator.toString())}Paginator`;

    // todo
  }
}

export type OffsetPaginatorParams = 'limit' | 'offset';

export class OffsetPaginator extends Paginator {

  public static readonly requiresRecordCount: boolean = true;

  constructor() {
    super();
  }
}

export type PagedPaginatorParams = 'size' | 'number';

export class PagedPaginator extends Paginator {
  private number: number;
  private size: number;

  public static readonly requiresRecordCount: boolean = true;

  constructor(params) {
    super();

    this.parsePaginationParams(params);
    this.verifyPaginationParams();
  }

  public calculatePageCount(recordCount: number) {
    return Math.ceil(recordCount / this.size);
  }

  public apply(relation, _orderOptions) {
    const offset = (this.number - 1) * this.size;

    relation.offset(offset).limit(this.size);
  }

  public linksPageParams(recordCount: number): LinksPageParams<PagedPaginatorParams> {
    const pageCount = this.calculatePageCount(recordCount);

    const linksPageParams = {
      first: {
        number: 1,
        size: this.size,
      },
    };

    if (this.number > 1) {
      linksPageParams['prev'] = {
        number: this.number - 1,
        size: this.size
      };
    }

    if (this.number < pageCount) {
      linksPageParams['next'] = {
        number: this.number + 1,
        size: this.size,
      }
    }

    if (recordCount) {
      linksPageParams['last'] = {
        number: pageCount == 0 ? 1 : pageCount,
        size: this.size,
      }
    }

    return linksPageParams;
  }

  private parsePaginationParams(params) {

  }

  private verifyPaginationParams() {

  }
}
