export default class PaginationOptions {
  page: number = 1;
  limit: number = 10;
  pagingCounter: number = 0;
  totalDocs: number = 0;
  totalPages: number = 0;
  hasNextPage: Boolean = false;
  hasPrevPage: Boolean = false;
  nextPage: any = null;
  prevPage: any = null;
}
