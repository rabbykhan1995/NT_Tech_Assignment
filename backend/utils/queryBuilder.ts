import {
  SQL,
  and,
  asc,
  count,
  desc,
  ilike,
  or,
} from "drizzle-orm";
import db, { QueryClient } from "../drizzle/src";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

interface PaginateOptions<T> {
  page?: number;
  limit?: number;

  search?: string;
  searchColumns?: any[];

  where?: SQL[];

  query: {
    findMany: (args: any) => Promise<T[]>;
  };

  countTable: any;

  db?: QueryClient;

  with?: Record<string, any>;

  orderBy?: any | any[];
  columns?: Record<string, boolean>;
}

export const paginateQuery = async <T>({
  db: client = db,
  query,
  countTable,

  page = 1,
  limit = 10,

  search,
  searchColumns = [],

  where,

  with: relations,

  columns,
  orderBy,
}: PaginateOptions<T>): Promise<PaginatedResult<T>> => {
  const offset = (Number(page) - 1) * Number(limit);

  const conditions: SQL[] = [...(where ?? [])];

  if (search && searchColumns.length) {
    conditions.push(
      or(
        ...searchColumns.map((column) =>
          ilike(column, `%${search}%`)
        )
      )!
    );
  }

  const finalWhere =
    conditions.length > 0
      ? and(...conditions)
      : undefined;

  const [items, totalRows] = await Promise.all([
    query.findMany({
      columns,
      where: finalWhere,
      with: relations,
      orderBy,
      limit: Number(limit),
      offset,
    }),

    client
      .select({
        total: count(),
      })
      .from(countTable)
      .where(finalWhere),
  ]);

  return {
    items: items as T[],
    total: Number(totalRows[0]?.total ?? 0),
    page,
    limit,
  };
};