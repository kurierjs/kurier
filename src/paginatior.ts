import { LinksPageParams, JsonApiParams } from './types';

export class Paginator {
  public static readonly requiresRecordCount: boolean = false;

  constructor(params?: JsonApiParams) {}

  public apply(relation) {}

  public linksPageParams(recordCount: number): LinksPageParams {
    return {};
  };
}

export type OffsetPaginatorParams = 'limit' | 'offset';

export class OffsetPaginator extends Paginator {

  public static readonly requiresRecordCount: boolean = true;

  constructor(params) {
    super(params);
  }
}

export type PagedPaginatorParams = 'size' | 'number';

export class PagedPaginator extends Paginator {
  private number: number;
  private size: number;

  public static readonly requiresRecordCount: boolean = true;

  constructor(params?: JsonApiParams) {
    super(params);

    this.parsePaginationParams(params);
    this.verifyPaginationParams();
  }

  public apply(relation) {
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

  private calculatePageCount(recordCount: number) {
    return Math.ceil(recordCount / this.size);
  }

  private parsePaginationParams(params?: JsonApiParams) {

  }

  private verifyPaginationParams() {

  }
}
