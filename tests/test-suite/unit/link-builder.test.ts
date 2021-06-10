import { JsonApiParams } from "../../../src/types";
import { LinkBuilder } from "../../../src/link-builder";


describe("LinkBuilder", () => {
  const baseUrl = new URL('https://localhost:3000');

  it("queryLink method works correctly", async () => {
    const linkBuilder = new LinkBuilder({
      namespace: 'api',
      baseUrl,
    });

    const resourceType = 'article';

    const params: JsonApiParams = {
      include: ['vote','user'],
      sort: ['name', 'createdAt'],
      filter: { name: 'John' },
      page: { number: 1, size: 1 },
      fields: { articles: ['title', 'body'] }
    }

    const link = linkBuilder.queryLink(resourceType, params);

    expect(link).toEqual(`https://localhost:3000/api/article?include=vote,user&sort=name,createdAt&filter[name]=John&page[number]=1&page[size]=1&fields[articles]=title,body`);
  });

  it("selfLink method works correctly", async () => {
    const linkBuilder = new LinkBuilder({
      namespace: 'api',
      baseUrl,
    });

    const resourceType = 'article';
    const id = '1';

    const params: JsonApiParams = {
      include: ['vote','user'],
      fields: { articles: ['title', 'body'] }
    }

    const link = linkBuilder.selfLink(resourceType, id, params);

    expect(link).toEqual(`https://localhost:3000/api/article/1?include=vote,user&fields[articles]=title,body`);
  });
});
