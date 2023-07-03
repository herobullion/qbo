import { GetQBOQueryableEntityType, QBOQueryableEntityType, SnakeToCamelCase } from "./types";
import { Config } from "./config";
import {
  getJson,
  getSignalForTimeout,
  isQueryableEntity,
  makeRequestURL,
  recastAbortError, snakeCaseToCamelCase,
  tokenAuth
} from "./utils";
import { v4 as uuid } from "uuid";

export type QueryResponse<T extends QBOQueryableEntityType> = {
  [K in T as SnakeToCamelCase<K> extends SnakeToCamelCase<T> ? SnakeToCamelCase<T> : never]: GetQBOQueryableEntityType<T>
} & {
  time: string
};

interface UpsertInit {
  config: Config
}
export interface UpsertArgs<T extends QBOQueryableEntityType> {
  entity: T,
  record: GetQBOQueryableEntityType<T>
}

export const upsert = ({
  config
}: UpsertInit) => async <T extends QBOQueryableEntityType>({
  entity,
  record
}: UpsertArgs<T>): Promise<GetQBOQueryableEntityType<T>> => {
  if (!isQueryableEntity(entity)) {
    throw new Error(`Invalid entity: ${entity}`);
  }

  const Entity = snakeCaseToCamelCase(entity);
  const url = makeRequestURL({
    config,
    path: `/${Entity.toLowerCase()}`
  });

  const data = await fetch(url, {
    method: "POST",
    headers: {
      "User-Agent": "qbo-api",
      "Request-Id": uuid(),
      "Authorization": tokenAuth({ config }),
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(record),
    signal: getSignalForTimeout({ config })
  })
    .then(getJson<QueryResponse<T>>())
    .catch(recastAbortError);

  return data[Entity];
};